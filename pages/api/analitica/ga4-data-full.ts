// pages/api/ga4-google-ads.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { BetaAnalyticsDataClient } from '@google-analytics/data'

interface GoogleAdsKPIConfig {
  dimensions: string[]
  metrics: string[]
  dateRangeOffset?: number
  calculate?: (rows: any[]) => any
  filters?: Array<{ dimension?: string; metric?: string; value: string; operator: string }>
}

// Configuración de cada KPI con dimensiones y métricas corregidas:
const GOOGLE_ADS_KPI_CONFIG: Record<string, GoogleAdsKPIConfig> = {
  // 1. Resumen por campaña
  googleAdsKPIs: {
    dimensions: ['sessionCampaignName', 'sessionSourceMedium'],
    metrics: [
      'advertiserAdImpressions',
      'advertiserAdClicks',
      'advertiserAdCost',
      'conversions',
      'purchaseRevenue'
    ],
    calculate: rows => {
      const sum = (i: number) => rows.reduce((s, r) => s + Number(r.metricValues[i].value), 0)
      const totalImpr = sum(0), totalClicks = sum(1), totalCost = sum(2), totalConv = sum(3), totalRev = sum(4)
      const ctr = totalImpr ? (totalClicks/totalImpr)*100 : 0
      const cpc = totalClicks ? totalCost/totalClicks : 0
      const convRate = totalClicks ? (totalConv/totalClicks)*100 : 0
      const costPerConv = totalConv ? totalCost/totalConv : 0
      const roas = totalCost ? totalRev/totalCost : 0

      const campaigns: Record<string, any> = {}
      rows.forEach(r => {
        const camp = r.dimensionValues[0].value
        const imp = +r.metricValues[0].value, clk = +r.metricValues[1].value
        const cto = +r.metricValues[2].value, conv = +r.metricValues[3].value
        const rev = +r.metricValues[4].value

        if (!campaigns[camp]) {
          campaigns[camp] = { nombre: camp, impresiones:0, clics:0, costo:0, conversiones:0, ingresos:0 }
        }
        campaigns[camp].impresiones += imp
        campaigns[camp].clics += clk
        campaigns[camp].costo += cto
        campaigns[camp].conversiones += conv
        campaigns[camp].ingresos += rev
      })

      return {
        resumen: { impresiones: totalImpr, clics: totalClicks, costo: totalCost, conversiones: totalConv, ingresos: totalRev, ctr, cpc, convRate, costPerConv, roas },
        campañas: Object.values(campaigns).sort((a,b)=> b.costo - a.costo)
      }
    }
  },

  // 2. Comparativo con período anterior
  googleAdsComparativo: {
    dimensions: ['date'],
    metrics: [
      'advertiserAdImpressions',
      'advertiserAdClicks',
      'advertiserAdCost',
      'conversions',
      'purchaseRevenue'
    ],
    dateRangeOffset: 30,
    calculate: rows => {
      const half = rows.length/2
      const curr = rows.slice(0, half), prev = rows.slice(half)
      const sum = (arr: any[], i: number) => arr.reduce((s,r)=> s + Number(r.metricValues[i].value),0)

      const [ci, cc, ct, cv, cr] = [sum(curr,0), sum(curr,1), sum(curr,2), sum(curr,3), sum(curr,4)]
      const [pi, pc, pt, pv, pr] = [sum(prev,0), sum(prev,1), sum(prev,2), sum(prev,3), sum(prev,4)]

      const pct = (a:number,b:number)=> b ? ((a-b)/b)*100 : 0

      return {
        impresiones: { actual:ci, anterior:pi, variacion:pct(ci,pi) },
        clics:        { actual:cc, anterior:pc, variacion:pct(cc,pc) },
        costo:        { actual:ct, anterior:pt, variacion:pct(ct,pt) },
        conversiones: { actual:cv, anterior:pv, variacion:pct(cv,pv) },
        ingresos:     { actual:cr, anterior:pr, variacion:pct(cr,pr) },
        tendenciasDiarias: {
          actual: curr.map(r=>({ fecha:r.dimensionValues[0].value, valor:+r.metricValues[0].value })),
          anterior: prev.map(r=>({ fecha:r.dimensionValues[0].value, valor:+r.metricValues[0].value }))
        }
      }
    }
  },

  // 3. Rendimiento por dispositivo
  googleAdsDispositivos: {
    dimensions: ['deviceCategory', 'sessionSourceMedium'],
    metrics: [
      'advertiserAdImpressions',
      'advertiserAdClicks',
      'advertiserAdCost',
      'conversions',
      'purchaseRevenue'
    ],
    calculate: rows => {
      const totalSes = rows.reduce((s,r)=> s + Number(r.metricValues[0].value),0)
      const data = rows.map(r=> {
        const disp = r.dimensionValues[0].value
        const ses = +r.metricValues[0].value, clk=+r.metricValues[1].value
        const cto = +r.metricValues[2].value, conv=+r.metricValues[3].value
        const rev = +r.metricValues[4].value
        return {
          dispositivo:disp,
          sesiones: ses, clics: clk, costo: cto, conversiones:conv, ingresos:rev,
          ctr: ses? (clk/ses)*100:0,
          cpc: clk? cto/clk:0,
          tasaConversion: ses? (conv/ses)*100:0,
          roas: cto? rev/cto:0
        }
      })
      const byRoas = [...data].sort((a,b)=> b.roas - a.roas)
      return {
        resumen: data.reduce((acc,v)=>({
          sesiones:acc.sesiones+v.sesiones,
          clics:acc.clics+v.clics,
          costo:acc.costo+v.costo,
          conversiones:acc.conversiones+v.conversiones,
          ingresos:acc.ingresos+v.ingresos
        }),{sesiones:0,clics:0,costo:0,conversiones:0,ingresos:0}),
        dispositivos: data,
        mejorDispositivo: byRoas[0]?.dispositivo,
        peorDispositivo: byRoas[byRoas.length-1]?.dispositivo
      }
    }
  },

  // 4. Palabras clave aproximadas
  googleAdsPalabrasClave: {
    dimensions: ['landingPage', 'sessionCampaignName'],
    metrics: ['advertiserAdClicks','advertiserAdCost','conversions','purchaseRevenue'],
    calculate: rows => {
      const kw: Record<string, any> = {}
      rows.forEach(r=>{
        let url = r.dimensionValues[0].value
        let camp = r.dimensionValues[1].value
        let clicks=+r.metricValues[0].value, cost=+r.metricValues[1].value
        let conv=+r.metricValues[2].value, rev=+r.metricValues[3].value
        let keys: string[]=[]
        try{
          const u=new URL(url)
          const t=u.searchParams.get('utm_term')||u.searchParams.get('utm_content')||u.searchParams.get('utm_campaign')
          keys = t? t.split(/[\s,+]+/): []
        }catch{ keys = camp.split(/[\s,+_\-]+/).filter(w=>w.length>3) }
        if (!keys.length) keys=[camp]
        keys.forEach(k=>{
          const k1=k.toLowerCase().trim()
          if (!kw[k1]) kw[k1]={ palabra:k1, clics:0,costo:0,conv:0,rev:0, camps: new Set() }
          kw[k1].clics += clicks; kw[k1].costo+=cost; kw[k1].conv+=conv; kw[k1].rev+=rev
          kw[k1].camps.add(camp)
        })
      })
      return {
        resumen: {
          totalKeywords: Object.keys(kw).length,
          clicsTotales: Object.values(kw).reduce((s:any,v:any)=>s+v.clics,0)
        },
        palabras: Object.values(kw).map((v:any)=>({
          palabra:v.palabra,
          clics:v.clics,
          costo:v.costo,
          conversiones:v.conv,
          ingresos:v.rev,
          campañas:Array.from(v.camps),
          roas: v.costo? v.rev/v.costo:0
        })).sort((a,b)=>b.clics - a.clics)
      }
    }
  },

  // 5. Geo
  googleAdsGeo: {
    dimensions: ['country','region','sessionSourceMedium'],
    metrics: ['advertiserAdClicks','advertiserAdCost','conversions','purchaseRevenue'],
    calculate: rows => {
      const geo: Record<string, any> = {}
      rows.forEach(r=>{
        const country = r.dimensionValues[0].value
        const region  = r.dimensionValues[1].value
        const clk=+r.metricValues[0].value, cost=+r.metricValues[1].value
        const conv=+r.metricValues[2].value, rev=+r.metricValues[3].value
        if (!geo[country]) geo[country] = { país:country, clics:0,costo:0,conversiones:0,ingresos:0, regiones:{} }
        geo[country].clics+=clk; geo[country].costo+=cost; geo[country].conversiones+=conv; geo[country].ingresos+=rev
        if (!geo[country].regiones[region]) geo[country].regiones[region]={ región:region,clics:0,costo:0,conversiones:0,ingresos:0}
        geo[country].regiones[region].clics+=clk
        geo[country].regiones[region].costo+=cost
        geo[country].regiones[region].conversiones+=conv
        geo[country].regiones[region].ingresos+=rev
      })
      return { 
        países: Object.values(geo).map((c:any)=>({
          país:c.país,
          clics:c.clics,
          costo:c.costo,
          conversiones:c.conversiones,
          ingresos:c.ingresos,
          regiones: Object.values(c.regiones)
        }))
      }
    }
  },

  // 6. Horario
  googleAdsHorario: {
    dimensions: ['hour','dayOfWeek','sessionSourceMedium'],
    metrics: ['advertiserAdClicks','advertiserAdCost','conversions','purchaseRevenue'],
    calculate: rows => {
      const week = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
      const data = week.map(_=>Array(24).fill(0).map(_=>({clics:0,costo:0,conv:0,rev:0})))
      rows.forEach(r=>{
        const h = +r.dimensionValues[0].value
        const d = +r.dimensionValues[1].value -1
        if (d>=0&&d<7) {
          data[d][h].clics += +r.metricValues[0].value
          data[d][h].costo += +r.metricValues[1].value
          data[d][h].conv += +r.metricValues[2].value
          data[d][h].rev += +r.metricValues[3].value
        }
      })
      return week.map((dia, i)=>({
        día: dia,
        horas: data[i].map((h,j)=>({
          hora: j,
          clics: h.clics,
          costo: h.costo,
          conversiones: h.conv,
          ingresos: h.rev,
          roas: h.costo? h.rev/h.costo:0
        }))
      }))
    }
  },

  // 7. Audiencias
  googleAdsAudiencias: {
    dimensions: ['audienceId','audienceName','sessionSourceMedium'],
    metrics: ['advertiserAdClicks','advertiserAdCost','conversions','purchaseRevenue'],
    calculate: rows => rows.map(r=>({
      id: r.dimensionValues[0].value,
      nombre: r.dimensionValues[1].value,
      clics: +r.metricValues[0].value,
      costo: +r.metricValues[1].value,
      conversiones: +r.metricValues[2].value,
      ingresos: +r.metricValues[3].value,
      roas: +r.metricValues[1].value ? (+r.metricValues[3].value / +r.metricValues[1].value) : 0
    }))
  }
}

