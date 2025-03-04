// pages/api/verificar-pedidos.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import sql from 'mssql';
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Método ${req.method} no permitido` });
  }

  try {
    await sql.connect(config);
    const query = `
      SELECT 
        p.ID AS internalId,
        p.CodigoExterno,
        p.deliveryCompany,
        p.otDeliveryCompany,
        p.urlDeliveryCompany,
        s.estado,
        s.estado_envio,
        s.time_notificado
      FROM qa_pedidos_externos p
      INNER JOIN qa_pedidos_externos_estado s ON p.ID = s.idpedido
      ORDER BY p.ID DESC;
    `;
    
    const result = await sql.query(query);
    
    res.status(200).json({
      message: 'Consulta realizada con éxito',
      data: result.recordset
    });
  } catch (error: any) {
    console.error('Error en la consulta:', error);
    res.status(500).json({ message: 'Error al consultar los pedidos', error: error.message });
  } finally {
    await sql.close();
  }
}
