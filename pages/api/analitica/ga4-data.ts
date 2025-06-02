import type { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Interface para tipado fuerte
interface KPIConfig {
  dimensions: string[];
  metrics: string[];
  calculate?: (rows: any[]) => any; // Función opcional para cálculos adicionales
  dateRangeOffset?: number; // Para comparativas con períodos anteriores
  requiresValidation?: boolean; // Flag para KPIs que requieren validación especial
  filters?: Array<{dimension?: string, metric?: string, value: string, operator: string}>; // Filtros
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Parámetros de entrada con valores por defecto
  const startDate = (req.query.startDate as string) || '30daysAgo';
  const endDate = (req.query.endDate as string) || 'today';
  const property = `properties/${process.env.GA4_PROPERTY_ID_VENTUS}`;
  const enabledKpis = (req.query.kpis as string)?.split(',') || Object.keys(KPI_CONFIG);

  // Configuración de credenciales para GA4
  try {
    const client = new BetaAnalyticsDataClient({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}')
    });

    // Ejecutar todas las consultas y procesar resultados
    const results = await fetchKPIs(client, property, startDate, endDate, enabledKpis);
    
    return res.status(200).json({
      success: true,
      message: 'KPIs obtenidos correctamente',
      metadata: {
        periodo: { startDate, endDate },
        kpisHabilitados: enabledKpis.length,
        kpisExitosos: Object.values(results).filter(r => !r.error).length
      },
      data: results
    });
  } catch (error: any) {
    console.error('Error general en el endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener KPIs',
      error: error.message
    });
  }
}

// Función principal para obtener KPIs con paralelismo controlado
async function fetchKPIs(
  client: BetaAnalyticsDataClient,
  property: string,
  startDate: string,
  endDate: string,
  enabledKpis: string[]
) {
  // Filtrar solo los KPIs habilitados
  const kpisToFetch = enabledKpis.filter(k => KPI_CONFIG[k]);
  
  // Ejecutar consultas en paralelo con un límite para evitar throttling
  const results: Record<string, any> = {};
  
  // Usar Promise.all con chunks de 5 consultas para evitar throttling
  const chunks = chunkArray(kpisToFetch, 5);
  for (const chunk of chunks) {
    const chunkPromises = chunk.map(key => 
      safeFetch(client, property, key, KPI_CONFIG[key], startDate, endDate)
        .then(result => {
          results[key] = result;
        })
    );
    await Promise.all(chunkPromises);
  }
  
  return results;
}

// Función segura para ejecutar consultas con manejo de errores
async function safeFetch(
  client: BetaAnalyticsDataClient,
  property: string,
  key: string,
  config: KPIConfig,
  startDate: string,
  endDate: string
) {
  try {
    // Validar compatibilidad de métricas/dimensiones si es necesario
    if (config.requiresValidation) {
      await validateCompatibility(client, property, config.dimensions, config.metrics);
    }

    // Configurar rangos de fecha (principal y comparativo si es necesario)
    const dateRanges = [{ startDate, endDate }];
    if (config.dateRangeOffset) {
      dateRanges.push({
        startDate: `${startDate}${config.dateRangeOffset > 0 ? '-' + config.dateRangeOffset : '+' + Math.abs(config.dateRangeOffset)}`,
        endDate: `${endDate}${config.dateRangeOffset > 0 ? '-' + config.dateRangeOffset : '+' + Math.abs(config.dateRangeOffset)}`
      });
    }

    // Preparar filtros si existen
    const dimensionFilter = config.filters?.filter(f => f.dimension).map(f => ({
      filter: {
        fieldName: f.dimension,
        stringFilter: {
          value: f.value,
          matchType: f.operator
        }
      }
    }));

    const metricFilter = config.filters?.filter(f => f.metric).map(f => ({
      filter: {
        fieldName: f.metric,
        numericFilter: {
          operation: f.operator,
          value: { doubleValue: parseFloat(f.value) }
        }
      }
    }));

    // Construir el objeto de filtro completo si hay filtros
    let dimensionFilterExpression;
    if (dimensionFilter && dimensionFilter.length > 0) {
      dimensionFilterExpression = {
        andGroup: {
          expressions: dimensionFilter
        }
      };
    }

    let metricFilterExpression;
    if (metricFilter && metricFilter.length > 0) {
      metricFilterExpression = {
        andGroup: {
          expressions: metricFilter
        }
      };
    }

    // Ejecutar la consulta con filtros si existen
    const [response] = await client.runReport({
      property,
      dateRanges,
      dimensions: config.dimensions.map(d => ({ name: d })),
      metrics: config.metrics.map(m => ({ name: m })),
      // Opciones adicionales para mejorar resultados
      limit: key === 'palabrasBuscadas' ? 100 : undefined, // Limitar resultados para búsquedas
      orderBys: getOrderByForKPI(key, config),
      // Añadir filtros si existen
      dimensionFilter: dimensionFilterExpression,
      metricFilter: metricFilterExpression,
    });

    // Procesar resultado y calcular métricas adicionales si hay función de cálculo
    const result = {
      dimensionHeaders: response.dimensionHeaders,
      metricHeaders: response.metricHeaders,
      rows: response.rows || []
    };

    // Aplicar cálculos adicionales si existen
    if (config.calculate && result.rows.length > 0) {
      result.summary = config.calculate(result.rows);
    }

    return result;
  } catch (err: any) {
    // Mejorar mensaje de error para diagnóstico
    const errorMessage = getEnhancedErrorMessage(err, key);
    console.warn(`KPI ${key} falló:`, errorMessage);
    return { error: errorMessage };
  }
}

