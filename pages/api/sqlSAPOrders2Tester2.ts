// pages/api/sqlSAPOrders2TesterNoFilter.ts

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
    // Sólo permitimos GET
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!pool.connected) {
      await pool.connect();
    }

    // Tomamos year, month y ecommerce (opcional)
    const { year, month, ecommerce } = req.query;

    // Validaciones mínimas
    if (!year || !month) {
      return res
        .status(400)
        .json({ error: 'Faltan parámetros obligatorios: year, month.' });
    }

    // Armamos el query base
    // IMPORTANTE: agregamos la condición de MotivoError IS NOT NULL Y no vacío
    let query = `
      SELECT
        CodigoInterno,
        CodigoExterno,
        respuesta_sap,
        MotivoError,
        RESULTADO_SAP,
        RUTA,
        ts,
        ecommerce
      FROM VISTA_INTEGRACION_SAP
      WHERE YEAR(ts) = @year
        AND MONTH(ts) = @month
        AND MotivoError IS NOT NULL
        AND LTRIM(RTRIM(MotivoError)) <> ''
    `;

    // Si se recibió ecommerce, lo agregamos
    if (ecommerce) {
      query += ` AND ecommerce = @ecommerce`;
    }

    query += ` ORDER BY CodigoExterno DESC`;

    // Preparamos la request
    const request = pool.request();

    request.input('year', Number(year));
    request.input('month', Number(month));
    if (ecommerce) {
      request.input('ecommerce', ecommerce);
    }

    // Ejecutamos la consulta
    const result = await request.query(query);

    // Retornamos tal cual lo que venga de la DB
    return res.status(200).json(result.recordset);
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  } finally {
    if (pool.connected) {
      pool.close();
    }
  }
}
