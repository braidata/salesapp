// File: pages/api/collect-ga4.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

interface GA4CollectorResponse {
  success: boolean;
  error?: string;
  summary: {
    collectionDate: string;
    dateRange: {
      from: string;
      to: string;
    };
    processing: {
      datesProcessed: number;
      kpisProcessed: number;
      recordsCreated: number;
      recordsUpdated: number;
      recordsSkipped: number;
      errors: number;
    };
    tablesUpdated: {
      ga4_daily_metrics: number;
      ga4_traffic_sources: number;
      ga4_search_terms: number;
      ga4_product_metrics: number;
      analytics_summary: number;
    };
  };
  kpiResultsByDate: Array<{
    date: string;
    kpiResults: Array<{
      kpi: string;
      status: 'success' | 'failed' | 'skipped';
      recordsProcessed: number;
      error?: string;
    }>;
  }>;
  metadata: {
    totalProcessingTime: number;
    ga4ApiCalls: number;
    databaseOperations: number;
    nextCollectionRecommended: string;
  };
}

interface KPIProcessingResult {
  kpi: string;
  status: 'success' | 'failed' | 'skipped';
  recordsProcessed: number;
  error?: string;
}

const RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  maxRequests: 10
};

const GA4_COLLECTOR_CONFIG = {
  maxRetries: 3,
  retryDelay: 5000,
  requestTimeout: 1200000,
  defaultDateRange: 'yesterday',
  batchSize: 100,
  preserveHistoryDays: 365,
  requiredKPIs: [
    'ventaDiariaDelMes',
    'pedidosDiariosDelMes',
    'ticketPromedioDelMes',
    'traficoPorFuente',
    'palabrasBuscadas',
    'kpisDeProductos'
  ]
};

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const prisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(',')[0]
    : req.socket.remoteAddress || 'unknown';
  return ip.trim();
}

// Retorna un array de fechas (YYYY-MM-DD) entre start y end, inclusivas
function listDatesBetween(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function generateDateRange(daysBack: number = 1): { startDate: string; endDate: string } {
  const today = new Date();
  const targetDate = new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const iso = targetDate.toISOString().split('T')[0];
  return {
    startDate: iso,
    endDate: iso
  };
}

function formatDateForGA4(date: string): string {
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, RATE_LIMIT.windowMs);

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(clientIp, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs
    });
    return false;
  }

  if (entry.count >= RATE_LIMIT.maxRequests) {
    return true;
  }

  entry.count++;
  return false;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = GA4_COLLECTOR_CONFIG.maxRetries
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), GA4_COLLECTOR_CONFIG.requestTimeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown fetch error');
      console.warn(`GA4 API attempt ${attempt}/${retries} failed:`, lastError.message);

      if (attempt < retries) {
        await delay(GA4_COLLECTOR_CONFIG.retryDelay * attempt);
      }
    }
  }

  throw lastError || new Error('All GA4 API attempts failed');
}

async function fetchGA4Data(startDate: string, endDate: string, kpis?: string[]): Promise<any> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const sanitizedBase = baseUrl.replace(/\/$/, '');
  const params = new URLSearchParams({
    startDate: formatDateForGA4(startDate),
    endDate: formatDateForGA4(endDate)
  });

  if (kpis && kpis.length > 0) {
    params.append('kpis', kpis.join(','));
  }

  const url = `${sanitizedBase}/api/analitica/ga4-data?${params.toString()}`;
  console.log(`📊 Fetching GA4 data: ${url}`);

  const response = await fetchWithRetry(url, {
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(`GA4 API failed: ${data.message || 'Unknown error'}`);
  }

  console.log(`✅ GA4 data fetched successfully: ${data.metadata?.kpisExitosos || 0} KPIs`);
  return data;
}

