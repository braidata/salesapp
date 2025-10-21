import { NextApiRequest, NextApiResponse } from 'next';
import sql, { ConnectionPool } from 'mssql';
import { decodeBase64 } from '../../utils/decrypt';

// Configuración de la conexión
const config: sql.config = {
  user: process.env.AWS_SAP_USER,
  password: decodeBase64(process.env.AWS_SAP_PASSWORD),
  server: process.env.AWS_SAP_SERVER!,
  port: parseInt(process.env.AWS_SAP_PORT!, 10),
  database: process.env.AWS_SAP_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

// Pool de conexión
let pool: ConnectionPool | null = null;
async function getConnectionPool(): Promise<ConnectionPool> {
  if (pool) return pool;
  pool = await sql.connect(config);
  return pool;
}

// Validación de fecha
function validateDateFormat(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  try {
    const { ecommerce, from, to } = req.query;

    // Validación de parámetros obligatorios
    if (!from || !to || !ecommerce) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren los parámetros from, to y ecommerce',
        timestamp: new Date().toISOString()
      });
    }

    // Validación de formato de fechas
    if (typeof from === 'string' && !validateDateFormat(from)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de fecha "from" inválido. Use YYYY-MM-DD'
      });
    }

    if (typeof to === 'string' && !validateDateFormat(to)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de fecha "to" inválido. Use YYYY-MM-DD'
      });
    }

    const pool = await getConnectionPool();

    // Consulta optimizada que solo trae los campos necesarios
    const query = `
      SELECT 
        p.CodigoExterno,
        p.FebosFC,
        p.otDeliveryCompany,
        p.urlDeliveryCompany,
        p.FechaPedido,
        p.Ecommerce,
        p.deliveryCompany,
        p.Estado
      FROM pedidos_externos p
      WHERE p.Ecommerce = @ecommerce
        AND CAST(DATEADD(HOUR, -4, p.FechaPedido) AS DATE) >= CAST(@from AS DATE)
        AND CAST(DATEADD(HOUR, -4, p.FechaPedido) AS DATE) <= CAST(@to AS DATE)
      ORDER BY p.FechaPedido DESC;
    `;

    const result = await pool
      .request()
      .input('ecommerce', sql.VarChar, ecommerce)
      .input('from', sql.Date, from)
      .input('to', sql.Date, to)
      .query(query);

    const pedidos = result.recordset.map(row => ({
      ...row,
      FechaPedidoLocal: row.FechaPedido ? 
        new Date(new Date(row.FechaPedido).getTime() - 4 * 60 * 60 * 1000).toISOString() 
        : null
    }));

    // Respuesta
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      filters: {
        ecommerce,
        from,
        to,
        timezoneAdjustment: '-4 hours (Chile time)'
      },
      pedidos,
      summary: {
        totalPedidos: pedidos.length,
        processingTime: `${Date.now() - startTime}ms`,
        dateRange: pedidos.length > 0 ? {
          from: pedidos[pedidos.length - 1]?.FechaPedido,
          to: pedidos[0]?.FechaPedido
        } : null
      }
    };

    res.status(200).json(response);

  } catch (err: any) {
    console.error('Error en SQL API:', {
      error: err.message,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({ 
      success: false,
      error: err.message || 'Error interno del servidor',
      timestamp: new Date().toISOString()
    });
  }
}