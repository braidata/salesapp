// pages/api/ga4-google-ads.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { BetaAnalyticsDataClient } from '@google-analytics/data'

interface GoogleAdsKPIConfig {
  dimensions: string[]
  metrics: string[]
  dateRangeOffset?: number
  calculate?: (rows: any[]) => any
}

// Configuración de KPIs GA4 Google Ads (solo combinaciones compatibles)
const GOOGLE_ADS_KPI_CONFIG: Record<string, GoogleAdsKPIConfig> = {
  // 1. Resumen de campañas (funciona sin error)
  googleAdsKPIs: {
    dimensions: ['sessionCampaignName'],
    metrics: ['advertiserAdImpressions', 'advertiserAdClicks', 'advertiserAdCost', 'conversions', 'purchaseRevenue'],
    calculate: rows => {
      const sum = (i: number) => rows.reduce((s, r) => s + Number(r.metricValues[i].value), 0)
      const impresiones = sum(0)
      const clics = sum(1)
      const costo = sum(2)
      const conversiones = sum(3)
      const ingresos = sum(4)
      const ctr = impresiones ? (clics / impresiones) * 100 : 0
      const cpc = clics ? costo / clics : 0
      const tasaConversion = clics ? (conversiones / clics) * 100 : 0
      const roas = costo ? ingresos / costo : 0
      // Conversiones y ROAS detallados por campaña
      const campañas = rows.map(r => ({
        nombre: r.dimensionValues[0].value,
        impresiones: +r.metricValues[0].value,
        clics: +r.metricValues[1].value,
        costo: +r.metricValues[2].value,
        conversiones: +r.metricValues[3].value,
        ingresos: +r.metricValues[4].value
      }))
      return { resumen: { impresiones, clics, costo, conversiones, ingresos, ctr, cpc, tasaConversion, roas }, campañas }
    }
  },

  // 2. Comparativo con periodo anterior (compatible)
  googleAdsComparativo: {
    dimensions: ['date'],
    metrics: ['advertiserAdImpressions', 'advertiserAdClicks', 'advertiserAdCost', 'conversions', 'purchaseRevenue'],
    dateRangeOffset: 30,
    calculate: rows => {
      const mitad = rows.length / 2
      const actual = rows.slice(0, mitad)
      const anterior = rows.slice(mitad)
      const sum = (arr: any[], i: number) => arr.reduce((s, r) => s + Number(r.metricValues[i].value), 0)
      const [iA, cA, costA, convA, revA] = [sum(actual, 0), sum(actual, 1), sum(actual, 2), sum(actual, 3), sum(actual, 4)]
      const [iP, cP, costP, convP, revP] = [sum(anterior, 0), sum(anterior, 1), sum(anterior, 2), sum(anterior, 3), sum(anterior, 4)]
      const pct = (n: number, o: number) => o ? ((n - o) / o) * 100 : 0
      return {
        impresiones: { actual: iA, anterior: iP, variacion: pct(iA, iP) },
        clics: { actual: cA, anterior: cP, variacion: pct(cA, cP) },
        costo: { actual: costA, anterior: costP, variacion: pct(costA, costP) },
        conversiones: { actual: convA, anterior: convP, variacion: pct(convA, convP) },
        ingresos: { actual: revA, anterior: revP, variacion: pct(revA, revP) }
      }
    }
  },

  // 3. Dispositivos: usar métrica SESSIONS en lugar de métricas Ads (solo compatible en GA4)
  googleAdsDispositivos: {
    dimensions: ['deviceCategory'],
    metrics: ['sessions'],
    calculate: rows => {
      const total = rows.reduce((sum, r) => sum + Number(r.metricValues[0].value), 0)
      const dispositivos = rows.map(r => ({
        dispositivo: r.dimensionValues[0].value,
        sesiones: +r.metricValues[0].value,
        porcentaje: total ? (+r.metricValues[0].value / total) * 100 : 0
      }))
      return { totalSesiones: total, dispositivos }
    }
  },

  // 4. Alternativa para geolocalización: usar SESSIONS por país/región
  googleAdsGeo: {
    dimensions: ['country', 'region'],
    metrics: ['sessions'],
    calculate: rows => {
      const paises: Record<string, any> = {}
      rows.forEach(r => {
        const pais = r.dimensionValues[0].value
        const region = r.dimensionValues[1].value
        const ses = +r.metricValues[0].value
        if (!paises[pais]) paises[pais] = { pais, total: 0, regiones: {} }
        paises[pais].total += ses
        paises[pais].regiones[region] = (paises[pais].regiones[region] || 0) + ses
      })
      return { paises: Object.values(paises).map(p => ({ ...p, regiones: Object.entries(p.regiones).map(([reg, s]) => ({ region: reg, sesiones: s })) })) }
    }
  },

  // 5. Horario: sesiones por hora/día
  googleAdsHorario: {
    dimensions: ['dayOfWeek', 'hour'],
    metrics: ['sessions'],
    calculate: rows => {
      const mat: Record<string, any> = {}
      rows.forEach(r => {
        const dia = r.dimensionValues[0].value
        const hora = r.dimensionValues[1].value
        const ses = +r.metricValues[0].value
        mat[dia] = mat[dia] || {}
        mat[dia][hora] = ses
      })
      return Object.entries(mat).map(([dia, horas]) => ({ dia, horas }))
    }
  }
}