async function processGA4DailyMetrics(date: string, ga4Data: any): Promise<number> {
  try {
    const ventaDiaria = ga4Data.data?.ventaDiariaDelMes;
    const pedidosDiarios = ga4Data.data?.pedidosDiariosDelMes;
    const audiencia = ga4Data.data?.audiencia;
    const funnelConversiones = ga4Data.data?.funnelConversiones;
    const carrosAbandonados = ga4Data.data?.carrosAbandonados;

    if (!ventaDiaria && !pedidosDiarios && !audiencia) {
      console.log(`⚠️ No daily metrics data for ${date}`);
      return 0;
    }

    const sessions = audiencia?.summary?.totalUsers || 0;
    const totalUsers = audiencia?.summary?.totalUsers || 0;
    const newUsers = audiencia?.summary?.newUsers || 0;
    const pageViews = 0; // Value remains zero if GA4 does not provide page_views
    const ecommercePurchases = pedidosDiarios?.summary?.totalPurchases || 0;
    const transactionRevenue = ventaDiaria?.summary?.totalRevenue || 0;
    const conversionRate = funnelConversiones?.summary?.tasaConversionTotal || 0;
    const addToCarts = Number(funnelConversiones?.rows?.[0]?.metricValues?.[2]?.value || 0);
    const abandonedCarts = carrosAbandonados?.summary?.abandonedCarts || 0;
    const abandonment_rate = carrosAbandonados?.summary?.abandonmentRate || 0;

    await prisma.ga4_daily_metrics.upsert({
      where: { date: new Date(date) },
      update: {
        sessions,
        total_users: totalUsers,
        new_users: newUsers,
        page_views: pageViews,
        ecommerce_purchases: ecommercePurchases,
        transaction_revenue: transactionRevenue,
        conversion_rate: conversionRate,
        add_to_carts: addToCarts,
        abandoned_carts: abandonedCarts,
        abandonment_rate: abandonment_rate,
        raw_ga4_data: ga4Data.data
      },
      create: {
        date: new Date(date),
        sessions,
        total_users: totalUsers,
        new_users: newUsers,
        page_views: pageViews,
        ecommerce_purchases: ecommercePurchases,
        transaction_revenue: transactionRevenue,
        conversion_rate: conversionRate,
        add_to_carts: addToCarts,
        abandoned_carts: abandonedCarts,
        abandonment_rate: abandonment_rate,
        raw_ga4_data: ga4Data.data
      }
    });

    console.log(`✅ Updated ga4_daily_metrics for ${date}`);
    return 1;
  } catch (error) {
    console.error(`❌ Error processing daily metrics for ${date}:`, error);
    throw error;
  }
}

async function processGA4TrafficSources(date: string, ga4Data: any): Promise<number> {
  try {
    const trafficData = ga4Data.data?.traficoPorFuente;
    if (!trafficData?.summary?.fuentesPrincipales) {
      console.log(`⚠️ No traffic sources data for ${date}`);
      return 0;
    }

    const sources: Array<{
      fuente: string;
      sesiones: number;
      compras: number;
      tasaConversion: number;
    }> = trafficData.summary.fuentesPrincipales;
    let recordsProcessed = 0;

    for (let i = 0; i < sources.length; i += GA4_COLLECTOR_CONFIG.batchSize) {
      const batch = sources.slice(i, i + GA4_COLLECTOR_CONFIG.batchSize);
      await Promise.all(
        batch.map(async (source) => {
          await prisma.ga4_traffic_sources.upsert({
            where: {
              date_source: {
                date: new Date(date),
                source: source.fuente
              }
            },
            update: {
              sessions: source.sesiones,
              purchases: source.compras,
              conversion_rate: source.tasaConversion
            },
            create: {
              date: new Date(date),
              source: source.fuente,
              sessions: source.sesiones,
              purchases: source.compras,
              conversion_rate: source.tasaConversion
            }
          });
        })
      );
      recordsProcessed += batch.length;
    }

    console.log(`✅ Updated ${recordsProcessed} traffic sources for ${date}`);
    return recordsProcessed;
  } catch (error) {
    console.error(`❌ Error processing traffic sources for ${date}:`, error);
    throw error;
  }
}

