// pages/api/listColumns.ts

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
  try {
    // Sólo GET
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!pool.connected) {
      await pool.connect();
    }

    // Consulta INFORMATION_SCHEMA para obtener todas las columnas de la vista/tabla
    const query = `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'VISTA_INTEGRACION_SAP'
      ORDER BY ORDINAL_POSITION
    `;

    const result = await pool.request().query(query);

    // Extraemos los nombres de columna en un array simple
    const columns = result.recordset.map((row) => row.COLUMN_NAME);

    return res.status(200).json(columns);
  } catch (error: any) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  } finally {
    if (pool.connected) {
      pool.close();
    }
  }
}
