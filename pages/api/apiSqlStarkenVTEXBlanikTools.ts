// pages/api/consultar-pedidos-blanik.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import sql, { ConnectionPool } from 'mssql';
import { decodeBase64 } from '../../utils/decrypt';

// Validación de variables de entorno para la conexión a SQL
if (
  !process.env.AWS_SAP_USER ||
  !process.env.AWS_SAP_PASSWORD ||
  !process.env.AWS_SAP_SERVER ||
  !process.env.AWS_SAP_DATABASE ||
  !process.env.AWS_SAP_PORT
) {
  throw new Error('Faltan variables de entorno requeridas para la conexión a SQL');
}

// Configuración de conexión a SQL
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
 * Endpoint API que consulta todos los pedidos de Blanik (ambos tipos de despacho)
 * independientemente de su estado
 * 
 * Filtra:
 *  - Pedidos cuyo Ecommerce sea 'BLANIK_VTEX'
 *  - Sin filtrar por estado para obtener todos los registros
 *
 * Se hace un JOIN entre las tablas pedidos_externos_estado y pedidos_externos para obtener:
 *  - internalId (idpedido)
 *  - FechaPedido y externalCode (CódigoExterno)
 *  - deliveryCompany, otDeliveryCompany y urlDeliveryCompany
 *  - estado (para referencia)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo se permite el método GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  }

  try {
    console.log('=== INICIO DE CONSULTA DE PEDIDOS BLANIK ===');

    // Obtener conexión a la base de datos
    const pool = await getConnectionPool();
    console.log('Conexión a la base de datos establecida.');

    // Definir la consulta SQL sin filtrar por estado ni estado_envio para incluir todos los pedidos
    const query = `
      SELECT 
        pedidos_externos_estado.idpedido AS internalId,
        pedidos_externos.FechaPedido,
        pedidos_externos.CodigoExterno AS externalCode,
        pedidos_externos.deliveryCompany,
        pedidos_externos.otDeliveryCompany,
        pedidos_externos.urlDeliveryCompany,
        pedidos_externos_estado.estado,
        pedidos_externos_estado.estado_envio
      FROM pedidos_externos
      LEFT JOIN pedidos_externos_estado
        ON pedidos_externos.ID = pedidos_externos_estado.idpedido
      WHERE 
        pedidos_externos.Ecommerce = 'BLANIK_VTEX'
      ORDER BY pedidos_externos.FechaPedido DESC
    `;
    console.log('Ejecutando query:');
    console.log(query);

    // Ejecutar la consulta SQL
    const { recordset } = await pool.request().query(query);
    console.log(`Consulta ejecutada. Registros encontrados: ${recordset.length}`);

    // Si no se encuentra ningún registro, informar
    if (!recordset || recordset.length === 0) {
      console.log('No se encontraron registros.');
      return res.status(200).json({ message: 'No se encontraron registros.' });
    }

    console.log('=== FIN DE CONSULTA DE PEDIDOS BLANIK ===');
    return res.status(200).json({ data: recordset });
  } catch (error) {
    console.error('Error al ejecutar la consulta:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}