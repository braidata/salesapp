// pages/api/google-ads-clients.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleAdsApi } from 'google-ads-api';

interface ClientAccount {
  id: string;
  name: string;
  status: string;
  currencyCode?: string;
  timeZone?: string;
}

interface ClientsResponse {
  success: boolean;
  message?: string;
  clients?: ClientAccount[];
  error?: string;
  stack?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ClientsResponse>
) {
  // Validar el método HTTP
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method Not Allowed' 
    });
  }

  try {
    // Validar variables de entorno necesarias
    const requiredEnvVars = [
      'GOOGLE_ADS_DEVELOPER_TOKEN_VENTUS',
      'GOOGLE_ADS_CUSTOMER_ID_VENTUS',
      'GOOGLE_ADS_CLIENT_ID',
      'GOOGLE_ADS_CLIENT_SECRET',
      'GOOGLE_ADS_REFRESH_TOKEN_VENTUS'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );
    
    if (missingEnvVars.length > 0) {
      throw new Error(`Variables de entorno faltantes: ${missingEnvVars.join(', ')}`);
    }

    console.log("Intentando conectar con Google Ads API...");
    
    // Configurar API con credenciales OAuth
    const api = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN_VENTUS!,
      version: 'v14'
    });
    
    // Crear cliente MCC usando el ID del cliente manager
    const managerCustomer = api.Customer({
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID_VENTUS!.replace(/-/g, ''),
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN_VENTUS!
    });
    
    // Consulta para obtener todos los clientes bajo el MCC
    // Eliminamos el campo customer_client.creation_time que causaba el error
    const query = `
      SELECT
        customer_client.id,
        customer_client.descriptive_name,
        customer_client.status,
        customer_client.currency_code,
        customer_client.time_zone
      FROM customer_client
      WHERE customer_client.level <= 1
      ORDER BY customer_client.descriptive_name
    `;
    
    console.log("Ejecutando consulta para obtener clientes:", query);
    
    const results = await managerCustomer.query(query);
    
    // Procesar los resultados
    const clients = results.map(account => ({
      id: account.customer_client?.id || '',
      name: account.customer_client?.descriptive_name || '',
      status: account.customer_client?.status || '',
      currencyCode: account.customer_client?.currency_code || '',
      timeZone: account.customer_client?.time_zone || ''
    }));
    
    return res.status(200).json({
      success: true,
      message: 'Clientes de Google Ads obtenidos correctamente',
      clients
    });
    
  } catch (error: any) {
    console.error('Error al obtener clientes de Google Ads:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener clientes de Google Ads',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}