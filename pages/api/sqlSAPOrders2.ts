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
      minVersion: 'TLSv1'
    }
  }
};

// Función de sanitización (básica)
const sanitizeInput = (input: string | undefined, defaultValue: string = '') => {
  // Permite letras, dígitos, guiones y underscores.
  // OJO: si tus fechas vienen con "-", aquí está permitido. Ok.
  return input ? input.replace(/[^a-zA-Z0-9_-]/g, '') : defaultValue;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    startDate: minIdsap,
    endDate: maxIdsap,
    ecommerce: ecommerceFilter,
  } = req.query; // si ya no usas "responseType", quítalo

  const sanitizedEcommerce = sanitizeInput(ecommerceFilter as string);
  const sanitizedMinIdsap = sanitizeInput(minIdsap as string);
  const sanitizedMaxIdsap = sanitizeInput(maxIdsap as string);

  // Validamos que vengan las fechas
  if (!sanitizedMinIdsap || !sanitizedMaxIdsap) {
    return res.status(400).json({
      error: 'Falta startDate o endDate',
    });
  }

  // Validamos ecommerce si necesitas que sea obligatorio
  if (!sanitizedEcommerce) {
    return res.status(400).json({
      error: 'Falta ecommerce',
    });
  }

  // Puedes validar formato YYYY-MM-DD si lo deseas, p.ej:
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(sanitizedMinIdsap) || !dateRegex.test(sanitizedMaxIdsap)) {
    return res.status(400).json({
      error: 'Formato de fecha inválido, use YYYY-MM-DD',
    });
  }

  let pool: ConnectionPool;
  try {
    // Crear pool y conectar
    pool = new ConnectionPool(poolConfig);
    await pool.connect();

    // Construir el query dinámicamente
    // NOTA: si ya no necesitas filtrar por CODE=1 o CODE=2 aquí,
    //       quita la parte de responseType.
    let query = `
      SELECT 
        CodigoInterno, 
        CodigoExterno, 
        respuesta_sap, 
        RESULTADO_SAP, 
        RUTA, 
        ts, 
        ecommerce,
        sku_sap
      FROM VISTA_INTEGRACION_SAP WITH (NOLOCK)
      WHERE 1=1
    `;

    if (sanitizedEcommerce) {
      query += ` AND ecommerce = @ecommerce `;
    }

    // Asumiendo que tu campo 'ts' es DATETIME, y 
    // que '2025-01-20' se parsea bien en SQL
    query += ` AND ts BETWEEN @minIdsap AND @maxIdsap `;

    query += ` ORDER BY ts DESC `;

    // Preparamos el request
    const request = pool.request();
    request.input('ecommerce', sanitizedEcommerce);
    request.input('minIdsap', sanitizedMinIdsap);
    request.input('maxIdsap', sanitizedMaxIdsap);

    console.log('Executing query:', query);

    const result = await request.query(query);
    console.log(`Found ${result.recordset.length} records`);

    res.status(200).json(result.recordset);
  } catch (error: any) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  } finally {
    // Cerramos el pool si está conectado
    if (pool && pool.connected) {
      await pool.close();
    }
  }
}
