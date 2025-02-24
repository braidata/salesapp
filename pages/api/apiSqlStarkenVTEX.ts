// pages/api/procesar-pedidos.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import sql, { ConnectionPool } from 'mssql';
import { decodeBase64 } from '../../utils/decrypt';

// Validación de variables de entorno necesarias para la conexión a SQL
if (
  !process.env.AWS_SAP_USER ||
  !process.env.AWS_SAP_PASSWORD ||
  !process.env.AWS_SAP_SERVER ||
  !process.env.AWS_SAP_DATABASE ||
  !process.env.AWS_SAP_PORT
) {
  throw new Error('Faltan variables de entorno requeridas para la conexión a SQL');
}
const baseUrl = process.env.NEXTAUTH_URL || '';

const config: sql.config = {
  user: process.env.AWS_SAP_USER,
  password: decodeBase64(process.env.AWS_SAP_PASSWORD),
  server: process.env.AWS_SAP_SERVER,
  port: parseInt(process.env.AWS_SAP_PORT, 10),
  database: process.env.AWS_SAP_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

// Pool de conexión global
let pool: ConnectionPool | null = null;
async function getConnectionPool(): Promise<ConnectionPool> {
  if (pool) return pool;
  pool = await sql.connect(config);
  return pool;
}

/**
 * Procesa un pedido dado su id interno y su código externo.
 * - El **externalCode** se usa para consultar el endpoint que retorna el JSON formateado.
 * - El **internalId** (tipo bigint) se usará para actualizar el registro en la base de datos.
 */
async function processOrder(
  internalId: number,
  externalCode: string
): Promise<{
  internalId: number;
  externalCode: string;
  nroOrdenFlete?: number;
  success: boolean;
}> {
  try {
    // Paso 1: Obtener JSON formateado para Starken usando el externalCode
    const endpoint1 = `${baseUrl}api/apiVTEXII?orderId=${externalCode}`;
    console.log(`Consultando datos para externalCode ${externalCode} en: ${endpoint1}`);
    const res1 = await fetch(endpoint1);
    if (!res1.ok) {
      console.error(`Error al obtener datos para externalCode ${externalCode}. Estado: ${res1.status}`);
      return { internalId, externalCode, success: false };
    }
    const formattedData = await res1.json();
    console.log(`Datos formateados para externalCode ${externalCode}:`, formattedData);

    // Paso 2: Enviar datos a Starken
    const endpoint2 = `${baseUrl}api/starken/emisionAPIVTEX`;
    console.log(`Enviando datos a Starken para externalCode ${externalCode} a: ${endpoint2}`);
    const res2 = await fetch(endpoint2, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedData),
    });
    if (!res2.ok) {
      console.error(`Error al enviar datos a Starken para externalCode ${externalCode}. Estado: ${res2.status}`);
      return { internalId, externalCode, success: false };
    }
    const responseData = await res2.json();
    console.log(`Respuesta de Starken para externalCode ${externalCode}:`, responseData);

    // Extraer nroOrdenFlete de la respuesta
    const nroOrdenFlete = responseData.data?.nroOrdenFlete;
    if (nroOrdenFlete === undefined || nroOrdenFlete === null) {
      console.error(`No se obtuvo nroOrdenFlete para externalCode ${externalCode}`);
      return { internalId, externalCode, success: false };
    }

    // Paso 3: Actualizar el estado en la base de datos usando el id numérico (internalId)
    const pool = await getConnectionPool();
    const updateQuery = `
      UPDATE qa_pedidos_externos_estado
      SET estado = 1, time_notificado = GETDATE()
      WHERE idpedido = @orderId
    `;
    await pool.request()
      .input('orderId', sql.BigInt, internalId)
      .query(updateQuery);
    console.log(`Pedido internalId ${internalId} actualizado en qa_pedidos_externos_estado. nroOrdenFlete: ${nroOrdenFlete}`);

    // Actualizar qa_pedidos_externos con otDeliveryCompany y urlDeliveryCompany
    const updateQuery2 = `
      UPDATE qa_pedidos_externos
      SET otDeliveryCompany = @nroOrdenFlete,
          urlDeliveryCompany = CONCAT('https://starken.cl/seguimiento?codigo=', @nroOrdenFlete)
      WHERE ID = @orderId
    `;
    await pool.request()
      .input('nroOrdenFlete', sql.BigInt, nroOrdenFlete)
      .input('orderId', sql.BigInt, internalId)
      .query(updateQuery2);
    console.log(`Pedido internalId ${internalId} actualizado en qa_pedidos_externos. otDeliveryCompany: ${nroOrdenFlete}, urlDeliveryCompany: https://starken.cl/seguimiento?codigo=${nroOrdenFlete}`);

    return { internalId, externalCode, nroOrdenFlete, success: true };
  } catch (error) {
    console.error(`Error procesando internalId ${internalId}, externalCode ${externalCode}:`, error);
    return { internalId, externalCode, success: false };
  }
}

/**
 * Procesa los pedidos pendientes uno a uno.
 * Se obtiene además el id interno (numeric) y el código externo (string) para cada pedido.
 */
async function processOrders(): Promise<
  Array<{ internalId: number; externalCode: string; nroOrdenFlete?: number; success: boolean }>
> {
  const pool = await getConnectionPool();
  
  // Consulta de pedidos pendientes (se incluye el id interno)
  const query = `
    SELECT 
      qa_pedidos_externos_estado.idpedido AS internalId,
      qa_pedidos_externos.FechaPedido, 
      qa_pedidos_externos.CodigoExterno AS externalCode
    FROM 
      qa_pedidos_externos_estado
    INNER JOIN 
      qa_pedidos_externos 
        ON qa_pedidos_externos.ID = qa_pedidos_externos_estado.idpedido
    WHERE 
      Ecommerce = 'VENTUSCORP_VTEX'
      AND ISNULL(qa_pedidos_externos_estado.estado_envio, 0) = 0
      AND qa_pedidos_externos.deliveryCompany = 'Starken'
      AND qa_pedidos_externos_estado.estado = 'T'
    GROUP BY 
      qa_pedidos_externos_estado.idpedido,
      qa_pedidos_externos.FechaPedido, 
      qa_pedidos_externos.CodigoExterno
    ORDER BY 
      qa_pedidos_externos.FechaPedido DESC
  `;
  const { recordset } = await pool.request().query(query);
  
  if (!recordset || recordset.length === 0) {
    console.log('No hay pedidos pendientes para procesar.');
    return [];
  }
  
  const results: Array<{ internalId: number; externalCode: string; nroOrdenFlete?: number; success: boolean }> = [];
  for (const row of recordset) {
    const internalId: number = row.internalId;
    const externalCode: string = row.externalCode;
    console.log(`Procesando pedido: internalId ${internalId}, externalCode ${externalCode}`);
    const result = await processOrder(internalId, externalCode);
    results.push(result);
    // Retardo de 2 segundos entre cada pedido para evitar saturación
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}

/**
 * Endpoint API:
 * Al acceder con método GET, filtra los pedidos pendientes, los procesa uno a uno
 * y devuelve el resultado, incluyendo el nroOrdenFlete (si se obtuvo) para cada pedido.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  }

  try {
    const results = await processOrders();
    return res.status(200).json({
      message: 'Proceso completado',
      results,
    });
  } catch (error) {
    console.error('Error procesando pedidos:', error);
    return res.status(500).json({ message: 'Error procesando pedidos' });
  }
}
