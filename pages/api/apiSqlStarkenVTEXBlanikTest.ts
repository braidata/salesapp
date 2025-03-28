// pages/api/consulta-pedidos-blanik.ts
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

let pool: ConnectionPool | null = null;
async function getConnectionPool(): Promise<ConnectionPool> {
  if (pool) return pool;
  pool = await sql.connect(config);
  return pool;
}

/**
 * Revierte el estado de pedidos específicos para que puedan ser procesados nuevamente
 * Solo afecta a pedidos con estado 'T' (disponibles para transporte)
 */
async function resetOrderStatus(
  idsOrCodes: string | string[],
  useIds: boolean = true
): Promise<{ success: boolean; affectedRows: number; message: string }> {
  try {
    const pool = await getConnectionPool();
    
    // Convertir el parámetro a array si es string
    const values = Array.isArray(idsOrCodes) ? idsOrCodes : [idsOrCodes];
    
    if (values.length === 0) {
      return { 
        success: false, 
        affectedRows: 0, 
        message: 'No se proporcionaron IDs o códigos para revertir' 
      };
    }
    
    let query: string;
    let result;
    
    // Actualizar basado en ID interno
    if (useIds) {
      // Verificar si son números
      const ids = values.map(v => {
        const num = parseInt(v.toString(), 10);
        if (isNaN(num)) {
          throw new Error(`ID inválido: ${v}. Debe ser un número.`);
        }
        return num;
      });
      
      query = `
        UPDATE qa_pedidos_externos_estado
        SET estado_envio = 0, time_notificado = NULL
        WHERE idpedido IN (${ids.join(',')})
        AND estado = 'T'
      `;
      
      result = await pool.request().query(query);
      
      console.log(`[Reset] Revertido estado para ${result.rowsAffected[0]} pedidos con IDs: ${ids.join(', ')}`);
    }
    // Actualizar basado en código externo
    else {
      const placeholders = values.map((_, i) => `@p${i}`).join(',');
      const request = pool.request();
      
      values.forEach((code, i) => {
        request.input(`p${i}`, sql.VarChar, code);
      });
      
      query = `
        UPDATE qa_pedidos_externos_estado
        SET estado_envio = 0, time_notificado = NULL
        WHERE idpedido IN (
          SELECT ID FROM qa_pedidos_externos 
          WHERE CodigoExterno IN (${placeholders})
        )
        AND estado = 'T'
      `;
      
      result = await request.query(query);
      
      console.log(`[Reset] Revertido estado para ${result.rowsAffected[0]} pedidos con códigos: ${values.join(', ')}`);
    }
    
    return { 
      success: true, 
      affectedRows: result.rowsAffected[0], 
      message: `Revertido el estado de ${result.rowsAffected[0]} pedidos correctamente` 
    };
  } catch (error) {
    console.error('[Reset] Error al revertir estado de pedidos:', error);
    return { 
      success: false, 
      affectedRows: 0, 
      message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}` 
    };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Permitir GET para consulta normal y POST para revertir estados
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  }
  
  try {
    // POST para revertir estados
    if (req.method === 'POST') {
      // Revertir por IDs
      if (req.body && req.body.resetIds) {
        const result = await resetOrderStatus(req.body.resetIds, true);
        return res.status(result.success ? 200 : 400).json(result);
      }
      
      // Revertir por códigos externos
      if (req.body && req.body.resetCodes) {
        const result = await resetOrderStatus(req.body.resetCodes, false);
        return res.status(result.success ? 200 : 400).json(result);
      }
      
      // Si se proporciona resetSpecific, revertir los 3 pedidos específicos
      if (req.body && req.body.resetSpecific === true) {
        const result = await resetOrderStatus([141, 138, 142], true);
        return res.status(result.success ? 200 : 400).json(result);
      }
      
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere resetIds, resetCodes o resetSpecific=true en el cuerpo de la solicitud' 
      });
    }
    
    // GET para consulta regular
    const pool = await getConnectionPool();
    // Query modificada: incluye otDeliveryCompany y urlDeliveryCompany
    const query = `
      SELECT 
        pe_estado.idpedido AS internalId,
        pe.FechaPedido, 
        pe.CodigoExterno AS externalCode,
        pe.deliveryCompany,
        pe.Ecommerce,
        pe.otDeliveryCompany,
        pe.urlDeliveryCompany,
        pe_estado.estado_envio,
        pe_estado.estado,
        pe_estado.time_notificado
      FROM 
        qa_pedidos_externos_estado pe_estado
      INNER JOIN 
        qa_pedidos_externos pe ON pe.ID = pe_estado.idpedido
      WHERE 
        pe.Ecommerce = 'BLANIK_VTEX' AND pe_estado.estado= 'T'
      ORDER BY 
        pe.FechaPedido DESC
    `;
    
    const { recordset } = await pool.request().query(query);
    
    return res.status(200).json({
      count: recordset.length,
      orders: recordset
    });
  } catch (error) {
    console.error('Error consultando pedidos BLANIK_VTEX:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error consultando pedidos BLANIK_VTEX', 
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}