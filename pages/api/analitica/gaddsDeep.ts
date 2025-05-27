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
        totalConversionsValue: 0,
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
              // Agregar a totales (mejorado para manejar diferentes tipos de KPIs)
results[key].aggregated.totalImpressions += processedData.totalImpressions || 0;
results[key].aggregated.totalClicks += processedData.totalClicks || 0;
results[key].aggregated.totalCost += processedData.totalCost || 0;
results[key].aggregated.totalConversions += processedData.totalConversions || 0;
results[key].aggregated.totalConversionsValue += processedData.totalConversionsValue || 0;

// Para KPIs de ecommerce, agregar métricas específicas
if (processedData.totalRevenue !== undefined) {
  results[key].aggregated.totalRevenue = (results[key].aggregated.totalRevenue || 0) + processedData.totalRevenue;
  results[key].aggregated.totalOrders = (results[key].aggregated.totalOrders || 0) + processedData.totalOrders;
  results[key].aggregated.totalUnits = (results[key].aggregated.totalUnits || 0) + processedData.totalUnits;
}

// Para KPIs de impression share, agregar métricas específicas
if (processedData.averageSearchImpressionShare !== undefined) {
  results[key].aggregated.averageSearchImpressionShare = processedData.averageSearchImpressionShare;
}
              
              // Agregar items con info de cuenta
              const itemsKey = getItemsKey(key);
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
  
  // Calcular métricas calculadas para datos agregados
  for (const key of validKpiKeys) {
    const aggregated = results[key].aggregated;
    
    // ROAS (Return on Ad Spend)
    aggregated.roas = aggregated.totalCost > 0 
      ? aggregated.totalConversionsValue / aggregated.totalCost 
      : 0;
    
    // Tasa de conversión
    aggregated.conversionRate = aggregated.totalClicks > 0
      ? (aggregated.totalConversions / aggregated.totalClicks) * 100 
      : 0;
    
    // CTR
    aggregated.ctr = aggregated.totalImpressions > 0
      ? (aggregated.totalClicks / aggregated.totalImpressions) * 100
      : 0;
    
    // CPC
    aggregated.averageCpc = aggregated.totalClicks > 0
      ? aggregated.totalCost / aggregated.totalClicks
      : 0;
    
    // CPA
    aggregated.costPerAcquisition = aggregated.totalConversions > 0
      ? aggregated.totalCost / aggregated.totalConversions
      : 0;
    
    // Revenue per Click
    aggregated.revenuePerClick = aggregated.totalClicks > 0
      ? aggregated.totalConversionsValue / aggregated.totalClicks
      : 0;
    
    // Ordenar items agregados
    const sortKey = getSortKey(key);
    aggregated.items.sort((a: any, b: any) => (b[sortKey] || 0) - (a[sortKey] || 0));
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

// Helpers
function getItemsKey(kpiKey: string): string {
  const keyMap: Record<string, string> = {
    'rendimientoCampanas': 'camps',
    'rendimientoAnuncios': 'ads',
    'rendimientoPorDispositivo': 'devices',
    'rendimientoPorUbicacion': 'locations',
    'rendimientoShopping': 'products',
    'rendimientoPorHorario': 'hours',
    'rendimientoPorAudiencia': 'audiences',
    'metricsConversiones': 'conversions'
  };
  return keyMap[kpiKey] || 'items';
}

function getSortKey(kpiKey: string): string {
  const sortMap: Record<string, string> = {
    'rendimientoCampanas': 'clicks',
    'rendimientoAnuncios': 'impressions',
    'rendimientoPorDispositivo': 'impressions',
    'rendimientoPorUbicacion': 'impressions',
    'rendimientoShopping': 'clicks',
    'rendimientoPorHorario': 'impressions',
    'rendimientoPorAudiencia': 'impressions',
    'metricsConversiones': 'conversions'
  };
  return sortMap[kpiKey] || 'impressions';
}

// Configuración completa de KPIs para Google Ads con métricas avanzadas de e-commerce
const KPI_CONFIG_ADS: Record<string, KPIConfigAds> = {
  // 1. Rendimiento de campañas (CORREGIDO)
  rendimientoCampanas: {
    queryTemplate: `
    SELECT 
      campaign.id, 
      campaign.name, 
      campaign.status,
      campaign.advertising_channel_type,
      metrics.impressions, 
      metrics.clicks, 
      metrics.cost_micros, 
      metrics.conversions, 
      metrics.conversions_value,
      metrics.all_conversions,
      metrics.all_conversions_value,
      metrics.cost_per_conversion,
      metrics.value_per_conversion,
      metrics.cross_device_conversions,
      metrics.view_through_conversions
    FROM campaign 
    WHERE campaign.status != 'REMOVED' 
    AND segments.date BETWEEN '$START_DATE' AND '$END_DATE'
    ORDER BY metrics.conversions_value DESC
    `,
    processRows: (rows) => {
      if (!rows || rows.length === 0) {
        return {
          totalImpressions: 0,
          totalClicks: 0,
          totalCost: 0,
          totalConversions: 0,
          totalConversionsValue: 0,
          camps: []
        };
      }

      return {
        totalImpressions: rows.reduce((s, r) => s + Number(r.metrics?.impressions || 0), 0),
        totalClicks: rows.reduce((s, r) => s + Number(r.metrics?.clicks || 0), 0),
        totalCost: rows.reduce((s, r) => s + Number(r.metrics?.costMicros || 0) / 1e6, 0),
        totalConversions: rows.reduce((s, r) => s + Number(r.metrics?.conversions || 0), 0),
        totalConversionsValue: rows.reduce((s, r) => s + Number(r.metrics?.conversionsValue || 0), 0),
        camps: rows.map(r => ({
          id: r.campaign?.id || '',
          name: r.campaign?.name || '',
          status: r.campaign?.status || '',
          channelType: r.campaign?.advertisingChannelType || '',
          impressions: Number(r.metrics?.impressions || 0),
          clicks: Number(r.metrics?.clicks || 0),
          cost: Number(r.metrics?.costMicros || 0) / 1e6,
          conversions: Number(r.metrics?.conversions || 0),
          conversionsValue: Number(r.metrics?.conversionsValue || 0),
          allConversions: Number(r.metrics?.allConversions || 0),
          allConversionsValue: Number(r.metrics?.allConversionsValue || 0),
          // Calcular ROAS manualmente
          roas: Number(r.metrics?.costMicros || 0) > 0 ? 
            Number(r.metrics?.conversionsValue || 0) / (Number(r.metrics?.costMicros || 0) / 1e6) : 0,
          cpa: Number(r.metrics?.costPerConversion || 0),
          valuePerConversion: Number(r.metrics?.valuePerConversion || 0),
          crossDeviceConversions: Number(r.metrics?.crossDeviceConversions || 0),
          viewThroughConversions: Number(r.metrics?.viewThroughConversions || 0),
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


  // 2. Rendimiento de anuncios (mejorado)
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
      metrics.conversions_value,
      metrics.cost_per_conversion,
      metrics.value_per_conversion
    FROM ad_group_ad 
    WHERE segments.date BETWEEN '$START_DATE' AND '$END_DATE'
    ORDER BY metrics.conversions_value DESC
    `,
    processRows: (rows) => {
      if (!rows || rows.length === 0) {
        return { 
          totalImpressions: 0,
          totalClicks: 0,
          totalCost: 0,
          totalConversions: 0,
          totalConversionsValue: 0,
          ads: [] 
        };
      }
      
      return {
        totalImpressions: rows.reduce((s, r) => s + Number(r.metrics?.impressions || 0), 0),
        totalClicks: rows.reduce((s, r) => s + Number(r.metrics?.clicks || 0), 0),
        totalCost: rows.reduce((s, r) => s + Number(r.metrics?.costMicros || 0) / 1e6, 0),
        totalConversions: rows.reduce((s, r) => s + Number(r.metrics?.conversions || 0), 0),
        totalConversionsValue: rows.reduce((s, r) => s + Number(r.metrics?.conversionsValue || 0), 0),
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
          conversionsValue: Number(r.metrics?.conversionsValue || 0),
          // Calcular ROAS manualmente
          roas: Number(r.metrics?.costMicros || 0) > 0 ? 
            Number(r.metrics?.conversionsValue || 0) / (Number(r.metrics?.costMicros || 0) / 1e6) : 0,
          cpa: Number(r.metrics?.costPerConversion || 0),
          valuePerConversion: Number(r.metrics?.valuePerConversion || 0),
          ctr: r.metrics?.clicks && r.metrics?.impressions ? 
            (Number(r.metrics.clicks) / Number(r.metrics.impressions)) * 100 : 0,
          cpc: r.metrics?.clicks && Number(r.metrics?.clicks) > 0 ? 
            Number(r.metrics?.costMicros || 0) / Number(r.metrics.clicks) / 1e6 : 0,
          convRate: r.metrics?.clicks && Number(r.metrics?.clicks) > 0 ? 
            (Number(r.metrics?.conversions || 0) / Number(r.metrics.clicks)) * 100 : 0
        }))
      };
    }
  },


  // 3. NUEVO: Rendimiento por dispositivo
  rendimientoPorDispositivo: {
    queryTemplate: `
    SELECT 
      segments.device,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM campaign
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
          totalConversionsValue: 0,
          devices: []
        };
      }
      
      return {
        totalImpressions: rows.reduce((s, r) => s + Number(r.metrics?.impressions || 0), 0),
        totalClicks: rows.reduce((s, r) => s + Number(r.metrics?.clicks || 0), 0),
        totalCost: rows.reduce((s, r) => s + Number(r.metrics?.costMicros || 0) / 1e6, 0),
        totalConversions: rows.reduce((s, r) => s + Number(r.metrics?.conversions || 0), 0),
        totalConversionsValue: rows.reduce((s, r) => s + Number(r.metrics?.conversionsValue || 0), 0),
        devices: rows.map(r => ({
          device: r.segments?.device || '',
          impressions: Number(r.metrics?.impressions || 0),
          clicks: Number(r.metrics?.clicks || 0),
          cost: Number(r.metrics?.costMicros || 0) / 1e6,
          conversions: Number(r.metrics?.conversions || 0),
          conversionsValue: Number(r.metrics?.conversionsValue || 0),
          // Calcular ROAS manualmente
          roas: Number(r.metrics?.costMicros || 0) > 0 ? 
            Number(r.metrics?.conversionsValue || 0) / (Number(r.metrics?.costMicros || 0) / 1e6) : 0,
          ctr: r.metrics?.clicks && r.metrics?.impressions ? 
            (Number(r.metrics.clicks) / Number(r.metrics.impressions)) * 100 : 0,
          cpc: r.metrics?.clicks && Number(r.metrics?.clicks) > 0 ? 
            Number(r.metrics?.costMicros || 0) / Number(r.metrics.clicks) / 1e6 : 0,
          convRate: r.metrics?.clicks && Number(r.metrics?.clicks) > 0 ? 
            (Number(r.metrics?.conversions || 0) / Number(r.metrics.clicks)) * 100 : 0
        }))
      };
    }
  },

  // 4. NUEVO: Rendimiento por ubicación geográfica (CORREGIDO)
  rendimientoPorUbicacion: {
    queryTemplate: `
    SELECT 
      geographic_view.country_criterion_id,
      geographic_view.location_type,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM geographic_view
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
          totalConversionsValue: 0,
          locations: []
        };
      }
      
      return {
        totalImpressions: rows.reduce((s, r) => s + Number(r.metrics?.impressions || 0), 0),
        totalClicks: rows.reduce((s, r) => s + Number(r.metrics?.clicks || 0), 0),
        totalCost: rows.reduce((s, r) => s + Number(r.metrics?.costMicros || 0) / 1e6, 0),
        totalConversions: rows.reduce((s, r) => s + Number(r.metrics?.conversions || 0), 0),
        totalConversionsValue: rows.reduce((s, r) => s + Number(r.metrics?.conversionsValue || 0), 0),
        locations: rows.map(r => ({
          countryCriterionId: r.geographicView?.countryCriterionId || '',
          locationType: r.geographicView?.locationType || '',
          impressions: Number(r.metrics?.impressions || 0),
          clicks: Number(r.metrics?.clicks || 0),
          cost: Number(r.metrics?.costMicros || 0) / 1e6,
          conversions: Number(r.metrics?.conversions || 0),
          conversionsValue: Number(r.metrics?.conversionsValue || 0),
          // Calcular ROAS manualmente
          roas: Number(r.metrics?.costMicros || 0) > 0 ? 
            Number(r.metrics?.conversionsValue || 0) / (Number(r.metrics?.costMicros || 0) / 1e6) : 0,
          ctr: r.metrics?.clicks && r.metrics?.impressions ? 
            (Number(r.metrics.clicks) / Number(r.metrics.impressions)) * 100 : 0,
          cpc: r.metrics?.clicks && Number(r.metrics?.clicks) > 0 ? 
            Number(r.metrics?.costMicros || 0) / Number(r.metrics.clicks) / 1e6 : 0,
          convRate: r.metrics?.clicks && Number(r.metrics?.clicks) > 0 ? 
            (Number(r.metrics?.conversions || 0) / Number(r.metrics.clicks)) * 100 : 0
        }))
      };
    }
  },

  // 5. NUEVO: Rendimiento de Shopping (CORREGIDO)
  rendimientoShopping: {
    queryTemplate: `
    SELECT 
      shopping_performance_view.product_title,
      shopping_performance_view.product_id,
      shopping_performance_view.product_brand,
      shopping_performance_view.product_category_level1,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM shopping_performance_view
    WHERE segments.date BETWEEN '$START_DATE' AND '$END_DATE'
    ORDER BY metrics.clicks DESC
    `,
    processRows: (rows) => {
      if (!rows || rows.length === 0) {
        return {
          totalImpressions: 0,
          totalClicks: 0,
          totalCost: 0,
          totalConversions: 0,
          totalConversionsValue: 0,
          products: []
        };
      }
      
      return {
        totalImpressions: rows.reduce((s, r) => s + Number(r.metrics?.impressions || 0), 0),
        totalClicks: rows.reduce((s, r) => s + Number(r.metrics?.clicks || 0), 0),
        totalCost: rows.reduce((s, r) => s + Number(r.metrics?.costMicros || 0) / 1e6, 0),
        totalConversions: rows.reduce((s, r) => s + Number(r.metrics?.conversions || 0), 0),
        totalConversionsValue: rows.reduce((s, r) => s + Number(r.metrics?.conversionsValue || 0), 0),
        products: rows.map(r => ({
          productTitle: r.shoppingPerformanceView?.productTitle || '',
          productId: r.shoppingPerformanceView?.productId || '',
          productBrand: r.shoppingPerformanceView?.productBrand || '',
          productCategory: r.shoppingPerformanceView?.productCategoryLevel1 || '',
          impressions: Number(r.metrics?.impressions || 0),
          clicks: Number(r.metrics?.clicks || 0),
          cost: Number(r.metrics?.costMicros || 0) / 1e6,
          conversions: Number(r.metrics?.conversions || 0),
          conversionsValue: Number(r.metrics?.conversionsValue || 0),
          // Calcular ROAS manualmente
          roas: Number(r.metrics?.costMicros || 0) > 0 ? 
            Number(r.metrics?.conversionsValue || 0) / (Number(r.metrics?.costMicros || 0) / 1e6) : 0,
          ctr: r.metrics?.clicks && r.metrics?.impressions ? 
            (Number(r.metrics.clicks) / Number(r.metrics.impressions)) * 100 : 0,
          cpc: r.metrics?.clicks && Number(r.metrics?.clicks) > 0 ? 
            Number(r.metrics?.costMicros || 0) / Number(r.metrics.clicks) / 1e6 : 0,
          convRate: r.metrics?.clicks && Number(r.metrics?.clicks) > 0 ? 
            (Number(r.metrics?.conversions || 0) / Number(r.metrics.clicks)) * 100 : 0
        }))
      };
    }
  },

  // 6. NUEVO: Rendimiento por horario
  rendimientoPorHorario: {
    queryTemplate: `
    SELECT 
      segments.hour,
      segments.day_of_week,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.conversions_value_per_cost
    FROM campaign
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
          totalConversionsValue: 0,
          hours: []
        };
      }
      
      return {
        totalImpressions: rows.reduce((s, r) => s + Number(r.metrics?.impressions || 0), 0),
        totalClicks: rows.reduce((s, r) => s + Number(r.metrics?.clicks || 0), 0),
        totalCost: rows.reduce((s, r) => s + Number(r.metrics?.costMicros || 0) / 1e6, 0),
        totalConversions: rows.reduce((s, r) => s + Number(r.metrics?.conversions || 0), 0),
        totalConversionsValue: rows.reduce((s, r) => s + Number(r.metrics?.conversionsValue || 0), 0),
        hours: rows.map(r => ({
          hour: Number(r.segments?.hour || 0),
          dayOfWeek: r.segments?.dayOfWeek || '',
          impressions: Number(r.metrics?.impressions || 0),
          clicks: Number(r.metrics?.clicks || 0),
          cost: Number(r.metrics?.costMicros || 0) / 1e6,
          conversions: Number(r.metrics?.conversions || 0),
          conversionsValue: Number(r.metrics?.conversionsValue || 0),
          roas: Number(r.metrics?.conversionsValuePerCost || 0),
          ctr: r.metrics?.clicks && r.metrics?.impressions ? 
            (Number(r.metrics.clicks) / Number(r.metrics.impressions)) * 100 : 0,
          cpc: r.metrics?.clicks && Number(r.metrics?.clicks) > 0 ? 
            Number(r.metrics?.costMicros || 0) / Number(r.metrics.clicks) / 1e6 : 0,
          convRate: r.metrics?.clicks && Number(r.metrics?.clicks) > 0 ? 
            (Number(r.metrics?.conversions || 0) / Number(r.metrics.clicks)) * 100 : 0
        }))
      };
    }
  },

 metricsConversiones: {
    queryTemplate: `
    SELECT 
      segments.conversion_action_name,
      segments.conversion_action_category,
      metrics.conversions,
      metrics.conversions_value,
      metrics.all_conversions,
      metrics.all_conversions_value,
      metrics.cross_device_conversions,
      metrics.view_through_conversions,
      metrics.value_per_conversion
    FROM campaign
    WHERE segments.date BETWEEN '$START_DATE' AND '$END_DATE'
    AND metrics.conversions > 0
    ORDER BY metrics.conversions_value DESC
    `,
    processRows: (rows) => {
      if (!rows || rows.length === 0) {
        return {
          totalImpressions: 0,
          totalClicks: 0,
          totalCost: 0,
          totalConversions: 0,
          totalConversionsValue: 0,
          conversions: []
        };
      }
      
      return {
        totalImpressions: 0,
        totalClicks: 0,
        totalCost: 0,
        totalConversions: rows.reduce((s, r) => s + Number(r.metrics?.conversions || 0), 0),
        totalConversionsValue: rows.reduce((s, r) => s + Number(r.metrics?.conversionsValue || 0), 0),
        conversions: rows.map(r => ({
          conversionActionName: r.segments?.conversionActionName || '',
          conversionActionCategory: r.segments?.conversionActionCategory || '',
          conversions: Number(r.metrics?.conversions || 0),
          conversionsValue: Number(r.metrics?.conversionsValue || 0),
          allConversions: Number(r.metrics?.allConversions || 0),
          allConversionsValue: Number(r.metrics?.allConversionsValue || 0),
          crossDeviceConversions: Number(r.metrics?.crossDeviceConversions || 0),
          viewThroughConversions: Number(r.metrics?.viewThroughConversions || 0),
          valuePerConversion: Number(r.metrics?.valuePerConversion || 0)
        }))
      };
    }
  },

  // 8. NUEVO: Métricas de E-commerce avanzadas
  metricsEcommerce: {
    queryTemplate: `
    SELECT 
      campaign.name,
      metrics.average_order_value_micros,
      metrics.orders,
      metrics.revenue_micros,
      metrics.units_sold,
      metrics.average_cart_size,
      metrics.cost_of_goods_sold_micros,
      metrics.gross_profit_micros,
      metrics.gross_profit_margin,
      metrics.cross_sell_revenue_micros,
      metrics.cross_sell_units_sold,
      metrics.lead_revenue_micros,
      metrics.lead_units_sold
    FROM campaign
    WHERE segments.date BETWEEN '$START_DATE' AND '$END_DATE'
    AND metrics.orders > 0
    ORDER BY metrics.revenue_micros DESC
    `,
    processRows: (rows) => {
      if (!rows || rows.length === 0) {
        return {
          totalImpressions: 0,
          totalClicks: 0,
          totalCost: 0,
          totalConversions: 0,
          totalConversionsValue: 0,
          ecommerce: []
        };
      }
      
      const totalRevenue = rows.reduce((s, r) => s + Number(r.metrics?.revenueMicros || 0) / 1e6, 0);
      const totalOrders = rows.reduce((s, r) => s + Number(r.metrics?.orders || 0), 0);
      const totalUnits = rows.reduce((s, r) => s + Number(r.metrics?.unitsSold || 0), 0);
      
      return {
        totalImpressions: 0, // No aplica
        totalClicks: 0, // No aplica
        totalCost: 0, // No aplica
        totalConversions: totalOrders,
        totalConversionsValue: totalRevenue,
        totalRevenue,
        totalOrders,
        totalUnits,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        ecommerce: rows.map(r => ({
          campaignName: r.campaign?.name || '',
          averageOrderValue: Number(r.metrics?.averageOrderValueMicros || 0) / 1e6,
          orders: Number(r.metrics?.orders || 0),
          revenue: Number(r.metrics?.revenueMicros || 0) / 1e6,
          unitsSold: Number(r.metrics?.unitsSold || 0),
          averageCartSize: Number(r.metrics?.averageCartSize || 0),
          costOfGoodsSold: Number(r.metrics?.costOfGoodsSoldMicros || 0) / 1e6,
          grossProfit: Number(r.metrics?.grossProfitMicros || 0) / 1e6,
          grossProfitMargin: Number(r.metrics?.grossProfitMargin || 0),
          crossSellRevenue: Number(r.metrics?.crossSellRevenueMicros || 0) / 1e6,
          crossSellUnits: Number(r.metrics?.crossSellUnitsSold || 0),
          leadRevenue: Number(r.metrics?.leadRevenueMicros || 0) / 1e6,
          leadUnits: Number(r.metrics?.leadUnitsSold || 0)
        }))
      };
    }
  },

  // 9. NUEVO: Impression Share y competencia
  metricsImpressionShare: {
    queryTemplate: `
    SELECT 
      campaign.name,
      campaign.advertising_channel_type,
      metrics.search_impression_share,
      metrics.search_budget_lost_impression_share,
      metrics.search_rank_lost_impression_share,
      metrics.search_top_impression_share,
      metrics.search_absolute_top_impression_share,
      metrics.content_impression_share,
      metrics.content_budget_lost_impression_share,
      metrics.content_rank_lost_impression_share
    FROM campaign
    WHERE segments.date BETWEEN '$START_DATE' AND '$END_DATE'
    AND campaign.status != 'REMOVED'
    ORDER BY metrics.search_impression_share DESC
    `,
    processRows: (rows) => {
      if (!rows || rows.length === 0) {
        return {
          totalImpressions: 0,
          totalClicks: 0,
          totalCost: 0,
          totalConversions: 0,
          totalConversionsValue: 0,
          impressionShare: []
        };
      }
      
      return {
        totalImpressions: 0, // No aplica
        totalClicks: 0, // No aplica
        totalCost: 0, // No aplica
        totalConversions: 0, // No aplica
        totalConversionsValue: 0, // No aplica
        averageSearchImpressionShare: rows.reduce((s, r) => s + Number(r.metrics?.searchImpressionShare || 0), 0) / rows.length,
        impressionShare: rows.map(r => ({
          campaignName: r.campaign?.name || '',
          channelType: r.campaign?.advertisingChannelType || '',
          searchImpressionShare: Number(r.metrics?.searchImpressionShare || 0) * 100,
          searchBudgetLostImpressionShare: Number(r.metrics?.searchBudgetLostImpressionShare || 0) * 100,
          searchRankLostImpressionShare: Number(r.metrics?.searchRankLostImpressionShare || 0) * 100,
          searchTopImpressionShare: Number(r.metrics?.searchTopImpressionShare || 0) * 100,
          searchAbsoluteTopImpressionShare: Number(r.metrics?.searchAbsoluteTopImpressionShare || 0) * 100,
          contentImpressionShare: Number(r.metrics?.contentImpressionShare || 0) * 100,
          contentBudgetLostImpressionShare: Number(r.metrics?.contentBudgetLostImpressionShare || 0) * 100,
          contentRankLostImpressionShare: Number(r.metrics?.contentRankLostImpressionShare || 0) * 100
        }))
      };
    }
  }
};