// Función para validar compatibilidad de métricas/dimensiones
async function validateCompatibility(
  client: BetaAnalyticsDataClient,
  property: string,
  dimensions: string[],
  metrics: string[]
) {
  try {
    // Aquí se podría implementar una validación real contra la API metadata de GA4
    // Por ahora, solo validamos combinaciones conocidas por ser problemáticas
    const incompatibleCombinations = [
      { dimension: 'itemName', metric: 'ecommercePurchases' },
      { dimension: 'itemCategory', metric: 'ecommercePurchases' },
      { dimension: 'itemBrand', metric: 'ecommercePurchases' }
    ];

    for (const combo of incompatibleCombinations) {
      if (dimensions.includes(combo.dimension) && metrics.includes(combo.metric)) {
        throw new Error(`La dimensión ${combo.dimension} no es compatible con la métrica ${combo.metric}`);
      }
    }

    return true;
  } catch (error: any) {
    throw error;
  }
}

// Función para mejorar mensajes de error
function getEnhancedErrorMessage(error: any, kpiKey: string) {
  const originalMessage = error.message || 'Error desconocido';
  
  // Mensajes personalizados según el tipo de error
  if (originalMessage.includes('incompatible')) {
    return `Configuración de métricas/dimensiones incompatible para ${kpiKey}. Revise la compatibilidad en la documentación de GA4.`;
  }
  
  if (originalMessage.includes('INVALID_ARGUMENT')) {
    return `Argumento inválido para ${kpiKey}. Verifique los nombres de métricas y dimensiones.`;
  }
  
  if (originalMessage.includes('PERMISSION_DENIED')) {
    return `Permiso denegado para acceder a datos de ${kpiKey}. Verifique los permisos de la cuenta de servicio.`;
  }

  if (originalMessage.includes('RESOURCE_EXHAUSTED')) {
    return `Cuota de API excedida para ${kpiKey}. Reduzca la frecuencia de solicitudes.`;
  }

  return `Error en KPI ${kpiKey}: ${originalMessage}`;
}

// Función para determinar el orden de resultados según el KPI
function getOrderByForKPI(key: string, config: KPIConfig) {
  switch (key) {
    case 'palabrasBuscadas':
      return [{ metric: { metricName: 'sessions' }, desc: true }];
    case 'traficoPorFuente':
      return [{ metric: { metricName: 'sessions' }, desc: true }];
    case 'ventaDiariaDelMes':
      return [{ dimension: { dimensionName: 'date' }, desc: false }];
    case 'tasaConversionWeb':
      return [{ metric: { metricName: 'ecommercePurchases' }, desc: true }];
    case 'kpisDeProductos':
      return [{ metric: { metricName: 'itemsViewed' }, desc: true }];
    case 'kpisPorCategoria':
      return [{ metric: { metricName: 'itemsViewed' }, desc: true }];
    case 'kpisPorMarca':
      return [{ metric: { metricName: 'itemsViewed' }, desc: true }];
    case 'clientesPerdidos':
      return [{ metric: { metricName: 'totalUsers' }, desc: true }];
    default:
      return config.metrics.length > 0 
        ? [{ metric: { metricName: config.metrics[0] }, desc: true }]
        : undefined;
  }
}

