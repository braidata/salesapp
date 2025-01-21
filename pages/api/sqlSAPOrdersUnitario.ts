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

const pool = new ConnectionPool(poolConfig);

const sanitizeInput = (input: string | undefined, defaultValue: string = '') => {
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
    responseType,
    codigoExterno
  } = req.query;

  const sanitizedEcommerce = sanitizeInput(ecommerceFilter as string);
  const sanitizedMinIdsap = sanitizeInput(minIdsap as string);
  const sanitizedMaxIdsap = sanitizeInput(maxIdsap as string);
  const sanitizedResponseType = sanitizeInput(responseType as string);
  // Para código externo permitimos caracteres especiales como # o -
  const sanitizedCodigoExterno = codigoExterno ? (codigoExterno as string).trim() : '';

  try {
    if (!pool.connected) {
      await pool.connect();
    }

    let query = '';
    const request = pool.request();

    // Si hay código externo, hacemos una búsqueda específica
    if (sanitizedCodigoExterno) {
      query = `
        SELECT TOP 10
          CodigoInterno, 
          CodigoExterno, 
          respuesta_sap, 
          RESULTADO_SAP, 
          RUTA, 
          ts, 
          ecommerce,
          sku_sap
        FROM VISTA_INTEGRACION_SAP WITH (NOLOCK)
        WHERE CodigoExterno LIKE @codigoExterno
        ORDER BY ts DESC
      `;
      request.input('codigoExterno', `%${sanitizedCodigoExterno}%`);
    } else {
      // Consulta original con filtros de fecha y ecommerce
      query = `
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
          ${ecommerceFilter ? `AND ecommerce = @ecommerce` : ''}
          ${minIdsap && maxIdsap ? `AND ts BETWEEN @minIdsap AND @maxIdsap` : ''}
          ${responseType ? `AND CHARINDEX(@responseType, respuesta_sap) > 0` : ''}
        ORDER BY ts DESC
      `;

      if (ecommerceFilter) request.input('ecommerce', sanitizedEcommerce);
      if (minIdsap && maxIdsap) {
        request.input('minIdsap', sanitizedMinIdsap);
        request.input('maxIdsap', sanitizedMaxIdsap);
      }
      if (responseType) request.input('responseType', sanitizedResponseType);
    }

    console.log('Executing query:', query); // Log para debugging

    const result = await request.query(query);
    
    console.log(`Found ${result.recordset.length} records`); // Log para debugging

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  } finally {
    if (pool.connected) {
      await pool.close();
    }
  }
}