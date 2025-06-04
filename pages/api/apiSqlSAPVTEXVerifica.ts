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

  // Obtener fechas del query string
  const { fechaInicio, fechaFin } = req.query;

  // Validar que las fechas existan
  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({
      message: 'Se requieren los parámetros fechaInicio y fechaFin (formato: YYYY-MM-DD)'
    });
  }

  try {
    await sql.connect(config);
    const query = `
    SELECT 
      pedidos_externos_estado.idpedido AS internalId,
      pedidos_externos.FechaPedido, 
      pedidos_externos.CodigoExterno AS externalCode,
      pedidos_externos.deliveryCompany,
      pedidos_externos.otDeliveryCompany
    FROM 
      pedidos_externos_estado
    INNER JOIN 
      pedidos_externos 
        ON pedidos_externos.ID = pedidos_externos_estado.idpedido
    WHERE 
      pedidos_externos.Ecommerce = 'VENTUSCORP_VTEX'
      AND ISNULL(pedidos_externos_estado.estado_envio, 0) = 0
      AND pedidos_externos.deliveryCompany = 'Starken'
      AND pedidos_externos_estado.estado = 'I'
      AND pedidos_externos.FechaPedido >= @fechaInicio
      AND pedidos_externos.FechaPedido <= @fechaFin

    GROUP BY 
      pedidos_externos_estado.idpedido,
      pedidos_externos.FechaPedido, 
      pedidos_externos.CodigoExterno
    , pedidos_externos.deliveryCompany,
      pedidos_externos.otDeliveryCompany
    ORDER BY 
      pedidos_externos.FechaPedido DESC
    `;


    const request = new sql.Request();

    // Agregar parámetros de fecha
    request.input('fechaInicio', sql.DateTime, new Date(fechaInicio as string));
    request.input('fechaFin', sql.DateTime, new Date(fechaFin as string + 'T23:59:59'));

    const result = await request.query(query);

    res.status(200).json({
      message: 'Consulta realizada con éxito',
      data: result.recordset
    });
  } catch (error: any) {
    console.error('Error en la consulta:', error);
    res.status(500).json({
      message: 'Error al consultar los pedidos',
      error: error.message
    });
  } finally {
    await sql.close();
  }
}