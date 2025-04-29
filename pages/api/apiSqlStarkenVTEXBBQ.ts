// pages/api/procesar-pedidos.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import sql, { ConnectionPool } from 'mssql';
import { decodeBase64 } from '../../utils/decrypt';

// Validación de variables de entorno para SQL
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
 * Procesa un pedido de Starken dado su id interno y código externo
 */
async function processStarkenOrder(
  internalId: number,
  externalCode: string
): Promise<{ internalId: number; externalCode: string; nroOrdenFlete?: number; success: boolean }> {
  try {
    // Paso 1: Consultar datos a apiVTEXII para Starken (usando GET)
    const endpoint1 = `${baseUrl}api/apiVTEXIIBBQStarken?orderId=${externalCode}`;
    console.log(`[Starken] Consultando datos para externalCode ${externalCode} en: ${endpoint1}`);
    const res1 = await fetch(endpoint1, { method: 'GET' });
    if (!res1.ok) {
      console.error(`[Starken] Error al obtener datos para externalCode ${externalCode}. Estado: ${res1.status}`);
      return { internalId, externalCode, success: false };
    }
    const formattedData = await res1.json();
    console.log(`[Starken] Datos formateados para externalCode ${externalCode}:`, formattedData);

    // Paso 2: Enviar datos a Starken
    const endpoint2 = `${baseUrl}api/starken/emisionAPIVTEXBL`;
    console.log(`[Starken] Enviando datos a Starken para externalCode ${externalCode} a: ${endpoint2}`);
    const res2 = await fetch(endpoint2, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedData),
    });
    if (!res2.ok) {
      console.error(`[Starken] Error al enviar datos a Starken para externalCode ${externalCode}. Estado: ${res2.status}`);
      return { internalId, externalCode, success: false };
    }
    const responseData = await res2.json();
    console.log(`[Starken] Respuesta de Starken para externalCode ${externalCode}:`, responseData);

    const nroOrdenFlete = responseData.data?.nroOrdenFlete;
    if (nroOrdenFlete === undefined || nroOrdenFlete === null) {
      console.error(`[Starken] No se obtuvo nroOrdenFlete para externalCode ${externalCode}`);
      return { internalId, externalCode, success: false };
    }

    // Paso 3: Actualizar la base de datos
    const pool = await getConnectionPool();
    const updateQuery = `
      UPDATE pedidos_externos_estado
      SET estado_envio = 1, time_notificado = GETDATE()
      WHERE idpedido = @orderId
    `;
    await pool.request().input('orderId', sql.BigInt, internalId).query(updateQuery);
    console.log(`[Starken] Pedido internalId ${internalId} actualizado en pedidos_externos_estado. nroOrdenFlete: ${nroOrdenFlete}`);

    const updateQuery2 = `
      UPDATE pedidos_externos
      SET otDeliveryCompany = @nroOrdenFlete,
          urlDeliveryCompany = CONCAT('https://starken.cl/seguimiento?codigo=', @nroOrdenFlete)
      WHERE ID = @orderId
    `;
    await pool.request()
      .input('nroOrdenFlete', sql.BigInt, nroOrdenFlete)
      .input('orderId', sql.BigInt, internalId)
      .query(updateQuery2);
    console.log(`[Starken] Pedido internalId ${internalId} actualizado en pedidos_externos. OT: ${nroOrdenFlete}`);
    
    return { internalId, externalCode, nroOrdenFlete, success: true };
  } catch (error) {
    console.error(`[Starken] Error procesando internalId ${internalId}, externalCode ${externalCode}:`, error);
    return { internalId, externalCode, success: false };
  }
}

/**
 * Procesa un pedido de 99Min (Nextday o Sameday) dado su id interno y código externo
 */