// ============================================
// UTILIDADES
// ============================================
function getOrderByForAdsKPI(key: string) {
  switch(key) {
    case 'googleAdsKPIs':
      return [{ metric: { metricName: 'advertiserAdCost' }, desc: true }]
    case 'googleAdsComparativo':
      return [{ dimension: { dimensionName: 'date' }, desc: false }]
    case 'googleAdsDispositivos':
      return [{ metric: { metricName: 'advertiserAdClicks' }, desc: true }]
    case 'googleAdsPalabrasClave':
      return [{ metric: { metricName: 'advertiserAdClicks' }, desc: true }]
    default:
      return undefined
  }
}

function getEnhancedErrorMessageForAds(err: any, key: string) {
  const msg = err.message || ''
  if (msg.includes('INVALID_ARGUMENT'))
    return `Argumento inválido en ${key}. Revise dimensiones/métricas.`
  if (msg.includes('PERMISSION_DENIED'))
    return `Permiso denegado en ${key}. Verifique vinculación GA4–Ads.`
  if (msg.includes('RESOURCE_EXHAUSTED'))
    return `Cuota excedida en ${key}. Reduzca frecuencia de consultas.`
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
    // rangos de fecha
    const dateRanges: any[] = [{ startDate, endDate }]
    if (cfg.dateRangeOffset) {
      const off = cfg.dateRangeOffset
      dateRanges.push({
        startDate: `${off}daysAgo`,
        endDate: `${off}daysAgo`
      })
    }

    // forzar medium=cpc
    const dimensionFilter = {
      andGroup: {
        expressions: [{
          filter: {
            fieldName: 'sessionMedium',
            stringFilter: { value: 'cpc', matchType: 'EXACT' }
          }
        }]
      }
    }

    const [resp] = await client.runReport({
      property,
      dateRanges,
      dimensions: cfg.dimensions.map(d => ({ name: d })),
      metrics: cfg.metrics.map(m => ({ name: m })),
      dimensionFilter,
      orderBys: getOrderByForAdsKPI(key),
      limit: key==='googleAdsPalabrasClave' ? 100 : undefined
    })

    const rows = resp.rows || []
    const result: any = {
      dimensionHeaders: resp.dimensionHeaders,
      metricHeaders: resp.metricHeaders,
      rows
    }
    if (cfg.calculate) result.calculo = cfg.calculate(rows)
    return result
  } catch(err: any) {
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
    results[key] = await safeFetchAdsData(
      client, property, key,
      GOOGLE_ADS_KPI_CONFIG[key],
      startDate, endDate
    )
  }
  return results
}

// ============================================
// HANDLER principal
// ============================================
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { startDate='30daysAgo', endDate='today', kpis } = req.query
  const enabledKpis = typeof kpis==='string'
    ? kpis.split(',').filter(k=>GOOGLE_ADS_KPI_CONFIG[k])
    : Object.keys(GOOGLE_ADS_KPI_CONFIG)

  try {
    const client = new BetaAnalyticsDataClient({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY||'{}')
    })
    const property = `properties/${process.env.GA4_PROPERTY_ID_VENTUS}`

    const data = await fetchAdsKPIs(
      client,
      property,
      startDate as string,
      endDate as string,
      enabledKpis
    )

    return res.status(200).json({
      success: true,
      metadata: {
        periodo: { startDate, endDate },
        kpisHabilitados: enabledKpis.length,
        kpisExitosos: Object.values(data).filter((r:any)=>!r.error).length,
        fuente: 'GA4 (Google Ads vinculado)'
      },
      data
    })
  } catch(err: any) {
    return res.status(500).json({ success: false, error: err.message })
  }
}