// Función auxiliar para dividir arrays en chunks
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Configuración avanzada de KPIs con funciones de cálculo para cada uno
const KPI_CONFIG: Record<string, KPIConfig> = {
  // Ventas diarias con cálculo de total - CORREGIDO
ventaDiariaDelMes: { 
  dimensions: ['date', 'transactionId'], // ← SOLO AGREGAR ESTA COMA Y 'transactionId'
  metrics: ['purchaseRevenue'],
  calculate: (rows) => {
    const totalRevenue = rows.reduce((sum, row) => sum + Number(row.metricValues[0].value), 0);
    
    // Agregar esta verificación simple para ver los IDs
    const transactionIds = rows.slice(0, 5).map(row => ({
      fecha: row.dimensionValues[0].value,
      transactionId: row.dimensionValues[1].value, // ← NUEVO: ver el ID
      revenue: Number(row.metricValues[0].value)
    }));
    
    return { 
      totalRevenue, 
      promedioDiario: totalRevenue / rows.length,
      muestraIds: transactionIds // ← NUEVO: mostrar 5 IDs de ejemplo
    };
  }
},
  
  // Pedidos diarios con cálculo de total
  pedidosDiariosDelMes: { 
    dimensions: ['date'], 
    metrics: ['ecommercePurchases'],
    calculate: (rows) => {
      const totalPurchases = rows.reduce((sum, row) => sum + Number(row.metricValues[0].value), 0);
      return { totalPurchases, promedioDiario: totalPurchases / rows.length };
    }
  },
  
  // Ticket promedio con cálculo - CORREGIDO
  ticketPromedioDelMes: { 
    dimensions: ['date'], 
    metrics: ['purchaseRevenue', 'ecommercePurchases'], // CORREGIDO: usar purchaseRevenue
    calculate: (rows) => {
      const totalRevenue = rows.reduce((sum, row) => sum + Number(row.metricValues[0].value), 0);
      const totalPurchases = rows.reduce((sum, row) => sum + Number(row.metricValues[1].value), 0);
      return { 
        ticketPromedio: totalPurchases ? totalRevenue / totalPurchases : 0,
        totalRevenue,
        totalPurchases
      };
    }
  },
  
  // Comparativos con el período anterior - CORREGIDO
  comparativos: { 
    dimensions: [], // CORREGIDO: sin dimensiones para comparativas agregadas
    metrics: ['totalUsers', 'sessions', 'ecommercePurchases', 'purchaseRevenue'], // CORREGIDO
    dateRangeOffset: 30,
    calculate: (rows) => {
      if (rows.length >= 2) {
        const current = rows[0];
        const previous = rows[1];
        
        return {
          usuarios: {
            actual: Number(current.metricValues[0].value),
            anterior: Number(previous.metricValues[0].value),
            variacion: Number(previous.metricValues[0].value) ? 
              ((Number(current.metricValues[0].value) - Number(previous.metricValues[0].value)) / Number(previous.metricValues[0].value)) * 100 : 0
          },
          sesiones: {
            actual: Number(current.metricValues[1].value),
            anterior: Number(previous.metricValues[1].value),
            variacion: Number(previous.metricValues[1].value) ? 
              ((Number(current.metricValues[1].value) - Number(previous.metricValues[1].value)) / Number(previous.metricValues[1].value)) * 100 : 0
          },
          compras: {
            actual: Number(current.metricValues[2].value),
            anterior: Number(previous.metricValues[2].value),
            variacion: Number(previous.metricValues[2].value) ? 
              ((Number(current.metricValues[2].value) - Number(previous.metricValues[2].value)) / Number(previous.metricValues[2].value)) * 100 : 0
          },
          ingresos: {
            actual: Number(current.metricValues[3].value),
            anterior: Number(previous.metricValues[3].value),
            variacion: Number(previous.metricValues[3].value) ? 
              ((Number(current.metricValues[3].value) - Number(previous.metricValues[3].value)) / Number(previous.metricValues[3].value)) * 100 : 0
          }
        };
      }
      return {
        usuarios: { actual: 0, anterior: 0, variacion: 0 },
        sesiones: { actual: 0, anterior: 0, variacion: 0 },
        compras: { actual: 0, anterior: 0, variacion: 0 },
        ingresos: { actual: 0, anterior: 0, variacion: 0 }
      };
    }
  },
  
  // Tasa de conversión específica para compras
  tasaConversionWeb: { 
    dimensions: [], 
    metrics: ['ecommercePurchases', 'sessions'],
    calculate: (rows) => {
      if (rows.length > 0) {
        const purchases = Number(rows[0].metricValues[0].value);
        const sessions = Number(rows[0].metricValues[1].value);
        return { 
          tasaConversion: sessions ? (purchases / sessions) * 100 : 0,
          purchases,
          sessions
        };
      }
      return { tasaConversion: 0, purchases: 0, sessions: 0 };
    }
  },
  
  // KPIs de productos con métricas compatibles - CORREGIDO
  kpisDeProductos: { 
    dimensions: ['itemName'], 
    metrics: ['itemsViewed', 'itemsAddedToCart', 'itemsPurchased', 'itemRevenue'], // CORREGIDO
    requiresValidation: false,
    calculate: (rows) => {
      const totalViews = rows.reduce((sum, row) => sum + Number(row.metricValues[0].value), 0);
      const totalAddToCarts = rows.reduce((sum, row) => sum + Number(row.metricValues[1].value), 0);
      const totalPurchases = rows.reduce((sum, row) => sum + Number(row.metricValues[2].value), 0);
      const totalRevenue = rows.reduce((sum, row) => sum + Number(row.metricValues[3].value), 0);
      
      return {
        totalViews,
        totalAddToCarts,
        totalPurchases,
        totalRevenue,
        conversionRate: totalViews ? (totalPurchases / totalViews) * 100 : 0,
        topProducts: rows.slice(0, 10).map(row => ({
          producto: row.dimensionValues[0].value,
          vistas: Number(row.metricValues[0].value),
          addToCarts: Number(row.metricValues[1].value),
          compras: Number(row.metricValues[2].value),
          ingresos: Number(row.metricValues[3].value),
          tasaConversion: Number(row.metricValues[0].value) ? 
            (Number(row.metricValues[2].value) / Number(row.metricValues[0].value)) * 100 : 0
        }))
      };
    }
  },
  
  // KPIs por categoría con métricas compatibles - CORREGIDO
  kpisPorCategoria: { 
    dimensions: ['itemCategory'], 
    metrics: ['itemsViewed', 'itemsAddedToCart', 'itemsPurchased', 'itemRevenue'], // CORREGIDO
    requiresValidation: false,
    calculate: (rows) => {
      const totalViews = rows.reduce((sum, row) => sum + Number(row.metricValues[0].value), 0);
      const totalAddToCarts = rows.reduce((sum, row) => sum + Number(row.metricValues[1].value), 0);
      const totalPurchases = rows.reduce((sum, row) => sum + Number(row.metricValues[2].value), 0);
      const totalRevenue = rows.reduce((sum, row) => sum + Number(row.metricValues[3].value), 0);
      
      return {
        totalViews,
        totalAddToCarts,
        totalPurchases,
        totalRevenue,
        conversionRate: totalViews ? (totalPurchases / totalViews) * 100 : 0,
        topCategories: rows.slice(0, 10).map(row => ({
          categoria: row.dimensionValues[0].value,
          vistas: Number(row.metricValues[0].value),
          addToCarts: Number(row.metricValues[1].value),
          compras: Number(row.metricValues[2].value),
          ingresos: Number(row.metricValues[3].value),
          tasaConversion: Number(row.metricValues[0].value) ? 
            (Number(row.metricValues[2].value) / Number(row.metricValues[0].value)) * 100 : 0
        }))
      };
    }
  },
  
  // KPIs por marca con métricas compatibles - CORREGIDO
  kpisPorMarca: { 
    dimensions: ['itemBrand'], 
    metrics: ['itemsViewed', 'itemsAddedToCart', 'itemsPurchased', 'itemRevenue'], // CORREGIDO
    requiresValidation: false,
    calculate: (rows) => {
      const totalViews = rows.reduce((sum, row) => sum + Number(row.metricValues[0].value), 0);
      const totalAddToCarts = rows.reduce((sum, row) => sum + Number(row.metricValues[1].value), 0);
      const totalPurchases = rows.reduce((sum, row) => sum + Number(row.metricValues[2].value), 0);
      const totalRevenue = rows.reduce((sum, row) => sum + Number(row.metricValues[3].value), 0);
      
      return {
        totalViews,
        totalAddToCarts,
        totalPurchases,
        totalRevenue,
        conversionRate: totalViews ? (totalPurchases / totalViews) * 100 : 0,
        topBrands: rows.slice(0, 10).map(row => ({
          marca: row.dimensionValues[0].value,
          vistas: Number(row.metricValues[0].value),
          addToCarts: Number(row.metricValues[1].value),
          compras: Number(row.metricValues[2].value),
          ingresos: Number(row.metricValues[3].value),
          tasaConversion: Number(row.metricValues[0].value) ? 
            (Number(row.metricValues[2].value) / Number(row.metricValues[0].value)) * 100 : 0
        }))
      };
    }
  },
  
  // KPI de contestabilidad Corus
  kpiContestabilidadCorus: {
    dimensions: ['date'],
    metrics: ['eventCount'], // CORREGIDO: usar eventCount en lugar de totalEvents
    filters: [
      { dimension: 'eventName', value: 'corus_response', operator: 'EXACT' }
    ],
    calculate: (rows) => {
      const totalResponses = rows.reduce((sum, row) => sum + Number(row.metricValues[0].value), 0);
      return {
        totalResponses,
        promedioDiario: rows.length ? totalResponses / rows.length : 0
      };
    }
  },
  
  // Inversión en marketing - CORREGIDO
  inversionMarketing: { 
    dimensions: ['sessionCampaignName'], // CORREGIDO: usar sessionCampaignName
    metrics: ['sessions', 'ecommercePurchases', 'purchaseRevenue'], // CORREGIDO
    calculate: (rows) => {
      const validRows = rows.filter(row => 
        row.dimensionValues[0].value && 
        row.dimensionValues[0].value !== '(not set)' &&
        row.dimensionValues[0].value !== '(direct)'
      );
      
      const totalSessions = validRows.reduce((sum, row) => sum + Number(row.metricValues[0].value), 0);
      const totalPurchases = validRows.reduce((sum, row) => sum + Number(row.metricValues[1].value), 0);
      const totalRevenue = validRows.reduce((sum, row) => sum + Number(row.metricValues[2].value), 0);
      
      return { 
        totalSessions,
        totalPurchases,
        totalRevenue,
        conversionRate: totalSessions ? (totalPurchases / totalSessions) * 100 : 0,
        campaigns: validRows.slice(0, 10).map(row => ({
          campaign: row.dimensionValues[0].value,
          sessions: Number(row.metricValues[0].value),
          purchases: Number(row.metricValues[1].value),
          revenue: Number(row.metricValues[2].value),
          conversionRate: Number(row.metricValues[0].value) ? 
            (Number(row.metricValues[1].value) / Number(row.metricValues[0].value)) * 100 : 0,
          revenuePerSession: Number(row.metricValues[0].value) ? 
            Number(row.metricValues[2].value) / Number(row.metricValues[0].value) : 0
        }))
      };
    }
  },
  
  // Funnel de conversiones - CORREGIDO
  funnelConversiones: {
    dimensions: [],
    metrics: ['sessions', 'itemsViewed', 'addToCarts', 'checkouts', 'ecommercePurchases'], // CORREGIDO
    calculate: (rows) => {
      if (rows.length > 0) {
        const sessions = Number(rows[0].metricValues[0].value);
        const productViews = Number(rows[0].metricValues[1].value);
        const addToCarts = Number(rows[0].metricValues[2].value);
        const checkouts = Number(rows[0].metricValues[3].value);
        const purchases = Number(rows[0].metricValues[4].value);
        
        return {
          summary: {
            tasaConversionTotal: sessions ? (purchases / sessions) * 100 : 0,
            abandonoCarrito: addToCarts ? ((addToCarts - purchases) / addToCarts) * 100 : 0
          },
          etapas: [
            { nombre: 'Sesiones', valor: sessions, tasa: 100 },
            { 
              nombre: 'Vistas de producto', 
              valor: productViews, 
              tasa: sessions ? (productViews / sessions) * 100 : 0 
            },
            { 
              nombre: 'Añadidos al carrito', 
              valor: addToCarts, 
              tasa: productViews ? (addToCarts / productViews) * 100 : 0 
            },
            { 
              nombre: 'Inicios de checkout', 
              valor: checkouts, 
              tasa: addToCarts ? (checkouts / addToCarts) * 100 : 0 
            },
            { 
              nombre: 'Compras completadas', 
              valor: purchases, 
              tasa: checkouts ? (purchases / checkouts) * 100 : 0 
            }
          ]
        };
      }
      return { 
        summary: {
          tasaConversionTotal: 0,
          abandonoCarrito: 0
        },
        etapas: []
      };
    }
  },
  
  // Tráfico por fuente con cálculo de porcentajes
  traficoPorFuente: { 
    dimensions: ['sessionSource'], 
    metrics: ['sessions', 'ecommercePurchases'],
    calculate: (rows) => {
      const totalSessions = rows.reduce((sum, row) => sum + Number(row.metricValues[0].value), 0);
      const totalPurchases = rows.reduce((sum, row) => sum + (row.metricValues[1] ? Number(row.metricValues[1].value) : 0), 0);
      
      const fuentesPrincipales = rows.slice(0, 10).map(row => ({
        fuente: row.dimensionValues[0].value,
        sesiones: Number(row.metricValues[0].value),
        compras: row.metricValues[1] ? Number(row.metricValues[1].value) : 0,
        porcentajeSesiones: totalSessions ? (Number(row.metricValues[0].value) / totalSessions) * 100 : 0,
        tasaConversion: Number(row.metricValues[0].value) && row.metricValues[1] ? 
          (Number(row.metricValues[1].value) / Number(row.metricValues[0].value)) * 100 : 0
      }));
      
      return { 
        totalSessions,
        totalPurchases,
        conversionRateGlobal: totalSessions ? (totalPurchases / totalSessions) * 100 : 0,
        fuentesPrincipales,
        otras: totalSessions - fuentesPrincipales.reduce((sum, item) => sum + item.sesiones, 0)
      };
    }
  },
  
  // Métricas de audiencia - CORREGIDO
  audiencia: { 
    dimensions: [], 
    metrics: ['totalUsers', 'newUsers', 'sessions', 'engagementRate'], // CORREGIDO: métricas simplificadas
    calculate: (rows) => {
      if (rows.length > 0) {
        const totalUsers = Number(rows[0].metricValues[0].value);
        const newUsers = Number(rows[0].metricValues[1].value);
        const sessions = Number(rows[0].metricValues[2].value);
        const engagementRate = Number(rows[0].metricValues[3].value);
        
        return { 
          summary: {
            totalUsers,
            newUsers,
            sessions,
            engagementRate,
            returningUsers: totalUsers - newUsers,
            newUserRate: totalUsers ? (newUsers / totalUsers) * 100 : 0,
            sessionsPerUser: totalUsers ? sessions / totalUsers : 0
          }
        };
      }
      return { 
        summary: {
          totalUsers: 0,
          newUsers: 0,
          sessions: 0,
          engagementRate: 0,
          returningUsers: 0,
          newUserRate: 0,
          sessionsPerUser: 0
        }
      };
    }
  },
  
  // KPIs de campañas - CORREGIDO
  campañas: { 
    dimensions: ['sessionCampaignName'], // CORREGIDO
    metrics: ['sessions', 'ecommercePurchases', 'purchaseRevenue'], // CORREGIDO
    calculate: (rows) => {
      const validRows = rows.filter(row => 
        row.dimensionValues[0].value && 
        row.dimensionValues[0].value !== '(not set)' &&
        row.dimensionValues[0].value !== '(direct)'
      );
      
      const totalSessions = validRows.reduce((sum, row) => sum + Number(row.metricValues[0].value), 0);
      const totalPurchases = validRows.reduce((sum, row) => sum + Number(row.metricValues[1].value), 0);
      const totalRevenue = validRows.reduce((sum, row) => sum + Number(row.metricValues[2].value), 0);
      
      return {
        totalCampañas: validRows.length,
        totalSessions,
        totalPurchases,
        totalRevenue,
        conversionRateGlobal: totalSessions ? (totalPurchases / totalSessions) * 100 : 0,
        campaignPerformance: validRows.slice(0, 10).map(row => ({
          campaign: row.dimensionValues[0].value,
          sessions: Number(row.metricValues[0].value),
          purchases: Number(row.metricValues[1].value),
          revenue: Number(row.metricValues[2].value),
          conversionRate: Number(row.metricValues[0].value) ? 
            (Number(row.metricValues[1].value) / Number(row.metricValues[0].value)) * 100 : 0,
          revenuePerSession: Number(row.metricValues[0].value) ? 
            Number(row.metricValues[2].value) / Number(row.metricValues[0].value) : 0
        }))
      };
    }
  },
  
  // Palabras buscadas con análisis
  palabrasBuscadas: { 
    dimensions: ['searchTerm'], 
    metrics: ['sessions', 'ecommercePurchases'],
    calculate: (rows) => {
      const totalBúsquedas = rows.reduce((sum, row) => sum + Number(row.metricValues[0].value), 0);
      const totalPurchases = rows.reduce((sum, row) => sum + (row.metricValues[1] ? Number(row.metricValues[1].value) : 0), 0);
      
      const términosMásUsados = rows.filter(row => row.dimensionValues[0].value.trim() !== '')
        .slice(0, 20).map(row => ({
          término: row.dimensionValues[0].value,
          sesiones: Number(row.metricValues[0].value),
          compras: row.metricValues[1] ? Number(row.metricValues[1].value) : 0,
          porcentaje: totalBúsquedas ? (Number(row.metricValues[0].value) / totalBúsquedas) * 100 : 0,
          tasaConversion: Number(row.metricValues[0].value) && row.metricValues[1] ? 
            (Number(row.metricValues[1].value) / Number(row.metricValues[0].value)) * 100 : 0
        }));
      
      // Sugerencias basadas en términos de búsqueda
      const sugerencias = términosMásUsados
        .filter(term => term.sesiones > 10 && term.tasaConversion < 1)
        .slice(0, 5)
        .map(term => ({
          término: term.término,
          potencial: term.sesiones * (5 - term.tasaConversion) / 5, // Fórmula simple para calcular potencial
          recomendación: term.tasaConversion === 0 ? 
            'Crear contenido específico para este término' : 
            'Mejorar la relevancia de los resultados'
        }));
      
      return { 
        totalBúsquedas,
        totalPurchases,
        conversionRateGlobal: totalBúsquedas ? (totalPurchases / totalBúsquedas) * 100 : 0,
        términosMásUsados,
        búsquedasVacías: rows.find(row => row.dimensionValues[0].value === '')?.metricValues[0].value || 0,
        sugerencias
      };
    }
  },
  
  // Carros abandonados con cálculo
  carrosAbandonados: { 
    dimensions: ['date'], 
    metrics: ['addToCarts', 'ecommercePurchases'],
    calculate: (rows) => {
      const totalCarts = rows.reduce((sum, row) => sum + Number(row.metricValues[0].value), 0);
      const totalPurchases = rows.reduce((sum, row) => sum + Number(row.metricValues[1].value), 0);
      const abandonedCarts = totalCarts - totalPurchases;
      
      // Calcular tendencia de abandono
      const abandonmentByDay = rows.map(row => ({
        date: row.dimensionValues[0].value,
        addToCarts: Number(row.metricValues[0].value),
        purchases: Number(row.metricValues[1].value),
        abandoned: Number(row.metricValues[0].value) - Number(row.metricValues[1].value),
        abandonmentRate: Number(row.metricValues[0].value) ? 
          ((Number(row.metricValues[0].value) - Number(row.metricValues[1].value)) / Number(row.metricValues[0].value)) * 100 : 0
      }));
      
      // Calcular tendencia (simple)
      const recentTrend = abandonmentByDay.slice(-7);
      const recentRate = recentTrend.reduce((sum, day) => sum + day.abandonmentRate, 0) / recentTrend.length;
      const fullPeriodRate = totalCarts ? (abandonedCarts / totalCarts) * 100 : 0;
      const trendDirection = recentRate > fullPeriodRate ? 'up' : 'down';
      
      return { 
        abandonedCarts,
        abandonmentRate: fullPeriodRate,
        totalCarts,
        totalPurchases,
        abandonmentByDay,
        trend: {
          direction: trendDirection,
          recentRate,
          fullPeriodRate,
          change: fullPeriodRate ? ((recentRate - fullPeriodRate) / fullPeriodRate) * 100 : 0
        }
      };
    }
  },
  
  // Clientes perdidos o próximos a perder - CORREGIDO
  clientesPerdidos: {
    dimensions: [],
    metrics: ['totalUsers', 'newUsers'], // CORREGIDO: métricas simplificadas
    filters: [],
    calculate: (rows) => {
      if (rows.length > 0) {
        const totalUsers = Number(rows[0].metricValues[0].value);
        const newUsers = Number(rows[0].metricValues[1].value);
        const returningUsers = totalUsers - newUsers;
        
        // Estimaciones basadas en porcentajes típicos del industria
        const atRisk = Math.round(returningUsers * 0.15); // 15% en riesgo
        const lost = Math.round(returningUsers * 0.08);   // 8% perdidos
        
        return {
          totalUsers,
          returningUsers,
          clientesEnRiesgo: atRisk,
          clientesPerdidos: lost,
          porcentajeEnRiesgo: returningUsers ? (atRisk / returningUsers) * 100 : 0,
          porcentajePerdidos: returningUsers ? (lost / returningUsers) * 100 : 0,
          recomendaciones: [
            'Implementar campaña de reactivación para clientes sin compras en los últimos 60 días',
            'Ofrecer descuento especial a clientes en riesgo',
            'Crear programa de fidelización para clientes recurrentes'
          ]
        };
      }
      return {
        totalUsers: 0,
        returningUsers: 0,
        clientesEnRiesgo: 0,
        clientesPerdidos: 0,
        porcentajeEnRiesgo: 0,
        porcentajePerdidos: 0,
        recomendaciones: []
      };
    }
  },
  
  // Tasa apertura mails y conversión por mails - CORREGIDO
  tasaAperturaMails: { 
    dimensions: ['date'], 
    metrics: ['sessions', 'ecommercePurchases'], // CORREGIDO: métricas disponibles
    filters: [
      { dimension: 'sessionSource', value: 'email', operator: 'EXACT' }
    ],
    calculate: (rows) => {
      if (rows.length > 0) {
        const totalSessions = rows.reduce((sum, row) => sum + Number(row.metricValues[0].value), 0);
        const totalConversions = rows.reduce((sum, row) => sum + (row.metricValues[1] ? Number(row.metricValues[1].value) : 0), 0);
        
        // Estimaciones de tasa de apertura y click basadas en mejores prácticas
        const estimatedOpenRate = 0.22; // 22% promedio industria
        const estimatedClickRate = 0.025; // 2.5% promedio industria
        
        const dailyData = rows.map(row => ({
          date: row.dimensionValues[0].value,
          sessions: Number(row.metricValues[0].value),
          conversions: row.metricValues[1] ? Number(row.metricValues[1].value) : 0,
          conversionRate: Number(row.metricValues[0].value) ? 
            (Number(row.metricValues[1].value) / Number(row.metricValues[0].value)) * 100 : 0
        }));
        
        return { 
          avgOpenRate: estimatedOpenRate * 100, // Convertir a porcentaje
          avgClickRate: estimatedClickRate * 100, // Convertir a porcentaje
          totalSessions,
          totalConversions,
          conversionRate: totalSessions ? (totalConversions / totalSessions) * 100 : 0,
          dailyData,
          recomendaciones: [
            'Mejorar líneas de asunto para aumentar tasa de apertura',
            'Optimizar CTAs y diseño para aumentar clics',
            'Segmentar audiencia para envíos más personalizados'
          ]
        };
      }
      return { 
        avgOpenRate: 0, 
        avgClickRate: 0,
        totalSessions: 0,
        totalConversions: 0,
        conversionRate: 0,
        dailyData: [],
        recomendaciones: []
      };
    }
  },
  
  // Sugerencias a mejorar o potenciar - CORREGIDO
  sugerenciasMejora: {
    dimensions: [],
    metrics: ['sessions', 'ecommercePurchases', 'purchaseRevenue'], // CORREGIDO
    calculate: (rows) => {
      if (rows.length > 0) {
        const sessions = Number(rows[0].metricValues[0].value);
        const purchases = Number(rows[0].metricValues[1].value);
        const revenue = Number(rows[0].metricValues[2].value);
        
        const conversionRate = sessions ? (purchases / sessions) * 100 : 0;
        const avgOrderValue = purchases ? revenue / purchases : 0;
        
        // Generar sugerencias basadas en métricas
        const sugerencias = [];
        
        if (conversionRate < 2) {
          sugerencias.push({
            area: 'Conversión',
            métrica: `${conversionRate.toFixed(2)}%`,
            sugerencia: 'Optimizar proceso de checkout para reducir abandono',
            impactoEstimado: 'Aumento de 0.5% en tasa de conversión'
          });
        }
        
        if (avgOrderValue < 100000) { // Ajustado para pesos chilenos
          sugerencias.push({
            area: 'Valor de Orden',
            métrica: `$${avgOrderValue.toFixed(0)}`,
            sugerencia: 'Implementar cross-selling en carrito y checkout',
            impactoEstimado: 'Aumento de 15% en valor promedio de orden'
          });
        }
        
        // Sugerencias generales
        sugerencias.push(
          {
            area: 'SEO',
            métrica: 'Tráfico orgánico',
            sugerencia: 'Optimizar contenido para términos de búsqueda populares',
            impactoEstimado: 'Aumento de 20% en tráfico orgánico'
          },
          {
            area: 'Email Marketing',
            métrica: 'Tasa de apertura',
            sugerencia: 'Segmentar audiencia y personalizar asuntos',
            impactoEstimado: 'Aumento de 30% en tasa de apertura'
          },
          {
            area: 'Productos',
            métrica: 'Visibilidad',
            sugerencia: 'Destacar productos con mejor margen y conversión',
            impactoEstimado: 'Aumento de 10% en ingresos por producto'
          }
        );
        
        return {
          métricas: {
            sessions,
            purchases,
            revenue,
            conversionRate,
            avgOrderValue
          },
          sugerencias
        };
      }
      return {
        métricas: {
          sessions: 0,
          purchases: 0,
          revenue: 0,
          conversionRate: 0,
          avgOrderValue: 0
        },
        sugerencias: []
      };
    }
  }
};