import { useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import Head from 'next/head'
import { Camera, CheckCircle, Image as ImageIcon, Loader2, PackageCheck, Search, Upload, X } from 'lucide-react'
import { useSession } from 'next-auth/react'

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
  const { data: session, status } = useSession({ required: true })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const [picking, setPicking] = useState<Picking | null>(null)
  const [dashboardPickings, setDashboardPickings] = useState<Picking[]>([])
  const [filters, setFilters] = useState({ status: '', sapOrder: '' })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [uploadContext, setUploadContext] = useState<
    { lineId: number; type: 'PICK' | 'PACK'; lineRef: string; sapOrder: string }
  | null>(null)
  const [selectedPicking, setSelectedPicking] = useState<Picking | null>(null)
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null)

  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)

  const currentUserId = useMemo(() => {
    return Number(
      // common session shapes across the app
      (session as any)?.token?.sub ||
        (session as any)?.token?.user?.id ||
        (session as any)?.token?.token?.user?.id,
    ) || undefined
  }, [session])

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
        body: JSON.stringify({ sapOrder: orderData.sapOrder, userId: currentUserId }),
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

  const handleUpload = async (
    lineId: number,
    type: 'PICK' | 'PACK',
    file: File,
    lineRef: string,
    sapOrderOverride?: string,
  ) => {
    const sapOrder = sapOrderOverride || picking?.sap_order_id || orderData?.sapOrder
    if (!sapOrder) {
      setFeedback('Primero crea el picking antes de subir fotos')
      return
    }

    const folder = `picking/${sapOrder}/line-${lineRef}`
    const formData = new FormData()
    formData.append('file', file)

    setLoading(true)
    setFeedback(null)
    try {
      const uploadResp = await fetch(`/api/uploaderS?folder=${encodeURIComponent(folder)}`, {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadResp.json()
      if (!uploadResp.ok) throw new Error(uploadData?.error || 'No se pudo subir a S3')

      const photoUrl = uploadData.url || uploadData.presignedUrl
      if (!photoUrl) throw new Error('No se obtuvo URL de la foto')

      const resp = await fetch('/api/picking/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickingLineId: lineId,
          photoType: type,
          s3Url: photoUrl,
          userId: currentUserId,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.message || 'Error guardando evidencia')
      setFeedback(`Foto ${type === 'PICK' ? 'de picking' : 'de embalaje'} guardada`)
      await fetchSearch()
      await refreshDashboard()

      if (sapOrder) {
        const refreshed = await fetch(`/api/picking/search?sapOrder=${encodeURIComponent(sapOrder)}`)
        if (refreshed.ok) {
          const refreshedData = await refreshed.json()
          if (refreshedData.picking?.sap_order_id === selectedPicking?.sap_order_id) {
            setSelectedPicking(refreshedData.picking)
          }
        }
      }
    } catch (error: any) {
      setFeedback(error?.message || 'No se pudo subir la foto')
    } finally {
      setLoading(false)
      setUploadContext(null)
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
        body: JSON.stringify({ pickingId: picking.id, status: 'COMPLETED', userId: currentUserId }),
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-300">Validando sesión...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center">
      <Head>
        <title>App de registro de picking</title>
      </Head>
      <div className="w-full max-w-6xl px-4 pb-14 pt-20 space-y-10">
        <header className="bg-gradient-to-br from-sky-900/60 via-slate-900 to-slate-950 border border-sky-800/40 rounded-3xl p-8 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-sky-300/80">App de registro de picking</p>
              <h1 className="text-3xl font-bold text-white mt-2">Flujo de Picking y Embalaje</h1>
              <p className="text-slate-300 mt-2 max-w-2xl">
                Busca pedidos SAP, gestiona líneas, toma evidencias fotográficas y completa trazabilidad con el flujo de picking y embalaje.
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

              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {groupedLines.map((line: any) => {
                  const picked = picking?.lines?.find((l) => l.id === line.id) || line
                  const photos = picked?.photos || []
                  const pickPhoto = photos.find((p: any) => p.photo_type === 'PICK')
                  const packPhoto = photos.find((p: any) => p.photo_type === 'PACK')
                  const status = picked?.status || 'PENDING'
                  const lineRef = line.sapLineId || (line as any).sap_order_line_id || line.sku || line.id

                  return (
                    <div
                      key={line.id ? `picking-${line.id}` : `${line.sapLineId || line.sku}-${line.uiId ?? line.sku}`}
                      className="p-5 rounded-2xl border border-white/10 bg-slate-900/80 space-y-3 shadow-inner"
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <PhotoUploader
                          label="Foto picking"
                          existingUrl={pickPhoto?.s3_url}
                          disabled={!picking || loading}
                          onUpload={() =>
                            setUploadContext({
                              lineId: picked?.id || line.id,
                              type: 'PICK',
                              lineRef: String(lineRef),
                              sapOrder: picking?.sap_order_id || orderData?.sapOrder,
                            })
                          }
                          onPreview={(url) => setPreviewPhoto({ url, title: `${line.sku} · Picking` })}
                        />
                        <PhotoUploader
                          label="Foto embalaje"
                          existingUrl={packPhoto?.s3_url}
                          disabled={!picking || loading}
                          onUpload={() =>
                            setUploadContext({
                              lineId: picked?.id || line.id,
                              type: 'PACK',
                              lineRef: String(lineRef),
                              sapOrder: picking?.sap_order_id || orderData?.sapOrder,
                            })
                          }
                          onPreview={(url) => setPreviewPhoto({ url, title: `${line.sku} · Embalaje` })}
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
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Líneas</th>
                  <th className="px-4 py-3 text-left">Última actualización</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dashboardPickings.map((p) => {
                  const totalLines = p.lines?.length || 0
                  const packed = p.lines?.filter((l) => l.status === 'PACKED').length || 0
                  const isViewOnly = p.status === 'COMPLETED' || (totalLines > 0 && packed === totalLines)
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/60">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{p.sap_order_id}</div>
                        <div className="text-slate-400 text-xs">ID interno: {p.id}</div>
                      </td>
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
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedPicking(p)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-white/10 text-slate-100 hover:bg-slate-800"
                        >
                          <Camera className="w-4 h-4" />
                          {isViewOnly ? 'Ver' : 'Editar / aprobar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {uploadContext && (
          <PhotoCapturePrompt
            context={uploadContext}
            onClose={() => setUploadContext(null)}
            galleryInputRef={galleryInputRef}
            cameraInputRef={cameraInputRef}
          />
        )}

        {previewPhoto && (
          <FullPhotoPreview photo={previewPhoto} onClose={() => setPreviewPhoto(null)} />
        )}

        {selectedPicking && (
          <ExistingPickingModal
            picking={selectedPicking}
            onClose={() => setSelectedPicking(null)}
            onOpenUpload={(payload) => setUploadContext(payload)}
            onPreview={(url, title) => setPreviewPhoto({ url, title })}
          />
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={galleryInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && uploadContext) {
            void handleUpload(
              uploadContext.lineId,
              uploadContext.type,
              file,
              uploadContext.lineRef,
              uploadContext.sapOrder,
            )
          }
        }}
      />
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={cameraInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file && uploadContext) {
            void handleUpload(
              uploadContext.lineId,
              uploadContext.type,
              file,
              uploadContext.lineRef,
              uploadContext.sapOrder,
            )
          }
        }}
      />
    </div>
  )
}

function PhotoUploader({
  label,
  existingUrl,
  onUpload,
  onPreview,
  disabled,
}: {
  label: string
  existingUrl?: string
  onUpload: () => void
  onPreview?: (url: string) => void
  disabled?: boolean
}) {
  return (
    <div className="p-3 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-900/80 to-slate-950/60 shadow-inner flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">{label}</p>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border ${
            existingUrl
              ? 'text-emerald-200 bg-emerald-500/10 border-emerald-500/40'
              : 'text-slate-300 bg-slate-800/70 border-white/10'
          }`}
        >
          {existingUrl ? 'cargada' : 'pendiente'}
        </span>
      </div>

      {existingUrl ? (
        <div className="grid grid-cols-[auto,1fr] gap-3 items-start">
          <button
            type="button"
            onClick={() => onPreview?.(existingUrl)}
            className="group relative aspect-square w-24 sm:w-28 rounded-xl overflow-hidden border border-white/15 bg-slate-900/70 hover:ring-2 hover:ring-sky-400/60 transition"
            aria-label="Ver evidencia"
          >
            <img src={existingUrl} alt="Evidencia" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
          </button>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onPreview?.(existingUrl)}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-slate-100 hover:bg-slate-800"
            >
              <ImageIcon className="w-4 h-4" /> Ver grande
            </button>
            <button
              type="button"
              onClick={onUpload}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-sky-700/40 border border-sky-500/40 text-sky-50 hover:bg-sky-700/50"
            >
              <Camera className="w-4 h-4" /> Reemplazar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onUpload}
            disabled={disabled}
            className="flex-1 inline-flex items-center justify-between gap-2 text-slate-200 px-3 py-2 rounded-lg bg-slate-900/70 border border-sky-700/40 hover:bg-slate-900 disabled:opacity-40"
          >
            <span className="text-left">Tomar / cargar foto</span>
            <Camera className="w-4 h-4 text-sky-300" />
          </button>
        </div>
      )}
    </div>
  )
}

function PhotoCapturePrompt({
  context,
  onClose,
  galleryInputRef,
  cameraInputRef,
}: {
  context: { lineId: number; type: 'PICK' | 'PACK'; lineRef: string; sapOrder: string }
  onClose: () => void
  galleryInputRef: React.RefObject<HTMLInputElement>
  cameraInputRef: React.RefObject<HTMLInputElement>
}) {
  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-400">Pedido {context.sapOrder}</p>
            <h3 className="text-lg font-semibold text-white">Selecciona origen de foto</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 text-slate-200 hover:bg-white/10"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2 text-slate-200 text-sm">
          <p>Línea: {context.lineRef}</p>
          <p>Foto: {context.type === 'PICK' ? 'Picking' : 'Embalaje'}</p>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-sky-700/30 border border-sky-500/40 text-sky-100 hover:bg-sky-700/40"
          >
            <ImageIcon className="w-4 h-4" /> Cargar foto
          </button>
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-700/30 border border-emerald-500/40 text-emerald-100 hover:bg-emerald-700/40"
          >
            <Camera className="w-4 h-4" /> Tomar foto
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-400">Usa la opción "Tomar foto" para abrir la cámara del dispositivo.</p>
      </div>
    </div>
  )
}

function ExistingPickingModal({
  picking,
  onClose,
  onOpenUpload,
  onPreview,
}: {
  picking: Picking
  onClose: () => void
  onOpenUpload: (payload: { lineId: number; type: 'PICK' | 'PACK'; lineRef: string; sapOrder: string }) => void
  onPreview: (url: string, title: string) => void
}) {
  return (
    <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-slate-950/95 border border-white/10 rounded-3xl w-full max-w-5xl p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Pedido {picking.sap_order_id}</p>
            <h3 className="text-2xl font-semibold text-white">Edición y aprobación</h3>
            <p className="text-slate-300 text-sm">
              Valida cada etapa para pickings existentes en la tabla. Agrega evidencias o aprueba líneas según corresponda.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 text-slate-200 hover:bg-white/10"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {picking.lines?.map((line) => {
            const pickPhoto = line.photos?.find((p) => p.photo_type === 'PICK')
            const packPhoto = line.photos?.find((p) => p.photo_type === 'PACK')
            const lineRef = line.sapLineId || (line as any).sap_order_line_id || line.sku || line.id
            return (
              <div key={line.id} className="p-5 rounded-2xl border border-white/10 bg-slate-900/85 space-y-3 shadow-inner">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-400">SKU {line.sapLineId || (line as any).sap_order_line_id}</p>
                    <h4 className="text-lg font-semibold text-white">{line.sku}</h4>
                    <p className="text-slate-300 text-sm line-clamp-2">{line.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[11px] border ${statusBadges[line.status] || statusBadges.PENDING}`}>
                    {line.status}
                  </span>
                </div>

                <p className="text-sm text-slate-200">Cantidad: {line.quantity}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <PhotoUploader
                    label="Foto picking"
                    existingUrl={pickPhoto?.s3_url}
                    disabled={false}
                    onUpload={() =>
                      onOpenUpload({
                        lineId: line.id,
                        type: 'PICK',
                        lineRef: String(lineRef),
                        sapOrder: picking.sap_order_id || '',
                      })
                    }
                    onPreview={(url) => onPreview(url, `${line.sku} · Picking`)}
                  />
                  <PhotoUploader
                    label="Foto embalaje"
                    existingUrl={packPhoto?.s3_url}
                    disabled={false}
                    onUpload={() =>
                      onOpenUpload({
                        lineId: line.id,
                        type: 'PACK',
                        lineRef: String(lineRef),
                        sapOrder: picking.sap_order_id || '',
                      })
                    }
                    onPreview={(url) => onPreview(url, `${line.sku} · Embalaje`)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function FullPhotoPreview({ photo, onClose }: { photo: { url: string; title: string }; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="relative max-w-4xl w-full max-h-[90vh] bg-slate-950/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 text-slate-100">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-sky-300" />
            <span className="text-sm font-semibold">{photo.title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 text-slate-200 hover:bg-white/10"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 bg-black">
          <img src={photo.url} alt={photo.title} className="w-full max-h-[75vh] object-contain mx-auto" />
        </div>
      </div>
    </div>
  )
}
