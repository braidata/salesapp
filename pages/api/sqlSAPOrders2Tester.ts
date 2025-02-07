// /pages/api/getEcommerceNames.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { ConnectionPool } from 'mssql';

const poolConfig = {
  user: process.env.USERNAMEC,
  password: process.env.PASSWORDC,
  server: process.env.SERVERC,
  database: process.env.DATABASEC,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    cryptoCredentialsDetails: {
      minVersion: 'TLSv1',
    },
  },
};

const pool = new ConnectionPool(poolConfig);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    if (!pool.connected) {
      await pool.connect();
    }

    const query = `
      SELECT DISTINCT ecommerce 
      FROM VISTA_INTEGRACION_SAP 
      WHERE ecommerce IS NOT NULL
      ORDER BY ecommerce
    `;

    const result = await pool.request().query(query);

    // Mapeamos el recordset a un array simple de strings
    const distinctEcommerce = result.recordset.map((row) => row.ecommerce);

    res.status(200).json(distinctEcommerce);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  } finally {
    if (pool.connected) {
      pool.close();
    }
  }
}
