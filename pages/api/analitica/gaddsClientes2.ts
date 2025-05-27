// pages/api/google-ads-clients-direct.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleAuth } from 'google-auth-library';

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
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method Not Allowed'
    });
  }

  try {
    console.log("Iniciando proceso de autenticación...");
    
    // Validar variables de entorno
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || 
        !process.env.GOOGLE_ADS_DEVELOPER_TOKEN_VENTUS || 
        !process.env.GOOGLE_ADS_CUSTOMER_ID_VENTUS) {
      throw new Error('Variables de entorno faltantes');
    }

    // Parsear credenciales
    const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID_VENTUS.replace(/-/g, '');
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN_VENTUS;
    
    // Crear GoogleAuth
    const auth = new GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/adwords']
    });

    // Obtener access token
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();
    
    if (!accessToken.token) {
      throw new Error('No se pudo obtener access token');
    }

    console.log("Access token obtenido exitosamente");

    // Hacer llamada directa a la API de Google Ads usando fetch
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

    const requestBody = {
      query: query.trim()
    };

    console.log("Realizando llamada directa a Google Ads API...");
    console.log("Customer ID:", customerId);
    console.log("Developer Token:", developerToken.substring(0, 5) + "...");

    const response = await fetch(
      `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'developer-token': developerToken,
          'login-customer-id': customerId,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Respuesta recibida de Google Ads API");

    // Procesar resultados
    const clients: ClientAccount[] = [];
    
    if (data.results && Array.isArray(data.results)) {
      for (const result of data.results) {
        if (result.customerClient) {
          clients.push({
            id: result.customerClient.id || '',
            name: result.customerClient.descriptiveName || '',
            status: result.customerClient.status || '',
            currencyCode: result.customerClient.currencyCode || '',
            timeZone: result.customerClient.timeZone || ''
          });
        }
      }
    }

    console.log(`Procesados ${clients.length} clientes`);

    return res.status(200).json({
      success: true,
      message: `${clients.length} clientes obtenidos correctamente`,
      clients
    });

  } catch (error: any) {
    console.error('Error completo:', error);
    
    let message = 'Error al obtener clientes de Google Ads';
    
    if (error.message?.includes('403')) {
      message = 'Error de permisos. Verifica que la Service Account tenga acceso a Google Ads.';
    } else if (error.message?.includes('401')) {
      message = 'Error de autenticación. Verifica credenciales y Developer Token.';
    } else if (error.message?.includes('400')) {
      message = 'Error en la solicitud. Verifica Customer ID y parámetros.';
    }

    return res.status(500).json({
      success: false,
      message,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}