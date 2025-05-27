// pages/api/ga4-conversion-funnel.ts
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
    
    // Obtener métricas para cada paso del funnel de conversión
    const [funnelResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID_VENTUS}`,
      dateRanges: [
        {
          startDate: '30daysAgo',
          endDate: 'today',
        },
      ],
      metrics: [
        {
          name: 'sessions', // Visitas
        },
        {
          name: 'productViews', // Vistas de producto
        },
        {
          name: 'addToCarts', // Añadidos al carrito
        },
        {
          name: 'checkouts', // Inicios de checkout
        },
        {
          name: 'ecommercePurchases' // Compras completadas
        }
      ]
    });
    
    // Obtener datos por dispositivo para comparar tasas de conversión
    const [deviceFunnelResponse] = await analyticsDataClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID_VENTUS}`,
      dateRanges: [
        {
          startDate: '30daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [
        {
          name: 'deviceCategory',
        },
      ],
      metrics: [
        {
          name: 'sessions',
        },
        {
          name: 'productViews',
        },
        {
          name: 'addToCarts',
        },
        {
          name: 'checkouts',
        },
        {
          name: 'ecommercePurchases'
        }
      ]
    });
    
    // Procesar los datos del funnel general
    const funnelData = funnelResponse.rows?.[0]?.metricValues;
    
    const funnelSteps = [
      { name: 'Sesiones', value: Number(funnelData?.[0]?.value || '0') },
      { name: 'Vistas de producto', value: Number(funnelData?.[1]?.value || '0') },
      { name: 'Añadido al carrito', value: Number(funnelData?.[2]?.value || '0') },
      { name: 'Checkout', value: Number(funnelData?.[3]?.value || '0') },
      { name: 'Compra', value: Number(funnelData?.[4]?.value || '0') }
    ];
    
    // Calcular tasas de conversión entre pasos
    const funnelRates = [];
    for (let i = 0; i < funnelSteps.length - 1; i++) {
      const currentStep = funnelSteps[i];
      const nextStep = funnelSteps[i + 1];
      
      const conversionRate = currentStep.value > 0 
        ? (nextStep.value / currentStep.value) * 100 
        : 0;
      
      funnelRates.push({
        fromStep: currentStep.name,
        toStep: nextStep.name,
        conversionRate: conversionRate.toFixed(2) + '%',
        dropoffRate: (100 - conversionRate).toFixed(2) + '%'
      });
    }
    
    // Calcular tasa de conversión general (sesiones a compras)
    const overallConversionRate = funnelSteps[0].value > 0 
      ? (funnelSteps[4].value / funnelSteps[0].value) * 100 
      : 0;
    
    // Procesar datos por dispositivo
    const deviceFunnelData = deviceFunnelResponse.rows?.map(row => {
      const device = row.dimensionValues?.[0]?.value || '';
      const sessions = Number(row.metricValues?.[0]?.value || '0');
      const productViews = Number(row.metricValues?.[1]?.value || '0');
      const addToCarts = Number(row.metricValues?.[2]?.value || '0');
      const checkouts = Number(row.metricValues?.[3]?.value || '0');
      const purchases = Number(row.metricValues?.[4]?.value || '0');
      
      const deviceConversionRate = sessions > 0 
        ? (purchases / sessions) * 100 
        : 0;
      
      return {
        device,
        sessions,
        productViews,
        addToCarts,
        checkouts,
        purchases,
        deviceConversionRate: deviceConversionRate.toFixed(2) + '%'
      };
    }) || [];
    
    res.status(200).json({
      success: true,
      message: 'Datos de funnel obtenidos exitosamente',
      data: {
        funnelSteps,
        funnelRates,
        overallConversionRate: overallConversionRate.toFixed(2) + '%',
        deviceFunnel: deviceFunnelData
      }
    });
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos del funnel',
      error: error.message
    });
  }
}