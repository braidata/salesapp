// components/Dashboard/ui/AnalyticsDashboardUI.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import AdsAnalyticsDashboard from '../AdsAPIAnalytics'
import LoadingState from './LoadingState'
import {
  RefreshCw, Maximize2, Minimize2, Info,
  Table2, BarChart3, Copy as CopyIcon, FileText, FileIcon as FilePdf,
  ChevronDown, X
} from 'lucide-react'
import { colors } from '../constants/colors'
import {
  chartTypeOptions, sortTypeOptions,
  dateRangeOptions, kpiCategoryOptions, kpiOptions
} from '../constants/options'
import {
  renderChart, renderDataTable, exportToXLSX, exportToPDF, copyChartAsImage
} from './chartComponents'
import { getKpiDescription } from '../utils/dataProcessing'
import DataTable from './DataTable'

// Types
import type { ChartType, SortOption, ViewMode, CustomDateRange } from '../types'

export default function AnalyticsDashboardUI() {
  // KPI y categorías
  const [activeKpi, setActiveKpi] = useState<string>('ventaDiariaDelMes')
  const [kpiCategories, setKpiCategories] = useState<string>('all')

  // Datos
  const { data, loading, error, summary, dateRange, setDateRange, refresh } = useAnalyticsData(activeKpi)

  // UI states
  const [chartTypes, setChartTypes] = useState<Record<string, ChartType>>({})
  const [sortOptions, setSortOptions] = useState<Record<string, SortOption>>({})
  const [viewModes, setViewModes] = useState<Record<string, ViewMode>>({})
  const [fullscreen, setFullscreen] = useState<string | null>(null)
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null)
  const [showInfo, setShowInfo] = useState<Record<string, boolean>>({})
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({ startDate: dateRange.startDate, endDate: dateRange.endDate })

  // Refs para radar
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Helpers
  const getChartType = (kpiKey: string): ChartType => {
    if (!chartTypes[kpiKey]) {
      const defaultType = chartTypeOptions[0].id as ChartType
      setChartTypes(prev => ({ ...prev, [kpiKey]: defaultType }))
      return defaultType
    }
    return chartTypes[kpiKey]
  }
  const getSortOption = (kpiKey: string): SortOption => {
    if (!sortOptions[kpiKey]) {
      const defaultSort: SortOption = ['ventaDiariaDelMes','pedidosDiariosDelMes','ticketPromedioDelMes','carrosAbandonados'].includes(kpiKey) ? 'date' : 'value'
      setSortOptions(prev => ({ ...prev, [kpiKey]: defaultSort }))
      return defaultSort
    }
    return sortOptions[kpiKey]
  }
  const getViewMode = (kpiKey: string): ViewMode => {
    if (!viewModes[kpiKey]) {
      const defaultMode: ViewMode = ['tasaConversionWeb','funnelConversiones','kpisDeProductos'].includes(kpiKey) ? 'table' : 'chart'
      setViewModes(prev => ({ ...prev, [kpiKey]: defaultMode }))
      return defaultMode
    }
    return viewModes[kpiKey]
  }
  const toggleInfo = (kpiKey: string) => setShowInfo(prev => ({ ...prev, [kpiKey]: !prev[kpiKey] }))
  const handleCustomDateSubmit = () => { setDateRange(customDateRange); setShowCustomDatePicker(false) }

  // Radar animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const resize = () => {
      const p = canvas.parentElement
      if (p) { canvas.width = p.offsetWidth; canvas.height = p.offsetHeight }
    }
    resize(); window.addEventListener('resize', resize)
    let angle = 0
    const draw = () => {
      const w = canvas.width, h = canvas.height
      const cx = w/2, cy = h/2, r = Math.min(cx,cy)*0.9
      ctx.clearRect(0,0,w,h)
      ctx.strokeStyle = colors.grid
      for (let i=1;i<=4;i++) { ctx.beginPath(); ctx.arc(cx,cy,r*(i/4),0,2*Math.PI); ctx.stroke() }
      ctx.beginPath(); ctx.moveTo(cx-r,cy); ctx.lineTo(cx+r,cy); ctx.moveTo(cx,cy-r); ctx.lineTo(cx,cy+r); ctx.stroke()
      ctx.fillStyle = 'rgba(74,227,181,0.3)'; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,angle-0.1,angle); ctx.fill()
      ctx.strokeStyle = colors.accent; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(angle)*r, cy+Math.sin(angle)*r); ctx.stroke()
      angle = (angle + 0.01) % (2 * Math.PI)
      requestAnimationFrame(draw)
    }
    draw()
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Renderiza gráfico o tabla
  const renderMainContent = () => {
    const raw = data?.data?.[activeKpi] ?? []
    const chartType = getChartType(activeKpi)
    const viewMode = getViewMode(activeKpi)
    if (viewMode === 'chart') {
      return renderChart(activeKpi, chartType, raw, activeTooltipIndex, setActiveTooltipIndex)
    }
    return <DataTable data={raw} columns={[]} kpiKey={activeKpi} />
  }

  return (
    <div className="w-full h-full flex flex-col" style={{ background: `linear-gradient(135deg, ${colors.secondary}, ${colors.background})`, color: colors.text }}>
      {/* Header */}
      <header className="p-4 border-b" style={{ borderColor: colors.accent }}>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center"><span className="text-3xl mr-2" style={{color:colors.accent}}>⬢</span>ECOMMERCE ANALYTICS DASHBOARD</h1>
          <div className="flex gap-2">
            {dateRangeOptions.map(opt => (
              <button key={opt.id} onClick={() => opt.id==='custom'?setShowCustomDatePicker(true):setDateRange({startDate:opt.id,endDate:opt.endDate})}
                className={`px-3 py-1 rounded ${dateRange.startDate===opt.id?'bg-accent text-secondary':'bg-glass text-text'}`}>{opt.label}</button>
            ))}
          </div>
        </div>
        <p className="mt-1 text-sm opacity-70">{dateRange.startDate} — {dateRange.endDate}</p>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar */}
        <aside className={`${fullscreen?'hidden':'lg:col-span-1'} flex flex-col gap-4`}>
          <div className="p-4 rounded-lg backdrop-blur-md border" style={{backgroundColor:colors.glass,borderColor:colors.accent}}>
            <h2 className="font-semibold mb-3">Métricas</h2>
            <div className="flex gap-2 mb-4 flex-wrap">
              {kpiCategoryOptions.map(cat => (
                <button key={cat.id} onClick={()=>setKpiCategories(cat.id)} className={`px-2 py-1 text-xs rounded ${kpiCategories===cat.id?'bg-accent text-secondary':'bg-glass text-text'}`}>{cat.label}</button>
              ))}
            </div>
            <div className="overflow-auto max-h-[calc(100vh-300px)] flex flex-col gap-2">
              {kpiOptions.filter(o=>kpiCategories==='all'||o.category===kpiCategories).map(opt=>(
                <button key={opt.id} onClick={()=>setActiveKpi(opt.id)} className={`p-2 rounded text-left ${activeKpi===opt.id?'bg-accent text-secondary':'bg-glass text-text'}`}>{opt.label}</button>
              ))}
            </div>
            <div className="mt-6 relative h-48 rounded-full border" style={{borderColor:colors.accent}}>
              <canvas ref={canvasRef} className="w-full h-full" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-text opacity-70">
                <span>SISTEMA ACTIVO</span>
                <span style={{color:colors.accent}}>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Área de gráfico */}
        <section className={`${fullscreen?'col-span-full':'lg:col-span-3'} flex flex-col gap-4`}>
          {/* Resumen */}
          {!fullscreen && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg backdrop-blur-md border" style={{backgroundColor:colors.glass,borderColor:summary?.status==='error'?colors.danger:summary?.status==='warning'?colors.warning:colors.accent}}>
                <p className="text-sm opacity-70">{summary?.title}</p>
                <h3 className="text-3xl font-bold mt-1" style={{color:summary?.status==='error'?colors.danger:summary?.status==='warning'?colors.warning:colors.accent}}>{summary?.value}</h3>
                <p className="text-sm opacity-70 mt-1">{summary?.subValue}</p>
              </div>
              <div className="p-4 rounded-lg backdrop-blur-md border" style={{backgroundColor:colors.glass,borderColor:error?colors.danger:colors.accent}}>
                <p className="text-sm opacity-70">Estado del Sistema</p>
                <h3 className="text-3xl font-bold mt-1" style={{color:error?colors.danger:loading?colors.warning:colors.accent}}>{loading?'Cargando...':error?'Error':'Operativo'}</h3>
                <p className="text-sm opacity-70 mt-1">{loading?'Obteniendo datos...':error||`${data?.metadata?.kpisExitosos||0} KPIs activos`}</p>
              </div>
              <div className="p-4 rounded-lg backdrop-blur-md border" style={{backgroundColor:colors.glass,borderColor:colors.accent}}>
                <p className="text-sm opacity-70">Período de Análisis</p>
                <h3 className="text-3xl font-bold mt-1" style={{color:colors.accent}}>{dateRange.startDate}</h3>
                <p className="text-sm opacity-70 mt-1">{dateRange.startDate!==dateRange.endDate?`${dateRange.startDate} a ${dateRange.endDate}`:`Hasta ${new Date().toLocaleDateString()}`}</p>
              </div>
            </div>
          )}

          {/* Gráfico y controles */}
          <div className="p-4 rounded-lg backdrop-blur-md border flex flex-col" style={{backgroundColor:colors.glass,borderColor:colors.accent}}>
            <div className="mb-4 flex items-center gap-2 flex-wrap" style={{backgroundColor:`${colors.secondary}20`}}>
              <span className="text-xs font-semibold mr-2">Controles:</span>
              {/* Vista */}
              <button onClick={()=>setViewModes(prev=>({...prev,[activeKpi]:getViewMode(activeKpi)==='chart'?'table':'chart'}))} className="p-1.5 rounded" style={{backgroundColor:getViewMode(activeKpi)==='table'?colors.accent:colors.glass}} title="Toggle view">{getViewMode(activeKpi)==='chart'?<Table2 size={16}/>:<BarChart3 size={16}/>}</button>
              {/* Tipo de gráfico */}
              {getViewMode(activeKpi)==='chart'&&chartTypeOptions.map(opt=>(
                <button key={opt.id} onClick={()=>setChartTypes(prev=>({...prev,[activeKpi]:opt.id as ChartType}))} className="p-1.5 rounded" style={{backgroundColor:getChartType(activeKpi)===opt.id?colors.accent:colors.glass}} title={opt.label}>{opt.icon}</button>
              ))}
              {/* Exportar datos */}
              <button onClick={()=>exportToXLSX(data?.data?.[activeKpi]||[],activeKpi)} className="px-2 py-1 text-xs rounded" style={{border:`1px solid ${colors.accent}`,backgroundColor:colors.glass}}><FileText size={12}/> XLSX</button>
              {/* Exportar gráfico */}
              {getViewMode(activeKpi)==='chart'&&(
                <>
                  <button onClick={()=>exportToPDF(activeKpi,kpiOptions.find(o=>o.id===activeKpi)?.label||activeKpi)} className="px-2 py-1 text-xs rounded" style={{border:`1px solid ${colors.accent}`,backgroundColor:colors.glass}}><FilePdf size={12}/> PDF</button>
                  <button onClick={()=>copyChartAsImage(activeKpi)} className="px-2 py-1 text-xs rounded" style={{border:`1px solid ${colors.accent}`,backgroundColor:colors.glass}}><CopyIcon size={12}/> Copiar</button>
                </>
              )}
              {/* Info */}
              <button onClick={()=>toggleInfo(activeKpi)} className="px-2 py-1 text-xs rounded" style={{backgroundColor:showInfo[activeKpi]?colors.accent:colors.glass,border:`1px solid ${colors.accent}`}} title="Info"><Info size={12}/></button>
              {/* Refrescar */}
              <button onClick={refresh} className="px-2 py-1 text-xs rounded" style={{border:`1px solid ${colors.accent}`,backgroundColor:colors.glass}} title="Refresh"><RefreshCw size={12}/></button>
              {/* Ordenar */}
              <div className="flex items-center ml-auto"><span className="text-xs mr-2">Ordenar:</span>{sortTypeOptions.map(opt=>(
                <button key={opt.id} onClick={()=>setSortOptions(prev=>({...prev,[activeKpi]:opt.id as SortOption}))} className="p-1.5 rounded" style={{backgroundColor:getSortOption(activeKpi)===opt.id?colors.accent:colors.glass,border:`1px solid ${colors.accent}`}} title={opt.label}>{opt.icon}</button>
              ))}</div>
              {/* Pantalla completa */}
              <button onClick={()=>setFullscreen(fullscreen===activeKpi?null:activeKpi)} className="p-1.5 rounded" style={{border:`1px solid ${colors.accent}`,backgroundColor:colors.glass}} title="Fullscreen">{fullscreen===activeKpi?<Minimize2 size={16}/>:<Maximize2 size={16}/>}</button>
            </div>
            {/* Panel de info */}
            {showInfo[activeKpi]&&(<div className="mb-4 p-3 rounded" style={{backgroundColor:colors.glass,border:`1px solid ${colors.accent}`}}><h3 style={{color:colors.accent}}>Acerca de este KPI</h3><p style={{color:colors.text}}>{getKpiDescription(activeKpi)}</p></div>)}
            {/* Contenido */}
            <div className="flex-1 min-h-[300px]">{renderMainContent()}</div>
          </div>
        </section>
      </main>

      {/* Modal rango personalizado */}
      {showCustomDatePicker&&(
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-4 rounded-lg" style={{backgroundColor:colors.secondary,border:`1px solid ${colors.accent}`}}>
            <div className="flex justify-between mb-4"><h3 style={{color:colors.text}}>Seleccionar fechas</h3><X onClick={()=>setShowCustomDatePicker(false)} className="cursor-pointer"/></div>
            <label style={{color:colors.text}}>Inicio</label>
            <input type="date" value={customDateRange.startDate} onChange={e=>setCustomDateRange(prev=>({...prev,startDate:e.target.value}))} className="w-full p-2 rounded mb-4" style={{backgroundColor:colors.glass,color:colors.text,border:`1px solid ${colors.accent}`}}/>
            <label style={{color:colors.text}}>Fin</label>
            <input type="date" value={customDateRange.endDate} onChange={e=>setCustomDateRange(prev=>({...prev,endDate:e.target.value}))} className="w-full p-2 rounded mb-4" style={{backgroundColor:colors.glass,color:colors.text,border:`1px solid ${colors.accent}`}}/>
            <div className="flex justify-end gap-2"><button onClick={()=>setShowCustomDatePicker(false)} className="px-4 py-2 rounded bg-glass">Cancelar</button><button onClick={handleCustomDateSubmit} className="px-4 py-2 rounded bg-accent text-secondary">Aplicar</button></div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="p-4 border-t text-sm opacity-70" style={{borderColor:colors.accent}}>
        <div className="flex justify-between"><span>ECOMMERCE ANALYTICS SYSTEM v2.0</span><span>CONFIDENCIAL</span></div>
      </footer>
    </div>
  )
}
