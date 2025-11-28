import { useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import Head from 'next/head'
import { Camera, CheckCircle, Image as ImageIcon, Loader2, PackageCheck, Search, Trash2, Upload, X } from 'lucide-react'
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
  picking_id?: number
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
  packingPhoto?: PickingPhoto | null
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
    { lineId?: number; pickingId?: number; type: 'PICK' | 'PACK'; lineRef: string; sapOrder: string; action?: 'create' | 'replace' }
    | null>(null)
  const [selectedPicking, setSelectedPicking] = useState<Picking | null>(null)
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null)
  const [cameraCapture, setCameraCapture] = useState<
    { lineId?: number; pickingId?: number; type: 'PICK' | 'PACK'; lineRef: string; sapOrder: string; action?: 'create' | 'replace' }
    | null>(null)
  const [uploading, setUploading] = useState(false)
  const [completingId, setCompletingId] = useState<number | null>(null)
  const [deletingLineId, setDeletingLineId] = useState<number | null>(null)
  const [deletingPhotoKey, setDeletingPhotoKey] = useState<string | null>(null)
  const [deletingPickingId, setDeletingPickingId] = useState<number | null>(null)

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
    if (selectedPicking?.sap_order_id) {
      void refreshPickingData(selectedPicking.sap_order_id)
    }
  }, [selectedPicking?.id])

  const refreshPickingData = async (sapOrderOverride?: string) => {
    const sapOrder = sapOrderOverride || picking?.sap_order_id || orderData?.sapOrder || search.trim()
    if (!sapOrder) return

    const resp = await fetch(`/api/picking/search?sapOrder=${encodeURIComponent(sapOrder)}`)
    if (resp.ok) {
      const data = await resp.json()
      setOrderData({ ...data.order, lines: data.lines })
      setPicking(data.picking)

      if (
        selectedPicking &&
        data.picking &&
        (data.picking.id === selectedPicking.id || data.picking.sap_order_id === selectedPicking.sap_order_id)
      ) {
        setSelectedPicking(data.picking)
      }
    }

    await refreshDashboard()
  }

  useEffect(() => {
    refreshDashboard()
  }, [filters])

  const handleUpload = async (
    ctx: { lineId?: number; pickingId?: number; type: 'PICK' | 'PACK'; lineRef: string; action?: 'create' | 'replace' },
    file: File,
    sapOrderOverride?: string,
  ) => {
    const sapOrder = sapOrderOverride || picking?.sap_order_id || orderData?.sapOrder
    if (!sapOrder) {
      setFeedback('Primero crea el picking antes de subir fotos')
      return
    }

    const folder =
      ctx.type === 'PACK' ? `picking/${sapOrder}/packing` : `picking/${sapOrder}/line-${ctx.lineRef || 'linea'}`
    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
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
        method: ctx.action === 'replace' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickingId: ctx.pickingId,
          pickingLineId: ctx.lineId,
          photoType: ctx.type,
          s3Url: photoUrl,
          userId: currentUserId,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.message || 'Error guardando evidencia')
      setFeedback(`Foto ${ctx.type === 'PICK' ? 'de picking' : 'de embalaje'} ${ctx.action === 'replace' ? 'actualizada' : 'guardada'}`)

      await refreshPickingData(sapOrder)
    } catch (error: any) {
      setFeedback(error?.message || 'No se pudo subir la foto')
    } finally {
      setUploading(false)
      setUploadContext(null)
    }
  }

  const markCompleted = async (targetId?: number, sapOrderOverride?: string) => {
    const targetPickingId = targetId || picking?.id
    if (!targetPickingId) return
    setCompletingId(targetPickingId)
    setFeedback(null)
    try {
      const resp = await fetch('/api/picking/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickingId: targetPickingId, status: 'COMPLETED', userId: currentUserId }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.message || 'No se pudo completar')
      if (picking?.id === targetPickingId) setPicking(data.picking)
      if (selectedPicking?.id === targetPickingId) setSelectedPicking(data.picking)

      const sapOrder = sapOrderOverride || picking?.sap_order_id || selectedPicking?.sap_order_id

      await refreshPickingData(sapOrder)
      setFeedback('Pedido marcado como completado')
    } catch (error: any) {
      setFeedback(error?.message || 'No se pudo completar el picking')
    } finally {
      setCompletingId(null)
    }
  }

  const handleDeletePhoto = async (ctx: { lineId?: number; pickingId?: number; type: 'PICK' | 'PACK'; lineRef: string }) => {
    const sapOrder = picking?.sap_order_id || orderData?.sapOrder || selectedPicking?.sap_order_id
    const key = `${ctx.type}-${ctx.lineId || ctx.pickingId}`
    setDeletingPhotoKey(key)
    setFeedback(null)

    try {
      const resp = await fetch('/api/picking/photo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickingId: ctx.pickingId,
          pickingLineId: ctx.lineId,
          photoType: ctx.type,
          userId: currentUserId,
        }),
      })

      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.message || 'No se pudo eliminar la foto')

      setFeedback('Foto eliminada')
      await refreshPickingData(sapOrder)
    } catch (error: any) {
      setFeedback(error?.message || 'No se pudo eliminar la foto')
    } finally {
      setDeletingPhotoKey(null)
    }
  }

  const handleDeleteLine = async (lineId: number) => {
    if (!lineId) return
    setDeletingLineId(lineId)
    setFeedback(null)

    try {
      const resp = await fetch('/api/picking/line', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineId }),
      })

      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.message || 'No se pudo eliminar la línea')

      setFeedback('Línea eliminada')
      await refreshPickingData()
    } catch (error: any) {
      setFeedback(error?.message || 'No se pudo eliminar la línea')
    } finally {
      setDeletingLineId(null)
    }
  }

  const handleDeletePicking = async (pickingId?: number) => {
    if (!pickingId) return
    setDeletingPickingId(pickingId)
    setFeedback(null)

    try {
      const resp = await fetch('/api/picking', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickingId }),
      })

      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.message || 'No se pudo eliminar el picking')

      setFeedback('Picking eliminado')
      setPicking(null)
      setOrderData(null)
      setSelectedPicking(null)
      await refreshDashboard()
    } catch (error: any) {
      setFeedback(error?.message || 'No se pudo eliminar el picking')
    } finally {
      setDeletingPickingId(null)
    }
  }

  const groupedLines = useMemo(() => {
    if (picking?.lines) return picking.lines
    if (orderData?.lines) return orderData.lines as SapLine[]
    return []
  }, [picking, orderData])

  const isCompleted = picking?.status === 'COMPLETED'

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
              <p className="text-slate-200 text-sm mt-1">
                Por línea solo se captura la foto de picking; el embalaje es una única foto general por pedido.
              </p>
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
                  const status = picked?.status || 'PENDING'
                  const lineRef = line.sapLineId || (line as any).sap_order_line_id || line.sku || line.id
                  const photoKey = `PICK-${picked?.id || line.id}`

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
                        <div className="flex items-start gap-2">
                          <span className={`px-2 py-1 rounded-lg text-[11px] border ${statusBadges[status] || statusBadges.PENDING}`}>
                            {status}
                          </span>
                          {picking?.id && !isCompleted && (
                            <button
                              onClick={() => {
                                if (window.confirm('¿Eliminar esta línea y sus fotos?')) {
                                  void handleDeleteLine(picked?.id || line.id)
                                }
                              }}
                              disabled={deletingLineId === (picked?.id || line.id)}
                              className="p-2 rounded-lg border border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20 disabled:opacity-60"
                              aria-label="Eliminar línea"
                            >
                              {deletingLineId === (picked?.id || line.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-200">Cantidad: {line.quantity}</p>

                      <div className="grid grid-cols-1 text-xs">
                        <PhotoUploader
                          label="Foto picking"
                          existingUrl={pickPhoto?.s3_url}
                          disabled={!picking || isCompleted}
                          busy={uploading || deletingPhotoKey === photoKey}
                          onUpload={() =>
                            setUploadContext({
                              lineId: picked?.id || line.id,
                              type: 'PICK',
                              lineRef: String(lineRef),
                              sapOrder: picking?.sap_order_id || orderData?.sapOrder,
                              action: pickPhoto ? 'replace' : 'create',
                            })
                          }
                          onPreview={(url) => setPreviewPhoto({ url, title: `${line.sku} · Picking` })}
                          onDelete={
                            pickPhoto && !isCompleted
                              ? () =>
                                  handleDeletePhoto({
                                    lineId: picked?.id || line.id,
                                    type: 'PICK',
                                    lineRef: String(lineRef),
                                  })
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              {picking && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-4 items-start">
                  <div className="p-4 rounded-2xl border border-white/10 bg-slate-900/70">
                    <h4 className="text-sm text-slate-200 font-semibold flex items-center gap-2">
                      <PackageCheck className="w-4 h-4 text-emerald-300" /> Foto de embalaje (única por picking)
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Sube una foto del packing final. Solo necesitas una por pedido.
                    </p>
                  </div>
                  <PhotoUploader
                    label="Foto de packing"
                    existingUrl={picking.packingPhoto?.s3_url}
                    disabled={isCompleted}
                    busy={uploading || deletingPhotoKey === `PACK-${picking.id}`}
                    onUpload={() =>
                      setUploadContext({
                        pickingId: picking.id,
                        type: 'PACK',
                        lineRef: 'packing',
                        sapOrder: picking.sap_order_id || orderData?.sapOrder,
                        action: picking.packingPhoto?.s3_url ? 'replace' : 'create',
                      })
                    }
                    onPreview={(url) => setPreviewPhoto({ url, title: `${orderData?.sapOrder || picking.sap_order_id} · Packing` })}
                    onDelete={
                      picking.packingPhoto?.s3_url && !isCompleted
                        ? () => handleDeletePhoto({ pickingId: picking.id, type: 'PACK', lineRef: 'packing' })
                        : undefined
                    }
                  />
                </div>
              )}
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
                  Registra la foto de picking en cada línea y una única foto de packing general. El pedido se completa cuando todas las líneas están en PACKED.
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
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSelectedPicking(p)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-white/10 text-slate-100 hover:bg-slate-800"
                      >
                        <Camera className="w-4 h-4" />
                        {isViewOnly ? 'Ver' : 'Editar / aprobar'}
                      </button>
                      {p.status !== 'COMPLETED' && (
                        <>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  '¿Eliminar este picking? Se perderán las fotos y líneas asociadas.',
                                )
                              ) {
                                void handleDeletePicking(p.id)
                              }
                            }}
                            disabled={deletingPickingId === p.id}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600/15 border border-red-500/50 text-red-100 hover:bg-red-600/25 disabled:opacity-60"
                          >
                            {deletingPickingId === p.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            Eliminar
                          </button>
                          <button
                            onClick={() => void markCompleted(p.id, p.sap_order_id)}
                            disabled={
                              completingId === p.id ||
                              p.status === 'COMPLETED' ||
                              !(
                                p.lines?.length &&
                                p.lines.every((line) => line.status === 'PACKED') &&
                                p.packingPhoto?.s3_url
                              )
                            }
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/50 text-emerald-50 hover:bg-emerald-600/30 disabled:opacity-50"
                          >
                            {completingId === p.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <PackageCheck className="w-4 h-4" />
                            )}
                            Completar
                          </button>
                        </>
                      )}
                    </div>
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
            onCamera={(ctx) => {
              setUploadContext(ctx)
              setCameraCapture(ctx)
            }}
          />
        )}

        {previewPhoto && (
          <FullPhotoPreview photo={previewPhoto} onClose={() => setPreviewPhoto(null)} />
        )}

        {cameraCapture && (
          <CameraCaptureModal
            context={cameraCapture}
            onClose={() => setCameraCapture(null)}
            onCapture={async (file) => {
              await handleUpload(
                {
                  lineId: cameraCapture.lineId,
                  pickingId: cameraCapture.pickingId,
                  type: cameraCapture.type,
                  lineRef: cameraCapture.lineRef,
                  action: cameraCapture.action,
                },
                file,
                cameraCapture.sapOrder,
              )
              setCameraCapture(null)
            }}
          />
        )}

        {selectedPicking && (
          <ExistingPickingModal
            picking={selectedPicking}
            onClose={() => setSelectedPicking(null)}
            onOpenUpload={(payload) => setUploadContext(payload)}
            onPreview={(url, title) => setPreviewPhoto({ url, title })}
            onDeletePhoto={handleDeletePhoto}
            onDeleteLine={handleDeleteLine}
            uploading={uploading}
            deletingPhotoKey={deletingPhotoKey}
            deletingLineId={deletingLineId}
            onComplete={(pId, sapOrder) => void markCompleted(pId, sapOrder)}
            onDeletePicking={(pId) => void handleDeletePicking(pId)}
            completingId={completingId}
            deletingPickingId={deletingPickingId}
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
              {
                lineId: uploadContext.lineId,
                pickingId: uploadContext.pickingId,
                type: uploadContext.type,
                lineRef: uploadContext.lineRef,
                action: uploadContext.action,
              },
              file,
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
              {
                lineId: uploadContext.lineId,
                pickingId: uploadContext.pickingId,
                type: uploadContext.type,
                lineRef: uploadContext.lineRef,
                action: uploadContext.action,
              },
              file,
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
  busy,
  onDelete,
}: {
  label: string
  existingUrl?: string
  onUpload: () => void
  onPreview?: (url: string) => void
  disabled?: boolean
  busy?: boolean
  onDelete?: () => void
}) {
  const isDisabled = disabled || busy
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
              disabled={isDisabled}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-sky-700/40 border border-sky-500/40 text-sky-50 hover:bg-sky-700/50 disabled:opacity-60"
            >
              <Camera className="w-4 h-4" /> Reemplazar
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isDisabled}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-600/20 border border-red-500/50 text-red-100 hover:bg-red-600/30 disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onUpload}
            disabled={isDisabled}
            className="flex-1 inline-flex items-center justify-between gap-2 text-slate-200 px-3 py-2 rounded-lg bg-slate-900/70 border border-sky-700/40 hover:bg-slate-900 disabled:opacity-40"
          >
            <span className="text-left">Tomar foto</span>
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
  onCamera,
}: {
  context: { lineId?: number; pickingId?: number; type: 'PICK' | 'PACK'; lineRef: string; sapOrder: string; action?: 'create' | 'replace' }
  onClose: () => void
  galleryInputRef: React.RefObject<HTMLInputElement>
  cameraInputRef: React.RefObject<HTMLInputElement>
  onCamera: (ctx: { lineId?: number; pickingId?: number; type: 'PICK' | 'PACK'; lineRef: string; sapOrder: string; action?: 'create' | 'replace' }) => void
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
          {/* <button
            onClick={() => {
              onClose()
              galleryInputRef.current?.click()
            }}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-sky-700/30 border border-sky-500/40 text-sky-100 hover:bg-sky-700/40"
          >
            <ImageIcon className="w-4 h-4" /> Cargar foto
          </button> */}
          <button
            onClick={() => {
              onClose()
              onCamera(context)
            }}
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

function CameraCaptureModal({
  context,
  onClose,
  onCapture,
}: {
  context: { lineId?: number; pickingId?: number; type: 'PICK' | 'PACK'; lineRef: string; sapOrder: string; action?: 'create' | 'replace' }
  onClose: () => void
  onCapture: (file: File) => Promise<void>
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    let activeStream: MediaStream | null = null
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        activeStream = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err: any) {
        setError('No se pudo acceder a la cámara. Revisa permisos e intenta nuevamente.')
      }
    }

    void start()

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const takePhoto = async () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    setCapturing(true)
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setCapturing(false)
        setError('No se pudo capturar la foto')
        return
      }
      const file = new File([blob], `picking-${context.sapOrder}-${context.lineRef}-${context.type}.jpg`, {
        type: 'image/jpeg',
      })
      await onCapture(file)
      setCapturing(false)
      onClose()
    }, 'image/jpeg', 0.9)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="bg-slate-950/95 border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 text-slate-100">
          <div>
            <p className="text-xs text-slate-400">Pedido {context.sapOrder}</p>
            <h3 className="text-lg font-semibold">Toma la foto con la cámara</h3>
            <p className="text-xs text-slate-400">Línea {context.lineRef} · {context.type === 'PICK' ? 'Picking' : 'Embalaje'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-white/10 text-slate-200 hover:bg-white/10"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-black">{/* camera preview */}
          <video ref={videoRef} autoPlay playsInline className="w-full max-h-[60vh] object-contain bg-black" />
        </div>

        <div className="p-4 space-y-2">
          {error && <p className="text-sm text-amber-200">{error}</p>}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/10 text-slate-200 hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              onClick={takePhoto}
              disabled={capturing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-50"
            >
              {capturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              Capturar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExistingPickingModal({
  picking,
  onClose,
  onOpenUpload,
  onPreview,
  onDeletePhoto,
  onDeleteLine,
  onComplete,
  onDeletePicking,
  uploading,
  deletingPhotoKey,
  deletingLineId,
  completingId,
  deletingPickingId,
}: {
  picking: Picking
  onClose: () => void
  onOpenUpload: (payload: { lineId?: number; pickingId?: number; type: 'PICK' | 'PACK'; lineRef: string; sapOrder: string; action?: 'create' | 'replace' }) => void
  onPreview: (url: string, title: string) => void
  onDeletePhoto: (payload: { lineId?: number; pickingId?: number; type: 'PICK' | 'PACK'; lineRef: string }) => Promise<void>
  onDeleteLine: (lineId: number) => Promise<void>
  onComplete: (pickingId: number, sapOrder?: string) => void
  onDeletePicking: (pickingId: number) => void
  uploading: boolean
  deletingPhotoKey: string | null
  deletingLineId: number | null
  completingId: number | null
  deletingPickingId: number | null
}) {
  const packPhoto = picking.packingPhoto
  const viewOnly = picking.status === 'COMPLETED'
  const packPhotoKey = `PACK-${picking.id}`
  return (
    <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-slate-950/95 border border-white/10 rounded-3xl w-full max-w-5xl p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Pedido {picking.sap_order_id}</p>
            <h3 className="text-2xl font-semibold text-white">Edición y aprobación</h3>
            {/* <p className="text-slate-300 text-sm">
              Valida cada etapa para pickings existentes en la tabla. Agrega evidencias o aprueba líneas según corresponda.
            </p> */}
          </div>
          <div className="flex items-center gap-2">
            {picking.status !== 'COMPLETED' && (
              <>
                <button
                  onClick={() => onComplete(picking.id, picking.sap_order_id)}
                  disabled={
                    completingId === picking.id ||
                    !(
                      picking.lines?.length &&
                      picking.lines.every((line) => line.status === 'PACKED') &&
                      picking.packingPhoto?.s3_url
                    )
                  }
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/50 text-emerald-50 hover:bg-emerald-600/30 disabled:opacity-50"
                >
                  {completingId === picking.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PackageCheck className="w-4 h-4" />
                  )}
                  Completar
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('¿Eliminar este picking? Se perderán las fotos y líneas.')) {
                      onDeletePicking(picking.id)
                    }
                  }}
                  disabled={deletingPickingId === picking.id}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600/15 border border-red-500/50 text-red-100 hover:bg-red-600/25 disabled:opacity-60"
                >
                  {deletingPickingId === picking.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Eliminar
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-white/10 text-slate-200 hover:bg-white/10"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-3 items-start">
          <div className="p-4 rounded-2xl border border-white/10 bg-slate-900/80">
            <p className="text-xs text-slate-400">Picking y Packing</p>
            <h4 className="text-lg font-semibold text-white">Fotos de picking y embalaje general</h4>
            <p className="text-sm text-slate-300">Ingresa una foto para cada producto y una con el embalaje general.</p>
          </div>
          <PhotoUploader
            label="Foto packing"
            existingUrl={packPhoto?.s3_url}
            disabled={viewOnly}
            busy={uploading || deletingPhotoKey === packPhotoKey}
            onUpload={() =>
              onOpenUpload({
                pickingId: picking.id,
                type: 'PACK',
                lineRef: 'packing',
                sapOrder: picking.sap_order_id || '',
                action: packPhoto?.s3_url ? 'replace' : 'create',
              })
            }
            onPreview={(url) => onPreview(url, `${picking.sap_order_id} · Packing`)}
            onDelete={
              packPhoto?.s3_url && !viewOnly
                ? () => onDeletePhoto({ pickingId: picking.id, type: 'PACK', lineRef: 'packing' })
                : undefined
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {picking.lines?.map((line) => {
            const pickPhoto = line.photos?.find((p) => p.photo_type === 'PICK')
            const lineRef = line.sapLineId || (line as any).sap_order_line_id || line.sku || line.id
            const photoKey = `PICK-${line.id}`
            return (
              <div key={line.id} className="p-5 rounded-2xl border border-white/10 bg-slate-900/85 space-y-3 shadow-inner">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-400">SKU {line.sapLineId || (line as any).sap_order_line_id}</p>
                    <h4 className="text-lg font-semibold text-white">{line.sku}</h4>
                    <p className="text-slate-300 text-sm line-clamp-2">{line.description}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className={`px-2 py-1 rounded-lg text-[11px] border ${statusBadges[line.status] || statusBadges.PENDING}`}>
                      {line.status}
                    </span>
                    {!viewOnly && (
                      <button
                        onClick={() => {
                          if (window.confirm('¿Eliminar esta línea y sus fotos?')) {
                            void onDeleteLine(line.id)
                          }
                        }}
                        disabled={deletingLineId === line.id}
                        className="p-2 rounded-lg border border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20 disabled:opacity-60"
                        aria-label="Eliminar línea"
                      >
                        {deletingLineId === line.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-200">Cantidad: {line.quantity}</p>

                <div className="grid grid-cols-1 sm:grid-cols-1 gap-2 text-xs">
                  <PhotoUploader
                    label="Foto picking"
                    existingUrl={pickPhoto?.s3_url}
                    disabled={viewOnly}
                    busy={uploading || deletingPhotoKey === photoKey}
                    onUpload={() =>
                      onOpenUpload({
                        lineId: line.id,
                        type: 'PICK',
                        lineRef: String(lineRef),
                        sapOrder: picking.sap_order_id || '',
                        action: pickPhoto ? 'replace' : 'create',
                      })
                    }
                    onPreview={(url) => onPreview(url, `${line.sku} · Picking`)}
                    onDelete={
                      pickPhoto && !viewOnly
                        ? () => onDeletePhoto({ lineId: line.id, type: 'PICK', lineRef: String(lineRef) })
                        : undefined
                    }
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
