// pages/api/ga4-sales.ts
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
    
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID_VENTUS}`,
      dateRanges: [
        {
          startDate: '30daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [
        {
          name: 'date',
        },
      ],
      metrics: [
        {
          name: 'ecommercePurchases', // Cantidad de pedidos
        },
        {
          name: 'purchaseRevenue', // Ingresos totales
        },
        {
          name: 'averagePurchaseRevenue', // Ticket promedio
        }
      ],
    });
    
    res.status(200).json({
      success: true,
      message: 'Datos de ventas obtenidos exitosamente',
      data: response
    });
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos de ventas',
      error: error.message
    });
  }
}