async function process99MinOrder(
  internalId: number,
  externalCode: string,
  createOrder: boolean,
  deliveryCompany: string
): Promise<{ internalId: number; externalCode: string; nroOrdenFlete?: number; success: boolean }> {
  try {
    // Definir deliveryType según el deliveryCompany
    const deliveryType = deliveryCompany === '99MinSameday' ? 'sameday' : 'nextday';
    
    // Configurar timeout para la solicitud
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos
    
    console.log(`[99Min] Procesando orden ${externalCode} como ${deliveryType} (${deliveryCompany})`);
    
    // La URL base es la misma para GET y POST, pero con parámetros diferentes
    const baseEndpoint = `${baseUrl}api/apiVTEXIIBBQ99`;
    let response;
    
    try {
      if (createOrder) {
        // Para crear la orden usamos POST con el deliveryType correcto
        console.log(`[99Min] [Emitir] Enviando solicitud POST para externalCode ${externalCode}`);
        response = await fetch(baseEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            orderId: externalCode, 
            createOrder: true,
            deliveryType: deliveryType
          }),
          signal: controller.signal
        });
      } else {
        // Si se requiere crear la orden pero estamos en modo GET, cambiamos a modo POST
        // porque vemos que consulta (GET) no devuelve trackingid
        console.log(`[99Min] [Info] Detectada necesidad de crear orden para ${externalCode}`);
        console.log(`[99Min] [Emitir] Enviando solicitud POST para externalCode ${externalCode}`);
        response = await fetch(baseEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            orderId: externalCode, 
            createOrder: true,
            deliveryType: deliveryType
          }),
          signal: controller.signal
        });
      }
      clearTimeout(timeoutId);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error(`[99Min] Timeout excedido para externalCode ${externalCode}`);
        return { internalId, externalCode, success: false };
      }
      console.error(`[99Min] Error en la solicitud para externalCode ${externalCode}:`, error);
      return { internalId, externalCode, success: false };
    }
    
    if (!response.ok) {
      console.error(`[99Min] Error en la respuesta para externalCode ${externalCode}. Estado: ${response.status}`);
      try {
        const errorText = await response.text();
        console.error(`[99Min] Detalles del error: ${errorText}`);
      } catch (error) {
        // Ignorar error al intentar leer el texto del error
      }
      return { internalId, externalCode, success: false };
    }
    
    const responseData = await response.json();
    console.log(`[99Min] Respuesta completa para externalCode ${externalCode}:`, JSON.stringify(responseData));

    // Extraer correctamente el número de orden de 99minutos
    let nroOrdenFlete = null;

    // CASO 1: Cuando se crea una orden nueva (en la respuesta de POST)
    if (responseData.nineteenMinutesOrder) {
      const orderData = responseData.nineteenMinutesOrder;
      
      // Si es una respuesta de tipo multibulto (array de órdenes)
      if (orderData.data && Array.isArray(orderData.data) && orderData.data.length > 0) {
        // Usar el trackingid del primer elemento como OT principal
        nroOrdenFlete = orderData.data[0].trackingid || orderData.data[0].counter;
        console.log(`[99Min] ID de seguimiento extraído de multibulto para ${externalCode}: ${nroOrdenFlete}`);
      } 
      // Si es una respuesta directa
      else if (typeof orderData.data === 'object') {
        nroOrdenFlete = orderData.data.trackingid || orderData.data.id;
        console.log(`[99Min] ID de seguimiento extraído de respuesta directa para ${externalCode}: ${nroOrdenFlete}`);
      }
      // Si el ID viene en la raíz
      else {
        nroOrdenFlete = orderData.trackingid || orderData.id;
        console.log(`[99Min] ID de seguimiento extraído de raíz para ${externalCode}: ${nroOrdenFlete}`);
      }
    }
    // CASO 2: Respuesta directa cuando no hay nineteenMinutesOrder
    else if (responseData.data) {
      // Si data es un array (multibulto)
      if (Array.isArray(responseData.data) && responseData.data.length > 0) {
        nroOrdenFlete = responseData.data[0].trackingid || responseData.data[0].counter;
        console.log(`[99Min] ID de seguimiento extraído del array data para ${externalCode}: ${nroOrdenFlete}`);
      }
      // Si data es un objeto directo
      else if (typeof responseData.data === 'object') {
        nroOrdenFlete = responseData.data.trackingid || responseData.data.id;
        console.log(`[99Min] ID de seguimiento extraído del objeto data para ${externalCode}: ${nroOrdenFlete}`);
      }
    }
    // CASO 3: Respuesta con nroOrdenFlete explícito
    else if (responseData.nroOrdenFlete) {
      nroOrdenFlete = responseData.nroOrdenFlete;
      console.log(`[99Min] ID de seguimiento encontrado en campo nroOrdenFlete para ${externalCode}: ${nroOrdenFlete}`);
    }
    // CASO 4: Cualquier otro formato de respuesta que pueda contener el ID
    else if (responseData.trackingid) {
      nroOrdenFlete = responseData.trackingid;
      console.log(`[99Min] ID de seguimiento encontrado en raíz para ${externalCode}: ${nroOrdenFlete}`);
    }

    // Si no se encontró un ID de seguimiento y es necesario, forzamos la creación
    if (!nroOrdenFlete && !createOrder) {
      console.log(`[99Min] No se encontró ID en respuesta GET. Intentando crear orden para ${externalCode}`);
      
      // Llamar recursivamente con createOrder=true
      return await process99MinOrder(internalId, externalCode, true, deliveryCompany);
    }

    // Si aún no hay ID de seguimiento, fallamos
    if (!nroOrdenFlete) {
      console.error(`[99Min] No se pudo identificar el ID de la orden en la respuesta para externalCode ${externalCode}`);
      return { internalId, externalCode, success: false };
    }

    console.log(`[99Min] ID de seguimiento final para externalCode ${externalCode}: ${nroOrdenFlete}`);

    // Actualizar la base de datos
    const pool = await getConnectionPool();
    
    // Actualizar estado en pedidos_externos_estado
    const updateQuery = `
      UPDATE pedidos_externos_estado
      SET estado_envio = 1, time_notificado = GETDATE()
      WHERE idpedido = @orderId
    `;
    await pool.request().input('orderId', sql.BigInt, internalId).query(updateQuery);
    console.log(`[99Min] Pedido internalId ${internalId} actualizado en pedidos_externos_estado. OT: ${nroOrdenFlete}`);

    // Actualizar URL de seguimiento de 99minutos
    const updateQuery2 = `
      UPDATE pedidos_externos
      SET otDeliveryCompany = @nroOrdenFlete,
          urlDeliveryCompany = CONCAT('https://tracking.99minutos.com/search/', @nroOrdenFlete)
      WHERE ID = @orderId
    `;
    await pool.request()
      .input('nroOrdenFlete', sql.VarChar, nroOrdenFlete)
      .input('orderId', sql.BigInt, internalId)
      .query(updateQuery2);
    console.log(`[99Min] Pedido internalId ${internalId} actualizado en pedidos_externos. OT: ${nroOrdenFlete}`);
    
    return { internalId, externalCode, nroOrdenFlete, success: true };
  } catch (error) {
    console.error(`[99Min] Error procesando internalId ${internalId}, externalCode ${externalCode}:`, error);
    return { internalId, externalCode, success: false };
  }
}

