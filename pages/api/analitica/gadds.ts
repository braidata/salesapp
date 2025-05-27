// pages/api/google-ads-kpis.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleAuth } from 'google-auth-library';

interface KPIConfigAds {
  /** GAQL query sin fecha ni filtros, con placeholders `$START_DATE`, `$END_DATE` */
  queryTemplate: string;
  processRows?: (rows: any[]) => any;
}

interface ClientAccount {
  id: string;
  name: string;
  status: string;
}

interface KPIResponse {
  success: boolean;
  periodo?: { startDate: string, endDate: string };
  message?: string;
  data?: Record<string, any>;
  error?: string;
  stack?: string;
}

// Lista de cuentas cliente extraídas del endpoint anterior
const CLIENT_ACCOUNTS: ClientAccount[] = [
  { id: "7580380792", name: "BBQ Grill", status: "ENABLED" },
  { id: "7400622292", name: "BLANIK", status: "ENABLED" },
  { id: "5609625109", name: "Imega Ventus", status: "ENABLED" },
  { id: "9133801156", name: "Marketing Ventus", status: "ENABLED" }
  // Excluimos Libero porque tiene status CANCELED
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<KPIResponse>
) {
  // Validar el método HTTP
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method Not Allowed' 
    });
  }

  // Parámetros de entrada con valores por defecto
  const startDate = (req.query.startDate as string) || '2025-01-01';
  const endDate = (req.query.endDate as string) || '2025-01-31';
  const enabledKpis = (req.query.kpis as string)?.split(',').filter(Boolean) || Object.keys(KPI_CONFIG_ADS);
  
  // Opcionalmente permitir filtrar por cliente específico
  const clientId = req.query.clientId as string;
  let clientsToProcess = clientId 
    ? CLIENT_ACCOUNTS.filter(client => client.id === clientId)
    : CLIENT_ACCOUNTS;

  try {
    console.log("Iniciando proceso de KPIs con Service Account...");
    
    // Validar variables de entorno necesarias para Service Account
    const requiredEnvVars = [
      'GOOGLE_SERVICE_ACCOUNT_KEY',
      'GOOGLE_ADS_DEVELOPER_TOKEN_VENTUS'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );
    
    if (missingEnvVars.length > 0) {
      throw new Error(`Variables de entorno faltantes: ${missingEnvVars.join(', ')}`);
    }

    // Parsear credenciales de Service Account
    const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN_VENTUS!;
    
    // Crear GoogleAuth
    const auth = new GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/adwords']
    });

    // Obtener access token
    console.log("Obteniendo access token de Service Account...");
    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();
    
    if (!accessToken.token) {
      throw new Error('No se pudo obtener access token');
    }

    console.log("Access token obtenido exitosamente");
    
    // Ejecutar consultas para cada cliente
    const results = await executeQueriesForClients(
      accessToken.token,
      developerToken,
      clientsToProcess, 
      enabledKpis, 
      startDate, 
      endDate
    );
    
    return res.status(200).json({
      success: true,
      message: 'KPIs de Google Ads obtenidos correctamente',
      periodo: { startDate, endDate },
      data: results
    });

  } catch (error: any) {
    console.error('Error general en el endpoint de KPIs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener KPIs de Google Ads',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Función para ejecutar consultas para múltiples clientes usando llamadas HTTP directas
async function executeQueriesForClients(
  accessToken: string,
  developerToken: string,
  clients: ClientAccount[],
  enabledKpis: string[],
  startDate: string,
  endDate: string
) {
  const results: Record<string, any> = {};
  const validKpiKeys = enabledKpis.filter(k => KPI_CONFIG_ADS[k]);
  
  // Inicializar estructura de resultados
  for (const key of validKpiKeys) {
    results[key] = {
      byAccount: {},
      aggregated: {
        totalImpressions: 0,
        totalClicks: 0,
        totalCost: 0,
        totalConversions: 0,
        items: []
      }
    };
  }
  
  // Procesar cada cliente activo
  for (const client of clients) {
    if (client.status !== 'ENABLED') {
      console.log(`Saltando cliente ${client.name} (${client.id}) - estado: ${client.status}`);
      continue;
    }
    
    console.log(`Procesando cliente: ${client.name} (${client.id})`);
    
    try {
      // Prueba de conexión para verificar que la cuenta es accesible
      console.log(`Ejecutando consulta de prueba para cliente ${client.id}...`);
      const testQuery = "SELECT campaign.id, campaign.name FROM campaign LIMIT 1";
      
      const testSuccess = await executeDirectQuery(
        accessToken,
        developerToken,
        client.id,
        testQuery
      );
      
      if (!testSuccess.success) {
        console.error(`Error al conectar con cliente ${client.id}:`, testSuccess.error);
        continue;
      }
      
      console.log(`Conexión exitosa con cliente ${client.id}`);
      
      // Procesar cada KPI para este cliente
      for (const key of validKpiKeys) {
        const { queryTemplate, processRows } = KPI_CONFIG_ADS[key];
        const gaql = queryTemplate
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/\$START_DATE/g, startDate)
          .replace(/\$END_DATE/g, endDate);

        try {
          console.log(`Ejecutando consulta para ${key} en cliente ${client.id}`);
          const queryResult = await executeDirectQuery(
            accessToken,
            developerToken,
            client.id,
            gaql
          );
          
          if (queryResult.success) {
            const processedData = processRows ? processRows(queryResult.data) : queryResult.data;
            
            // Guardar resultados por cuenta
            results[key].byAccount[client.id] = {
              accountName: client.name,
              accountId: client.id,
              ...processedData
            };
            
            // Agregar a totales
            if (processedData.totalImpressions !== undefined) {
              results[key].aggregated.totalImpressions += processedData.totalImpressions;
              results[key].aggregated.totalClicks += processedData.totalClicks;
              results[key].aggregated.totalCost += processedData.totalCost;
              results[key].aggregated.totalConversions += processedData.totalConversions;
              
              // Agregar items con info de cuenta
              const itemsKey = key === 'rendimientoCampanas' ? 'camps' : 'ads';
              if (processedData[itemsKey] && Array.isArray(processedData[itemsKey])) {
                processedData[itemsKey].forEach((item: any) => {
                  results[key].aggregated.items.push({
                    ...item,
                    accountName: client.name,
                    accountId: client.id
                  });
                });
              }
            }
          } else {
            console.error(`Error al obtener KPI ${key} para cliente ${client.id}:`, queryResult.error);
            results[key].byAccount[client.id] = { 
              accountName: client.name,
              accountId: client.id,
              error: queryResult.error,
              query: gaql
            };
          }
        } catch (err: any) {
          console.error(`Error al obtener KPI ${key} para cliente ${client.id}:`, err);
          results[key].byAccount[client.id] = { 
            accountName: client.name,
            accountId: client.id,
            error: err.message,
            query: gaql
          };
        }
      }
    } catch (clientError: any) {
      console.error(`Error general al procesar cliente ${client.id}:`, clientError);
      // Continuar con el siguiente cliente
    }
  }
  
  // Calcular tasa de conversión general para datos agregados
  for (const key of validKpiKeys) {
    const aggregated = results[key].aggregated;
    aggregated.conversionRate = aggregated.totalClicks 
      ? (aggregated.totalConversions / aggregated.totalClicks) * 100 
      : 0;
    
    // Ordenar items agregados
    const sortKey = key === 'rendimientoCampanas' ? 'clicks' : 'impressions';
    aggregated.items.sort((a: any, b: any) => b[sortKey] - a[sortKey]);
  }
  
  return results;
}

// Función para ejecutar consultas directas a la API de Google Ads
async function executeDirectQuery(
  accessToken: string,
  developerToken: string,
  customerId: string,
  query: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const requestBody = {
      query: query.trim()
    };

    const response = await fetch(
      `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'login-customer-id': process.env.GOOGLE_ADS_CUSTOMER_ID_VENTUS?.replace(/-/g, '') || customerId,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error en consulta para cliente ${customerId}:`, errorText);
      return {
        success: false,
        error: `API Error: ${response.status} - ${errorText}`
      };
    }

    const data = await response.json();
    const results = data.results || [];
    
    return {
      success: true,
      data: results
    };

  } catch (error: any) {
    console.error(`Error ejecutando consulta directa:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Configuración de KPIs para Google Ads (adaptada para trabajar con resultados directos)
const KPI_CONFIG_ADS: Record<string, KPIConfigAds> = {
  // Rendimiento de campañas
  rendimientoCampanas: {
    queryTemplate: `
    SELECT 
      campaign.id, 
      campaign.name, 
      campaign.status,
      metrics.impressions, 
      metrics.clicks, 
      metrics.cost_micros, 
      metrics.conversions, 
      metrics.conversions_value
    FROM campaign 
    WHERE campaign.status != 'REMOVED' 
    AND segments.date BETWEEN '$START_DATE' AND '$END_DATE'
    ORDER BY metrics.clicks DESC
    `,
    processRows: (rows) => {
      if (!rows || rows.length === 0) {
        return {
          totalImpressions: 0,
          totalClicks: 0,
          totalCost: 0,
          totalConversions: 0,
          camps: []
        };
      }

      return {
        totalImpressions: rows.reduce((s, r) => s + Number(r.metrics?.impressions || 0), 0),
        totalClicks: rows.reduce((s, r) => s + Number(r.metrics?.clicks || 0), 0),
        totalCost: rows.reduce((s, r) => s + Number(r.metrics?.costMicros || 0) / 1e6, 0),
        totalConversions: rows.reduce((s, r) => s + Number(r.metrics?.conversions || 0), 0),
        conversionRate: (() => {
          const clicks = rows.reduce((s, r) => s + Number(r.metrics?.clicks || 0), 0);
          const conversions = rows.reduce((s, r) => s + Number(r.metrics?.conversions || 0), 0);
          return clicks ? (conversions / clicks) * 100 : 0;
        })(),
        camps: rows.map(r => ({
          id: r.campaign?.id || '',
          name: r.campaign?.name || '',
          status: r.campaign?.status || '',
          impressions: Number(r.metrics?.impressions || 0),
          clicks: Number(r.metrics?.clicks || 0),
          cost: Number(r.metrics?.costMicros || 0) / 1e6,
          conversions: Number(r.metrics?.conversions || 0),
          conversionValue: Number(r.metrics?.conversionsValue || 0),
          ctr: Number(r.metrics?.clicks || 0) && Number(r.metrics?.impressions || 0) ? 
            (Number(r.metrics.clicks) / Number(r.metrics.impressions)) * 100 : 0,
          cpc: Number(r.metrics?.clicks || 0) ? 
            Number(r.metrics?.costMicros || 0) / Number(r.metrics.clicks) / 1e6 : 0,
          convRate: Number(r.metrics?.clicks || 0) ? 
            (Number(r.metrics?.conversions || 0) / Number(r.metrics.clicks)) * 100 : 0
        }))
      };
    }
  },
  
  // Rendimiento de anuncios
  rendimientoAnuncios: {
    queryTemplate: `
    SELECT 
      ad_group_ad.ad.id, 
      ad_group_ad.ad.name,
      ad_group_ad.status,
      ad_group.name,
      campaign.name,
      metrics.impressions, 
      metrics.clicks, 
      metrics.cost_micros, 
      metrics.conversions, 
      metrics.conversions_value
    FROM ad_group_ad 
    WHERE segments.date BETWEEN '$START_DATE' AND '$END_DATE'
    ORDER BY metrics.impressions DESC
    `,
    processRows: (rows) => {
      if (!rows || rows.length === 0) {
        return { 
          totalImpressions: 0,
          totalClicks: 0,
          totalCost: 0,
          totalConversions: 0,
          ads: [] 
        };
      }
      
      return {
        totalImpressions: rows.reduce((s, r) => s + Number(r.metrics?.impressions || 0), 0),
        totalClicks: rows.reduce((s, r) => s + Number(r.metrics?.clicks || 0), 0),
        totalCost: rows.reduce((s, r) => s + Number(r.metrics?.costMicros || 0) / 1e6, 0),
        totalConversions: rows.reduce((s, r) => s + Number(r.metrics?.conversions || 0), 0),
        ads: rows.map(r => ({
          id: r.adGroupAd?.ad?.id || '',
          name: r.adGroupAd?.ad?.name || '',
          status: r.adGroupAd?.status || '',
          adGroupName: r.adGroup?.name || '',
          campaignName: r.campaign?.name || '',
          impressions: Number(r.metrics?.impressions || 0),
          clicks: Number(r.metrics?.clicks || 0),
          cost: Number(r.metrics?.costMicros || 0) / 1e6,
          conversions: Number(r.metrics?.conversions || 0),
          conversionValue: Number(r.metrics?.conversionsValue || 0),
          ctr: r.metrics?.clicks && r.metrics?.impressions ? 
            (Number(r.metrics.clicks) / Number(r.metrics.impressions)) * 100 : 0,
          cpc: r.metrics?.clicks && Number(r.metrics?.clicks) > 0 ? 
            Number(r.metrics?.costMicros || 0) / Number(r.metrics.clicks) / 1e6 : 0,
          convRate: r.metrics?.clicks && Number(r.metrics?.clicks) > 0 ? 
            (Number(r.metrics?.conversions || 0) / Number(r.metrics.clicks)) * 100 : 0
        }))
      };
    }
  }
};