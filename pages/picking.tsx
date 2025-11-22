import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { CheckCircle, Image as ImageIcon, Loader2, PackageCheck, Search, Upload } from 'lucide-react'

import { format } from 'date-fns'

const statusBadges: Record<string, string> = {
  PENDING: 'bg-slate-500/20 text-slate-200 border-slate-500/40',
  IN_PROGRESS: 'bg-sky-500/20 text-sky-100 border-sky-500/40',
  PICKED: 'bg-amber-500/20 text-amber-100 border-amber-500/40',
  PACKED: 'bg-emerald-500/20 text-emerald-100 border-emerald-500/40',
  COMPLETED: 'bg-teal-600/30 text-teal-100 border-teal-500/60',
}

type SapLine = {
  uiId: number
  sapLineId?: string
  sku: string
  description?: string | null
  quantity?: number | null
}

type PickingPhoto = {
  id: number
  photo_type: 'PICK' | 'PACK'
  s3_url: string
  uploaded_at: string
  uploaded_by_user_id: number | null
}

type PickingLine = {
  id: number
  sapLineId?: string | null
  sku: string
  description?: string | null
  quantity?: number | null
  status: string
  photos: PickingPhoto[]
}

type Picking = {
  id: number
  status: string
  createdAt?: string
  sap_order_id?: string
  updated_at?: string
  created_by?: { name?: string | null }
  createdBy?: { id: number; name: string | null; email: string | null } | null
  lines: PickingLine[]
}

