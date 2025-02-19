// pages/api/pedidos-pendientes.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import sql, { ConnectionPool } from 'mssql';
import { decodeBase64 } from '../../utils/decrypt';

// Validación de variables de entorno necesarias
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

// Pool de conexión global para reutilizarlo en múltiples requests
let pool: ConnectionPool | null = null;

async function getConnectionPool(): Promise<ConnectionPool> {
  if (pool) return pool;
  pool = await sql.connect(config);
  return pool;
}

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
    const pool = await getConnectionPool();

    const query = `
      SELECT 
        qa_pedidos_externos.FechaPedido, 
        qa_pedidos_externos.CodigoExterno
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
        qa_pedidos_externos.FechaPedido, 
        qa_pedidos_externos.CodigoExterno
      ORDER BY 
        qa_pedidos_externos.FechaPedido DESC
    `;

    const { recordset } = await pool.request().query(query);

    return res.status(200).json(recordset);
  } catch (error) {
    console.error('Error al obtener los pedidos:', error);
    return res.status(500).json({ message: 'Error al obtener los pedidos' });
  }
}