// Ordenamiento simplificado
function getOrderByForAdsKPI(key: string) {
  switch (key) {
    case 'googleAdsKPIs': return [{ metric: { metricName: 'advertiserAdCost' }, desc: true }]
    case 'googleAdsComparativo': return [{ dimension: { dimensionName: 'date' }, desc: false }]
    case 'googleAdsDispositivos': return [{ metric: { metricName: 'sessions' }, desc: true }]
    case 'googleAdsGeo': return [{ metric: { metricName: 'sessions' }, desc: true }]
    case 'googleAdsHorario': return [{ metric: { metricName: 'sessions' }, desc: true }]
    default: return undefined
  }
}

function getEnhancedErrorMessageForAds(err: any, key: string) {
  const msg = err.message || ''
  if (msg.includes('INVALID_ARGUMENT')) return `Argumento inválido en ${key}.`  
  return `Error en ${key}: ${msg}`
}

async function safeFetchAdsData(
  client: BetaAnalyticsDataClient,
  property: string,
  key: string,
  cfg: GoogleAdsKPIConfig,
  startDate: string,
  endDate: string
) {
  try {
    const dateRanges: any[] = [{ startDate, endDate }]
    if (cfg.dateRangeOffset) dateRanges.push({ startDate: `${cfg.dateRangeOffset}daysAgo`, endDate: `${cfg.dateRangeOffset}daysAgo` })
    const [resp] = await client.runReport({
      property,
      dateRanges,
      dimensions: cfg.dimensions.map(d => ({ name: d })),
      metrics: cfg.metrics.map(m => ({ name: m })),
      dimensionFilter: { andGroup: { expressions: [{ filter: { fieldName: 'sessionMedium', stringFilter: { value: 'cpc', matchType: 'EXACT' } } }] } },
      orderBys: getOrderByForAdsKPI(key)
    })
    const rows = resp.rows || []
    const result: any = { dimensionHeaders: resp.dimensionHeaders, metricHeaders: resp.metricHeaders, rows }
    if (cfg.calculate) result.calculo = cfg.calculate(rows)
    return result
  } catch (err: any) {
    return { error: getEnhancedErrorMessageForAds(err, key) }
  }
}

async function fetchAdsKPIs(
  client: BetaAnalyticsDataClient,
  property: string,
  startDate: string,
  endDate: string,
  enabled: string[]
) {
  const results: Record<string, any> = {}
  for (const key of enabled) {
    if (!GOOGLE_ADS_KPI_CONFIG[key]) continue
    results[key] = await safeFetchAdsData(client, property, key, GOOGLE_ADS_KPI_CONFIG[key], startDate, endDate)
  }
  return results
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { startDate = '30daysAgo', endDate = 'today', kpis } = req.query
  const enabled = typeof kpis === 'string' ? kpis.split(',').filter(k => GOOGLE_ADS_KPI_CONFIG[k]) : Object.keys(GOOGLE_ADS_KPI_CONFIG)

  try {
    const client = new BetaAnalyticsDataClient({ credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}') })
    const property = `properties/${process.env.GA4_PROPERTY_ID_VENTUS}`
    const data = await fetchAdsKPIs(client, property, startDate as string, endDate as string, enabled)
    res.status(200).json({ success: true, metadata: { periodo: { startDate, endDate }, kpisHabilitados: enabled.length, kpisExitosos: Object.values(data).filter(r => !r.error).length, fuente: 'GA4 (Google Ads vinculado)' }, data })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}