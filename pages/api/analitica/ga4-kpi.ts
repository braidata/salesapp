// pages/api/ga4-kpis.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const auth = new GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || ''),
      scopes: ['https://www.googleapis.com/auth/analytics.readonly']
    });
    
    const analyticsData = google.analyticsdata({
      version: 'v1beta',
      auth
    });
    
    // Obtener datos de conversión web
    const conversionResponse = await analyticsData.properties.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID_VENTUS}`,
      requestBody: {
        dateRanges: [
          {
            startDate: '30daysAgo',
            endDate: 'today'
          }
        ],
        dimensions: [
          {
            name: 'date'
          }
        ],
        metrics: [
          {
            name: 'sessions'
          },
          {
            name: 'conversions'
          },
          {
            name: 'ecommercePurchases' 
          }
        ]
      }
    });
    
    // Obtener datos de tráfico por fuente
    const trafficSourceResponse = await analyticsData.properties.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID_VENTUS}`,
      requestBody: {
        dateRanges: [
          {
            startDate: '30daysAgo',
            endDate: 'today'
          }
        ],
        dimensions: [
          {
            name: 'sessionSource'
          }
        ],
        metrics: [
          {
            name: 'sessions'
          },
          {
            name: 'totalUsers'
          }
        ]
      }
    });
    
    // Obtener datos de palabras buscadas
    const searchResponse = await analyticsData.properties.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID_VENTUS}`,
      requestBody: {
        dateRanges: [
          {
            startDate: '30daysAgo',
            endDate: 'today'
          }
        ],
        dimensions: [
          {
            name: 'searchTerm'
          }
        ],
        metrics: [
          {
            name: 'sessions'
          },
          {
            name: 'screenPageViews'
          }
        ]
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'KPIs obtenidos exitosamente',
      data: {
        conversion: conversionResponse.data,
        trafficSource: trafficSourceResponse.data,
        searchTerms: searchResponse.data
      }
    });
  } catch (error: any) {
    console.error('Error completo:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener KPIs',
      error: error.message
    });
  }
}