/**
 * Procesa los pedidos pendientes: Triple enfoque según deliveryCompany
 * Procesa primero los Starken y luego los 99Min (uno a la vez con espera)
 */
async function processOrders(createOrder: boolean): Promise<Array<{ 
  internalId: number; 
  externalCode: string; 
  nroOrdenFlete?: number; 
  success: boolean 
}>> {
  const pool = await getConnectionPool();
  
  // Consulta SQL para obtener pedidos pendientes
  const query = `
    SELECT 
      pedidos_externos_estado.idpedido AS internalId,
      pedidos_externos.FechaPedido, 
      pedidos_externos.CodigoExterno AS externalCode,
      pedidos_externos.deliveryCompany
    FROM 
      pedidos_externos_estado
    INNER JOIN 
      pedidos_externos ON pedidos_externos.ID = pedidos_externos_estado.idpedido
    WHERE 
      pedidos_externos.Ecommerce = 'BBQGRILL_VTEX'
      AND ISNULL(pedidos_externos_estado.estado_envio, 0) = 0
      AND pedidos_externos_estado.estado = 'T'
    GROUP BY 
      pedidos_externos_estado.idpedido,
      pedidos_externos.FechaPedido, 
      pedidos_externos.CodigoExterno,
      pedidos_externos.deliveryCompany
    ORDER BY 
      pedidos_externos.FechaPedido DESC
  `;
  
  const { recordset } = await pool.request().query(query);
  
  if (!recordset || recordset.length === 0) {
    console.log('No hay pedidos pendientes para procesar.');
    return [];
  }
  
  console.log(`Se encontraron ${recordset.length} pedidos pendientes para procesar.`);
  
  // Separar pedidos por tipo
  const starkenOrders = recordset.filter(row => row.deliveryCompany === 'Starken');
  const ninteenMinOrders = recordset.filter(row => 
    row.deliveryCompany === '99MinNextday' || row.deliveryCompany === '99MinSameday');
  const unknownOrders = recordset.filter(row => 
    row.deliveryCompany !== 'Starken' && 
    row.deliveryCompany !== '99MinNextday' && 
    row.deliveryCompany !== '99MinSameday');
  
  console.log(`Distribución de pedidos: Starken (${starkenOrders.length}), 99Min (${ninteenMinOrders.length}), Desconocidos (${unknownOrders.length})`);
  
  const results: Array<{ internalId: number; externalCode: string; nroOrdenFlete?: number; success: boolean }> = [];
  
  // Procesar primero los pedidos Starken (pueden procesarse en paralelo)
  if (starkenOrders.length > 0) {
    console.log('Procesando pedidos Starken...');
    for (const row of starkenOrders) {
      const internalId: number = row.internalId;
      const externalCode: string = row.externalCode;
      console.log(`[Starken] Procesando pedido: internalId ${internalId}, externalCode ${externalCode}`);
      
      const result = await processStarkenOrder(internalId, externalCode);
      results.push(result);
      
      // Esperar 2 segundos entre pedidos Starken
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Luego procesar los pedidos 99Min uno por uno con más espera
  if (ninteenMinOrders.length > 0) {
    console.log('Procesando pedidos 99Min...');
    for (const row of ninteenMinOrders) {
      const internalId: number = row.internalId;
      const externalCode: string = row.externalCode;
      const deliveryCompany: string = row.deliveryCompany;
      console.log(`[99Min] Procesando pedido: internalId ${internalId}, externalCode ${externalCode}, deliveryCompany ${deliveryCompany}`);
      
      const result = await process99MinOrder(internalId, externalCode, createOrder, deliveryCompany);
      results.push(result);
      
      // Esperar 5 segundos entre pedidos 99Min (más tiempo para evitar colisiones)
      console.log(`[99Min] Esperando 5 segundos antes de procesar el siguiente pedido 99Min...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Registrar pedidos con proveedor de envío desconocido
  if (unknownOrders.length > 0) {
    console.log(`Se encontraron ${unknownOrders.length} pedidos con proveedor de envío desconocido:`);
    for (const row of unknownOrders) {
      const internalId: number = row.internalId;
      const externalCode: string = row.externalCode;
      const deliveryCompany: string = row.deliveryCompany || 'No especificado';
      console.error(`Proveedor de envío desconocido: ${deliveryCompany} para pedido internalId ${internalId}, externalCode ${externalCode}`);
      results.push({ internalId, externalCode, success: false });
    }
  }
  
  return results;
}

/**
 * Endpoint API:
 * Con método GET, procesa los pedidos pendientes según la columna deliveryCompany.
 * Se puede pasar ?createOrder=true para emitir (en 99Min se usa POST).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  }
  
  // Leer el flag createOrder desde query (ej: ?createOrder=true)
  const createOrderFlag = req.query.createOrder === 'true';
  
  try {
    console.log(`=== INICIO PROCESAR PEDIDOS (createOrder=${createOrderFlag}) ===`);
    const results = await processOrders(createOrderFlag);
    console.log(`=== FIN PROCESAR PEDIDOS (procesados: ${results.length}) ===`);
    
    return res.status(200).json({
      message: 'Proceso completado',
      createOrder: createOrderFlag,
      results,
      summary: {
        total: results.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    console.error('Error procesando pedidos:', error);
    return res.status(500).json({ 
      message: 'Error procesando pedidos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}