async function processGA4SearchTerms(date: string, ga4Data: any): Promise<number> {
  try {
    const searchData = ga4Data.data?.palabrasBuscadas;
    if (!searchData?.summary?.términosMásUsados) {
      console.log(`⚠️ No search terms data for ${date}`);
      return 0;
    }

    const rawTerms: Array<{
      término: string;
      sesiones: number;
      compras: number;
      tasaConversion: number;
    }> = searchData.summary.términosMásUsados;

    // Deduplicar términos para evitar violar índice único
    const uniqueMap = new Map<string, typeof rawTerms[0]>();
    for (const row of rawTerms) {
      const key = row.término.trim().toLowerCase();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, row);
      }
    }
    const terms = Array.from(uniqueMap.values());

    let recordsProcessed = 0;
    for (let i = 0; i < terms.length; i += GA4_COLLECTOR_CONFIG.batchSize) {
      const batch = terms.slice(i, i + GA4_COLLECTOR_CONFIG.batchSize);
      await Promise.all(
        batch.map(async (term) => {
          await prisma.ga4_search_terms.upsert({
            where: {
              date_search_term: {
                date: new Date(date),
                search_term: term.término
              }
            },
            update: {
              sessions: term.sesiones,
              purchases: term.compras,
              conversion_rate: term.tasaConversion
            },
            create: {
              date: new Date(date),
              search_term: term.término,
              sessions: term.sesiones,
              purchases: term.compras,
              conversion_rate: term.tasaConversion
            }
          });
        })
      );
      recordsProcessed += batch.length;
    }

    console.log(`✅ Updated ${recordsProcessed} search terms for ${date}`);
    return recordsProcessed;
  } catch (error) {
    console.error(`❌ Error processing search terms for ${date}:`, error);
    throw error;
  }
}

async function processGA4ProductMetrics(date: string, ga4Data: any): Promise<number> {
  try {
    const productData = ga4Data.data?.kpisDeProductos;
    if (!productData?.summary?.topProducts) {
      console.log(`⚠️ No product metrics data for ${date}`);
      return 0;
    }

    const products: Array<{
      producto: string;
      vistas: number;
      addToCarts: number;
      compras: number;
      ingresos: number;
    }> = productData.summary.topProducts;
    let recordsProcessed = 0;

    for (let i = 0; i < products.length; i += GA4_COLLECTOR_CONFIG.batchSize) {
      const batch = products.slice(i, i + GA4_COLLECTOR_CONFIG.batchSize);
      await Promise.all(
        batch.map(async (product) => {
          await prisma.ga4_product_metrics.upsert({
            where: {
              date_item_name: {
                date: new Date(date),
                item_name: product.producto
              }
            },
            update: {
              item_views: product.vistas,
              item_add_to_carts: product.addToCarts,
              item_purchases: product.compras,
              item_revenue: product.ingresos
            },
            create: {
              date: new Date(date),
              item_name: product.producto,
              item_category: null,
              item_brand: null,
              item_views: product.vistas,
              item_add_to_carts: product.addToCarts,
              item_purchases: product.compras,
              item_revenue: product.ingresos
            }
          });
        })
      );
      recordsProcessed += batch.length;
    }

    console.log(`✅ Updated ${recordsProcessed} product metrics for ${date}`);
    return recordsProcessed;
  } catch (error) {
    console.error(`❌ Error processing product metrics for ${date}:`, error);
    throw error;
  }
}

// ---------------------------------------
// Solo tocar métricas GA4 en analytics_summary
// ---------------------------------------

async function processAnalyticsSummary(date: string, ga4Data: any): Promise<number> {
  try {
    // 1. Extraer métricas GA4
    const ventaDiaria    = ga4Data.data?.ventaDiariaDelMes;
    const pedidosDiarios = ga4Data.data?.pedidosDiariosDelMes;
    const audiencia      = ga4Data.data?.audiencia;
    const tasaConversion = ga4Data.data?.tasaConversionWeb;

    const totalRevenueGA4   = ventaDiaria?.summary?.totalRevenue || 0;
    const totalPurchasesGA4 = pedidosDiarios?.summary?.totalPurchases || 0;
    const totalSessionsGA4  = audiencia?.summary?.totalUsers || 0;
    const conversionRateGA4 = tasaConversion?.summary?.tasaConversion || 0;

    // 2. Upsert: actualizar SOLO campos GA4 en analytics_summary
    await prisma.analytics_summary.upsert({
      where: { date: new Date(date) },
      update: {
        total_sessions_ga4: totalSessionsGA4,
        conversion_rate_ga4: conversionRateGA4,
        daily_session_value: totalSessionsGA4
          ? Number(totalRevenueGA4) / totalSessionsGA4
          : 0
        // NO tocar ningún campo VTEX/SAP ni ratios en el bloque update
      },
      create: {
        date: new Date(date),
        // Campos GA4 (solo en creación)
        total_sessions_ga4: totalSessionsGA4,
        conversion_rate_ga4: conversionRateGA4,
        daily_session_value: totalSessionsGA4
          ? Number(totalRevenueGA4) / totalSessionsGA4
          : 0
        // Los demás campos (VTEX/SAP, cross_platform_rate, etc.) 
        // usarán valores por defecto definidos en el esquema Prisma.
      }
    });

    console.log(`✅ Updated analytics_summary (GA4-only) for ${date}`);
    return 1;
  } catch (error) {
    console.error(`❌ Error processing analytics summary for ${date}:`, error);
    throw error;
  }
}