export default function PickingDashboard() {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const [picking, setPicking] = useState<Picking | null>(null)
  const [dashboardPickings, setDashboardPickings] = useState<Picking[]>([])
  const [filters, setFilters] = useState({ status: '', sapOrder: '' })
  const [feedback, setFeedback] = useState<string | null>(null)

  const fetchSearch = async () => {
    if (!search.trim()) return
    setLoading(true)
    setFeedback(null)
    try {
      const resp = await fetch(`/api/picking/search?sapOrder=${encodeURIComponent(search.trim())}`)
      if (!resp.ok) throw new Error(await resp.text())
      const data = await resp.json()
      setOrderData({ ...data.order, lines: data.lines })
      setPicking(data.picking)
    } catch (error: any) {
      setOrderData(null)
      setPicking(null)
      setFeedback(error?.message || 'No se pudo buscar el pedido')
    } finally {
      setLoading(false)
    }
  }

  const createPicking = async () => {
    if (!orderData?.sapOrder) return
    setLoading(true)
    setFeedback(null)
    try {
      const resp = await fetch('/api/picking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sapOrder: orderData.sapOrder }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.message || 'No se pudo crear')
      setPicking(data.picking)
      setFeedback('Picking creado y listo para registrar fotos')
      refreshDashboard()
    } catch (error: any) {
      setFeedback(error?.message || 'No se pudo crear el picking')
    } finally {
      setLoading(false)
    }
  }

  const refreshDashboard = async () => {
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.sapOrder) params.append('sapOrder', filters.sapOrder)

    const resp = await fetch(`/api/picking${params.toString() ? `?${params.toString()}` : ''}`)
    if (resp.ok) {
      const data = await resp.json()
      setDashboardPickings(data.pickings)
    }
  }

  useEffect(() => {
    refreshDashboard()
  }, [filters])

  const handleUpload = async (lineId: number, type: 'PICK' | 'PACK', file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('pickingLineId', lineId.toString())
    formData.append('photoType', type)

    setLoading(true)
    setFeedback(null)
    try {
      const resp = await fetch('/api/picking/photo', { method: 'POST', body: formData })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.message || 'Error subiendo foto')
      setFeedback(`Foto ${type === 'PICK' ? 'de picking' : 'de embalaje'} guardada`)
      await fetchSearch()
      await refreshDashboard()
    } catch (error: any) {
      setFeedback(error?.message || 'No se pudo subir la foto')
    } finally {
      setLoading(false)
    }
  }

  const markCompleted = async () => {
    if (!picking?.id) return
    setLoading(true)
    setFeedback(null)
    try {
      const resp = await fetch('/api/picking/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickingId: picking.id, status: 'COMPLETED' }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.message || 'No se pudo completar')
      setPicking(data.picking)
      await refreshDashboard()
      setFeedback('Pedido marcado como completado')
    } catch (error: any) {
      setFeedback(error?.message || 'No se pudo completar el picking')
    } finally {
      setLoading(false)
    }
  }

  const groupedLines = useMemo(() => {
    if (picking?.lines) return picking.lines
    if (orderData?.lines) return orderData.lines as SapLine[]
    return []
  }, [picking, orderData])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Head>
        <title>Picking &amp; Packing | EWM</title>
      </Head>
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
        <header className="bg-gradient-to-br from-sky-900/60 via-slate-900 to-slate-950 border border-sky-800/40 rounded-3xl p-8 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-sky-300/80">EWM Playbook</p>
              <h1 className="text-3xl font-bold text-white mt-2">Flujo de Picking y Embalaje</h1>
              <p className="text-slate-300 mt-2 max-w-2xl">
                Reutiliza la estética del módulo EWM para buscar pedidos SAP, gestionar líneas, tomar evidencias fotográficas y completar trazabilidad.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {picking && (
                <span className={`px-3 py-2 rounded-full border text-sm font-semibold ${statusBadges[picking.status] || statusBadges.PENDING}`}>
                  {picking.status}
                </span>
              )}
              <button
                onClick={markCompleted}
                disabled={!picking || loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-100 border border-emerald-500/40 hover:bg-emerald-500/30 disabled:opacity-50"
              >
                <PackageCheck className="w-4 h-4" />
                Completar pedido
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[2fr_1.2fr] gap-6">
            <div className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-300">Buscar pedido SAP</label>
              <div className="mt-2 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-2 bg-slate-900/60 border border-sky-700/40 rounded-xl px-3 py-2 shadow-inner">
                  <Search className="w-4 h-4 text-sky-300" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchSearch()}
                    placeholder="Ingresa número de pedido SAP"
                    className="bg-transparent flex-1 outline-none text-sm"
                  />
                </div>
                <button
                  onClick={fetchSearch}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sky-600 text-white font-semibold shadow-lg shadow-sky-900/40 hover:bg-sky-500 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Buscar
                </button>
              </div>
              {feedback && <p className="mt-3 text-sm text-amber-200">{feedback}</p>}
            </div>

            <div className="p-4 rounded-2xl border border-sky-800/50 bg-sky-900/30">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-200">Crea trazabilidad</p>
              <h3 className="text-lg font-semibold text-white mt-2">Crea el picking y registra fotos</h3>
              <p className="text-slate-200 text-sm mt-1">Dos fotos por línea: una al pickear y otra al embalar.</p>
              <button
                onClick={createPicking}
                disabled={!orderData || !!picking || loading}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-100 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40"
              >
                <Upload className="w-4 h-4" />
                Crear picking desde SAP
              </button>
            </div>
          </div>
        </header>

        {orderData && (
          <section className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
            <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Pedido SAP</p>
                  <h2 className="text-2xl font-semibold text-white">{orderData.sapOrder}</h2>
                  <p className="text-slate-300 text-sm">PO: {orderData.purchaseOrder || 'N/A'} • Cliente: {orderData.customer}</p>
                </div>
                <div className={`px-3 py-2 rounded-full border text-xs font-semibold ${statusBadges[picking?.status || 'IN_PROGRESS']}`}>
                  {picking?.status || 'IN_PROGRESS'}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedLines.map((line: any) => {
                  const picked = picking?.lines?.find((l) => l.id === line.id) || line
                  const photos = picked?.photos || []
                  const pickPhoto = photos.find((p: any) => p.photo_type === 'PICK')
                  const packPhoto = photos.find((p: any) => p.photo_type === 'PACK')
                  const status = picked?.status || 'PENDING'

                  return (
                    <div
                      key={line.id ? `picking-${line.id}` : `${line.sapLineId || line.sku}-${line.uiId ?? line.sku}`}
                      className="p-4 rounded-xl border border-white/10 bg-slate-900/80 space-y-3 shadow-inner"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-slate-400">SKU {line.sapLineId}</p>
                          <h4 className="text-lg font-semibold text-white">{line.sku}</h4>
                          <p className="text-slate-300 text-sm line-clamp-2">{line.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-[11px] border ${statusBadges[status] || statusBadges.PENDING}`}>
                          {status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200">Cantidad: {line.quantity}</p>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <PhotoUploader
                          label="Foto picking"
                          existingUrl={pickPhoto?.s3_url}
                          disabled={!picking || loading}
                          onUpload={(file) => handleUpload(picked?.id || line.id, 'PICK', file)}
                        />
                        <PhotoUploader
                          label="Foto embalaje"
                          existingUrl={packPhoto?.s3_url}
                          disabled={!picking || loading}
                          onUpload={(file) => handleUpload(picked?.id || line.id, 'PACK', file)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-sky-300" />
                Trazabilidad
              </h3>
              <div className="space-y-2 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span>Creado por</span>
                  <span className="text-sky-200">{picking?.createdBy?.name || 'Pendiente'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Estado</span>
                  <span className="text-emerald-200 font-semibold">{picking?.status || 'IN_PROGRESS'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Actualizado</span>
                  <span className="text-slate-400">
                    {picking?.createdAt ? format(new Date(picking.createdAt), 'dd MMM yyyy HH:mm') : 'N/A'}
                  </span>
                </div>
                <p className="text-slate-400 text-xs">
                  Registra siempre dos fotos por línea. El pedido se completa automáticamente cuando todas las líneas están PACKED, pero también puedes cerrarlo manualmente.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="p-6 rounded-3xl border border-white/10 bg-slate-900/80 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
              <h3 className="text-xl font-semibold text-white">Seguimiento de pickings</h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                className="bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-sm"
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">Todos los estados</option>
                <option value="PENDING">Pendiente</option>
                <option value="IN_PROGRESS">En proceso</option>
                <option value="PICKED">Pickeado</option>
                <option value="PACKED">Embalado</option>
                <option value="COMPLETED">Completado</option>
              </select>
              <input
                className="bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-sm"
                placeholder="Filtrar por pedido SAP"
                value={filters.sapOrder}
                onChange={(e) => setFilters((f) => ({ ...f, sapOrder: e.target.value }))}
              />
            </div>
          </div>

          <div className="overflow-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-slate-950/70 text-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">Pedido</th>
                  <th className="px-4 py-3 text-left">Creador</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Líneas</th>
                  <th className="px-4 py-3 text-left">Última actualización</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dashboardPickings.map((p) => {
                  const totalLines = p.lines?.length || 0
                  const packed = p.lines?.filter((l) => l.status === 'PACKED').length || 0
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/60">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{p.sap_order_id}</div>
                        <div className="text-slate-400 text-xs">ID interno: {p.id}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-200">{(p as any).created_by?.name || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-lg border text-xs ${statusBadges[p.status] || statusBadges.PENDING}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-200">
                        {packed}/{totalLines} líneas embaladas
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {p.updated_at ? format(new Date(p.updated_at as any), 'dd MMM yyyy HH:mm') : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

function PhotoUploader({
  label,
  existingUrl,
  onUpload,
  disabled,
}: {
  label: string
  existingUrl?: string
  onUpload: (file: File) => void
  disabled?: boolean
}) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
  }

  return (
    <div className="p-3 rounded-lg border border-white/10 bg-slate-950/60">
      <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400 mb-2">{label}</p>
      {existingUrl ? (
        <a href={existingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-emerald-200">
          <ImageIcon className="w-4 h-4" /> Ver evidencia
        </a>
      ) : (
        <label className="flex items-center justify-between gap-2 text-slate-200 cursor-pointer">
          <span>Subir foto</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
            disabled={disabled}
          />
          <span className="px-2 py-1 rounded-lg bg-sky-600/20 border border-sky-500/40 text-xs">Cargar</span>
        </label>
      )}
    </div>
  )
}
