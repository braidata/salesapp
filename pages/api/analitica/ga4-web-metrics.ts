// pages/api/ga4-web-metrics.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '')
    });
    
    // Obtener tasa de conversión general
    const [conversionResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID_VENTUS}`,
      dateRanges: [
        {
          startDate: '30daysAgo',
          endDate: 'today',
        },
      ],
      metrics: [
        {
          name: 'sessions',
        },
        {
          name: 'conversions',
        },
        {
          name: 'ecommercePurchases',
        }
      ],
    });
    
    // Obtener tráfico por fuente
    const [trafficResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID_VENTUS}`,
      dateRanges: [
        {
          startDate: '30daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [
        {
          name: 'sessionSource',
        },
      ],
      metrics: [
        {
          name: 'sessions',
        },
        {
          name: 'totalUsers',
        },
      ],
      orderBys: [
        {
          metric: {
            metricName: 'sessions',
          },
          desc: true,
        }
      ],
    });
    
    // Calcular tasa de conversión
    const sessions = Number(conversionResponse.rows?.[0]?.metricValues?.[0]?.value || '0');
    const purchases = Number(conversionResponse.rows?.[0]?.metricValues?.[2]?.value || '0');
    const conversionRate = sessions > 0 ? (purchases / sessions) * 100 : 0;
    
    res.status(200).json({
      success: true,
      message: 'Métricas web obtenidas exitosamente',
      data: {
        conversionMetrics: {
          sessions,
          conversions: Number(conversionResponse.rows?.[0]?.metricValues?.[1]?.value || '0'),
          purchases,
          conversionRate: conversionRate.toFixed(2) + '%'
        },
        trafficSources: trafficResponse
      }
    });
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas web',
      error: error.message
    });
  }
}