async function performSingleDateCollection(date: string): Promise<{
  kpiResults: KPIProcessingResult[];
  tablesUpdated: {
    ga4_daily_metrics: number;
    ga4_traffic_sources: number;
    ga4_search_terms: number;
    ga4_product_metrics: number;
    analytics_summary: number;
  };
  created: number;
  updated: number;
  errors: number;
}> {
  const ga4Data = await fetchGA4Data(date, date, GA4_COLLECTOR_CONFIG.requiredKPIs);
  const kpiResults: KPIProcessingResult[] = [];
  const tablesUpdated = {
    ga4_daily_metrics: 0,
    ga4_traffic_sources: 0,
    ga4_search_terms: 0,
    ga4_product_metrics: 0,
    analytics_summary: 0
  };
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  // 1) ga4_daily_metrics
  try {
    const records = await processGA4DailyMetrics(date, ga4Data);
    tablesUpdated.ga4_daily_metrics = records;
    totalUpdated += records;
    kpiResults.push({
      kpi: 'ga4_daily_metrics',
      status: 'success',
      recordsProcessed: records
    });
  } catch (error) {
    totalErrors++;
    kpiResults.push({
      kpi: 'ga4_daily_metrics',
      status: 'failed',
      recordsProcessed: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // 2) ga4_traffic_sources
  try {
    const records = await processGA4TrafficSources(date, ga4Data);
    tablesUpdated.ga4_traffic_sources = records;
    totalCreated += records;
    kpiResults.push({
      kpi: 'ga4_traffic_sources',
      status: 'success',
      recordsProcessed: records
    });
  } catch (error) {
    totalErrors++;
    kpiResults.push({
      kpi: 'ga4_traffic_sources',
      status: 'failed',
      recordsProcessed: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // 3) ga4_search_terms
  try {
    const records = await processGA4SearchTerms(date, ga4Data);
    tablesUpdated.ga4_search_terms = records;
    totalCreated += records;
    kpiResults.push({
      kpi: 'ga4_search_terms',
      status: 'success',
      recordsProcessed: records
    });
  } catch (error) {
    totalErrors++;
    kpiResults.push({
      kpi: 'ga4_search_terms',
      status: 'failed',
      recordsProcessed: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // 4) ga4_product_metrics
  try {
    const records = await processGA4ProductMetrics(date, ga4Data);
    tablesUpdated.ga4_product_metrics = records;
    totalCreated += records;
    kpiResults.push({
      kpi: 'ga4_product_metrics',
      status: 'success',
      recordsProcessed: records
    });
  } catch (error) {
    totalErrors++;
    kpiResults.push({
      kpi: 'ga4_product_metrics',
      status: 'failed',
      recordsProcessed: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // 5) analytics_summary (solo GA4)
  try {
    const records = await processAnalyticsSummary(date, ga4Data);
    tablesUpdated.analytics_summary = records;
    totalUpdated += records;
    kpiResults.push({
      kpi: 'analytics_summary',
      status: 'success',
      recordsProcessed: records
    });
  } catch (error) {
    totalErrors++;
    kpiResults.push({
      kpi: 'analytics_summary',
      status: 'failed',
      recordsProcessed: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return {
    kpiResults,
    tablesUpdated,
    created: totalCreated,
    updated: totalUpdated,
    errors: totalErrors
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GA4CollectorResponse>
) {
  const startTime = Date.now();

  if (!['GET', 'POST'].includes(req.method || '')) {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET or POST.',
      summary: {} as any,
      kpiResultsByDate: [],
      metadata: {} as any
    });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      summary: {} as any,
      kpiResultsByDate: [],
      metadata: {} as any
    });
  }

  try {
    // Parámetros de consulta: startDate & endDate (YYYY-MM-DD), o date singular
    const { startDate, endDate, date } = req.query as {
      startDate?: string;
      endDate?: string;
      date?: string;
    };

    let fechas: string[] = [];
    if (startDate && endDate) {
      const desde = new Date(startDate);
      const hasta = new Date(endDate);
      if (isNaN(desde.getTime()) || isNaN(hasta.getTime()) || desde > hasta) {
        throw new Error('startDate y endDate deben ser fechas válidas y startDate ≤ endDate');
      }
      fechas = listDatesBetween(desde, hasta);
    } else if (date) {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        throw new Error('date debe ser una fecha válida');
      }
      fechas = [date];
    } else {
      // Si no especifica nada, tomar “ayer”
      fechas = [generateDateRange(1).startDate];
    }

    console.log(`📊 GA4 Data Collector for dates: ${fechas.join(', ')}`);

    const kpiResultsByDate: Array<{
      date: string;
      kpiResults: KPIProcessingResult[];
    }> = [];

    const tablesTotals = {
      ga4_daily_metrics: 0,
      ga4_traffic_sources: 0,
      ga4_search_terms: 0,
      ga4_product_metrics: 0,
      analytics_summary: 0
    };
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    let totalKPIs = 0;

    for (const fecha of fechas) {
      try {
        const {
          kpiResults,
          tablesUpdated,
          created,
          updated,
          errors
        } = await performSingleDateCollection(fecha);

        // Acumular totales
        tablesTotals.ga4_daily_metrics += tablesUpdated.ga4_daily_metrics;
        tablesTotals.ga4_traffic_sources += tablesUpdated.ga4_traffic_sources;
        tablesTotals.ga4_search_terms += tablesUpdated.ga4_search_terms;
        tablesTotals.ga4_product_metrics += tablesUpdated.ga4_product_metrics;
        tablesTotals.analytics_summary += tablesUpdated.analytics_summary;

        totalCreated += created;
        totalUpdated += updated;
        totalErrors += errors;
        totalKPIs += kpiResults.length;

        kpiResultsByDate.push({ date: fecha, kpiResults });
      } catch (err) {
        console.error(`❌ Error processing date ${fecha}:`, err);
        totalErrors++;
        kpiResultsByDate.push({
          date: fecha,
          kpiResults: []
        });
      }
    }

    const totalProcessingTime = Date.now() - startTime;
    console.log(
      `✅ GA4 data collection for range completed in ${totalProcessingTime}ms`
    );

    const summary = {
      collectionDate: new Date().toISOString(),
      dateRange: {
        from: fechas[0],
        to: fechas[fechas.length - 1]
      },
      processing: {
        datesProcessed: fechas.length,
        kpisProcessed: totalKPIs,
        recordsCreated: totalCreated,
        recordsUpdated: totalUpdated,
        recordsSkipped: 0,
        errors: totalErrors
      },
      tablesUpdated: tablesTotals
    };

    const metadata = {
      totalProcessingTime,
      ga4ApiCalls: fechas.length, // una llamada GA4 por fecha
      databaseOperations: totalCreated + totalUpdated,
      nextCollectionRecommended: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString()
    };

    res.status(200).json({
      success: true,
      summary,
      kpiResultsByDate,
      metadata
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(
      `❌ GA4 Data Collector API Error after ${responseTime}ms:`,
      error
    );
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      summary: {
        collectionDate: new Date().toISOString(),
        dateRange: { from: '', to: '' },
        processing: {
          datesProcessed: 0,
          kpisProcessed: 0,
          recordsCreated: 0,
          recordsUpdated: 0,
          recordsSkipped: 0,
          errors: 1
        },
        tablesUpdated: {
          ga4_daily_metrics: 0,
          ga4_traffic_sources: 0,
          ga4_search_terms: 0,
          ga4_product_metrics: 0,
          analytics_summary: 0
        }
      },
      kpiResultsByDate: [],
      metadata: {
        totalProcessingTime: responseTime,
        ga4ApiCalls: 0,
        databaseOperations: 0,
        nextCollectionRecommended: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString()
      }
    });
  } finally {
    await prisma.$disconnect();
  }
}
