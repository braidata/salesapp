import { NextApiRequest, NextApiResponse } from 'next';
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const pool = await getConnectionPool();

    // 1. Obtener todos los ecommerce distintos
    const ecommerceResult = await pool.request()
      .query(`SELECT DISTINCT Ecommerce FROM pedidos_externos`);

    // 2. Obtener los campos de la tabla pedidos_externos
    const columnsResult = await pool.request()
      .query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'pedidos_externos'
      `);

    // 3. Obtener un ejemplo reciente
    const exampleResult = await pool.request()
      .query(`
        SELECT TOP 1 *
        FROM pedidos_externos
        ORDER BY FechaPedido DESC
      `);

    const recentExample = exampleResult.recordset[0] || null;

    // 4. Si hay ejemplo, obtener detalles asociados en pedidos_externos_detalle
    let detalleResult = { recordset: [] as any[] };
    if (recentExample && recentExample.ID) {
      detalleResult = await pool.request()
        .input('pedidoId', sql.BigInt, recentExample.ID)
        .query(`
          SELECT *
          FROM pedidos_externos_detalle
          WHERE idpedido = @pedidoId
        `);
    }

    res.status(200).json({
      ecommerceCount: ecommerceResult.recordset.length,
      ecommerceList: ecommerceResult.recordset.map((row: any) => row.Ecommerce),
      tableFields: columnsResult.recordset.map((row: any) => row.COLUMN_NAME),
      recentExample,
      recentExampleDetalle: detalleResult.recordset,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
}