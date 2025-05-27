// pages/api/exportar-excel-bbq-grill.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import sql, { ConnectionPool } from 'mssql';
import { decodeBase64 } from '../../utils/decrypt';
import * as XLSX from 'xlsx';

// Validación de variables de entorno para la conexión a SQL
if (
  !process.env.AWS_SAP_USER ||
  !process.env.AWS_SAP_PASSWORD ||
  !process.env.AWS_SAP_SERVER ||
  !process.env.AWS_SAP_DATABASE ||
  !process.env.AWS_SAP_PORT
) {
  throw new Error('Faltan variables de entorno requeridas para la conexión a SQL');
}

// Configuración de conexión a SQL
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

// Pool de conexión global
let pool: ConnectionPool | null = null;
async function getConnectionPool(): Promise<ConnectionPool> {
  if (pool) return pool;
  pool = await sql.connect(config);
  return pool;
}

/**
 * Endpoint API que consulta pedidos de BBQ GRILL y genera un Excel
 */
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
    console.log('=== INICIO DE EXPORTACIÓN A EXCEL DE PEDIDOS BBQ GRILL ===');

    // Obtener conexión a la base de datos
    const pool = await getConnectionPool();
    console.log('Conexión a la base de datos establecida.');

    // Obtener parámetros de consulta para filtrado por fechas
    const { fechaInicio, fechaFin } = req.query;

    // Definir la consulta SQL para BBQ GRILL
    const query = `
      SELECT * 
      FROM pedidos_externos
      WHERE 
        Ecommerce = 'BBQ GRILL'
        ${fechaInicio ? `AND FechaPedido >= '${fechaInicio}'` : ''}
        ${fechaFin ? `AND FechaPedido <= '${fechaFin}'` : ''}
      ORDER BY FechaPedido DESC
    `;
    console.log('Ejecutando query:');
    console.log(query);

    // Ejecutar la consulta SQL
    const { recordset } = await pool.request().query(query);
    console.log(`Consulta ejecutada. Registros encontrados: ${recordset.length}`);

    // Si no se encuentra ningún registro, informar
    if (!recordset || recordset.length === 0) {
      console.log('No se encontraron registros.');
      return res.status(404).json({ message: 'No se encontraron registros.' });
    }

    // Crear libro y hoja de Excel
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(recordset);
    
    // Dar formato a las columnas (ancho automático)
    const columnsWidth = Object.keys(recordset[0]).map(() => ({ wch: 15 }));
    worksheet['!cols'] = columnsWidth;
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BBQ GRILL');
    
    // Generar el archivo Excel en memoria
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    
    // Configurar encabezados para la descarga del archivo
    const fileName = `BBQ_GRILL_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    console.log('=== FIN DE EXPORTACIÓN A EXCEL DE PEDIDOS BBQ GRILL ===');
    
    // Enviar el archivo Excel como respuesta
    return res.status(200).send(excelBuffer);
  } catch (error) {
    console.error('Error al generar Excel:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}