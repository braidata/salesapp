// pages/api/vtex/orders-pending-db.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import sql from 'mssql'
import { getConnectionPool } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Método no permitido' })
  }
  try {
    const pool = await getConnectionPool();
    const query = `
      SELECT 
        pe_estado.idpedido AS internalId,
        pe.FechaPedido, 
        pe.CodigoExterno AS externalCode
      FROM pedidos_externos_estado pe_estado
      INNER JOIN pedidos_externos pe ON pe.ID = pe_estado.idpedido
      WHERE pe.Ecommerce = 'VENTUSCORP_VTEX'
        AND ISNULL(pe_estado.estado_envio, 0) = 0
        AND pe.deliveryCompany IN ('Starken','SAMEX')
        AND pe_estado.estado = 'T'
      GROUP BY pe_estado.idpedido, pe.FechaPedido, pe.CodigoExterno
      ORDER BY pe.FechaPedido DESC
    `;
    const { recordset } = await pool.request().query(query);
    return res.status(200).json({ count: recordset?.length || 0, items: recordset || [] });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Error DB' })
  }
}
