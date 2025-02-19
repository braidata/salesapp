// pages/api/ultimos-pedidos-qa.ts
import { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';
import { decodeBase64 } from '../../utils/decrypt';

const config = {
  user: process.env.AWS_SAP_USER,
  password: decodeBase64(process.env.AWS_SAP_PASSWORD || ''),
  server: process.env.AWS_SAP_SERVER,
  port: Number(process.env.AWS_SAP_PORT),
  database: process.env.AWS_SAP_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  let pool;
  try {
    pool = await sql.connect(config);
    
    // Consulta para qa_pedidos_externos
    const pedidosResult = await pool.request()
      .query(`
        SELECT TOP 10 *
        FROM qa_pedidos_externos
        ORDER BY id DESC
      `);

    // Consulta para qa_pedidos_externos_estado
    const estadosResult = await pool.request()
      .query(`
        SELECT TOP 7 *
        FROM qa_pedidos_externos_estado
        ORDER BY id DESC
      `);

    // Combinar resultados en un objeto
    const response = {
      pedidos: pedidosResult.recordset,
      estados: estadosResult.recordset
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error al obtener los últimos pedidos:', error);
    res.status(500).json({ message: 'Error al obtener los últimos pedidos' });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}