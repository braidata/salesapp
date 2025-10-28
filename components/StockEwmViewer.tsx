// components/StockEwmViewer.tsx
import React, { useMemo, useState, useRef, useCallback } from "react";
import { Camera, X, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, SwitchCamera } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { exportToExcel } from "@/lib/export-utils";

type SapRow = { UBICACION?: string; PRODUCTO?: string | number; UMB?: string; CANTIDAD?: string | number; DESCRIPCION?: string; };
type ApiErrWrapped = { ok: false; status?: number; message?: string; logId?: string; data?: any };
type UiRow = { UBICACION: string; PRODUCTO: string; UMB: string; CANTIDAD: number; DESCRIPCION: string; };

// helpers
const toNumber = (v: unknown) => {
  const s = String(v ?? "").replace(/[^\d.,-]/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

function normalizeToRows(payload: any): UiRow[] {
  const data = (payload?.data ?? payload) ?? {};
  const base = data?.DATA ?? data;
  let arr: SapRow[] = [];
  if (Array.isArray(base)) arr = base;
  else if (base && typeof base === "object") arr = [base];
  return arr.map((d) => ({
    UBICACION: String(d.UBICACION ?? ""),
    PRODUCTO: String(d.PRODUCTO ?? ""),
    UMB: String(d.UMB ?? ""),
    CANTIDAD: toNumber(d.CANTIDAD),
    DESCRIPCION: String(d.DESCRIPCION ?? ""),
  }));
}

type SortKey = keyof UiRow;
type SortDir = "asc" | "desc";

// Componente Scanner Modal mejorado
const BarcodeScanner: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
  title: string;
}> = ({ isOpen, onClose, onScan, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);

  const switchCamera = useCallback(async () => {
    if (devices.length <= 1) return;
    
    stopScanning();
    const nextIndex = (currentDeviceIndex + 1) % devices.length;
    setCurrentDeviceIndex(nextIndex);
    
    if (!videoRef.current) return;
    
    try {
      const codeReader = new BrowserMultiFormatReader();
      scannerRef.current = codeReader;
      
      await codeReader.decodeFromVideoDevice(
        devices[nextIndex].deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText();
            onScan(text);
            stopScanning();
            onClose();
          }
        }
      );
    } catch (err: any) {
      console.error("Error al cambiar cámara:", err);
      setError(err.message || "Error al cambiar de cámara");
    }
  }, [devices, currentDeviceIndex, onScan, onClose]);

  const startScanning = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      setError(null);
      setScanning(true);
      
      const codeReader = new BrowserMultiFormatReader();
      scannerRef.current = codeReader;
      
      const videoInputDevices = await codeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error("No se encontraron cámaras disponibles");
      }
      
      setDevices(videoInputDevices);
      
      // Intentar preferir cámara trasera primero
      const backCameraIndex = videoInputDevices.findIndex(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('trasera')
      );
      
      const selectedIndex = backCameraIndex !== -1 ? backCameraIndex : 0;
      setCurrentDeviceIndex(selectedIndex);
      
      await codeReader.decodeFromVideoDevice(
        videoInputDevices[selectedIndex].deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText();
            onScan(text);
            stopScanning();
            onClose();
          }
        }
      );
    } catch (err: any) {
      console.error("Error al iniciar scanner:", err);
      setError(err.message || "Error al acceder a la cámara");
      setScanning(false);
    }
  }, [onScan, onClose]);

  const stopScanning = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.reset();
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      startScanning();
    }
    return () => {
      stopScanning();
    };
  }, [isOpen, startScanning, stopScanning]);

  if (!isOpen) return null;

  const getCameraLabel = () => {
    if (devices.length === 0) return "";
    const device = devices[currentDeviceIndex];
    if (device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('rear')) {
      return "Cámara trasera";
    } else if (device.label.toLowerCase().includes('front')) {
      return "Cámara frontal";
    }
    return `Cámara ${currentDeviceIndex + 1}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4">
        <div className="rounded-2xl border border-white/20 bg-slate-900/95 backdrop-blur-xl p-6
                        shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button
              onClick={() => {
                stopScanning();
                onClose();
              }}
              className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition"
              aria-label="Cerrar escáner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/10">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
            {scanning && (
              <>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 animate-pulse" />
                  <div className="absolute inset-y-8 left-1/2 -translate-x-1/2 w-0.5 bg-red-500 animate-pulse" />
                </div>
                
                {/* Botón para cambiar de cámara */}
                {devices.length > 1 && (
                  <button
                    onClick={switchCamera}
                    className="absolute top-4 right-4 p-3 rounded-xl border border-white/20 
                               bg-slate-900/80 backdrop-blur-sm hover:bg-slate-800/80
                               shadow-lg transition-all hover:scale-105 active:scale-95"
                    aria-label="Cambiar cámara"
                  >
                    <SwitchCamera className="w-5 h-5 text-cyan-400" />
                  </button>
                )}
                
                {/* Indicador de cámara actual */}
                {devices.length > 1 && (
                  <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg 
                                  bg-slate-900/80 backdrop-blur-sm border border-white/20">
                    <span className="text-xs text-white/80">{getCameraLabel()}</span>
                  </div>
                )}
              </>
            )}
          </div>
          
          {error && (
            <p className="mt-3 text-sm text-red-300/90">{error}</p>
          )}
          
          <div className="mt-3 space-y-1">
            <p className="text-xs text-white/60 text-center">
              Apuntá la cámara al código de barras para escanearlo automáticamente
            </p>
            {devices.length > 1 && (
              <p className="text-xs text-cyan-400/80 text-center">
                Tocá el botón de cambiar cámara si necesitás usar otra
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StockEwmViewer: React.FC = () => {
  // filtros
  const [producto, setProducto] = useState("100735");
  const [ubicacion, setUbicacion] = useState("BB-012");

  // scanner states
  const [scannerOpen, setScannerOpen] = useState<"producto" | "ubicacion" | null>(null);

  // estado remoto
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logId, setLogId] = useState<string | null>(null);
  const [rows, setRows] = useState<UiRow[]>([]);
  const [raw, setRaw] = useState<any>(null);

  // orden/paginación
  const [sortKey, setSortKey] = useState<SortKey>("UBICACION");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // consulta
  async function consultar() {
    setLoading(true);
    setError(null);
    setLogId(null);
    setRows([]);
    setRaw(null);
    setPage(1);

    try {
      const body: Record<string, string> = {};
      if (producto.trim()) body.PRODUCTO = producto.trim();
      if (ubicacion.trim()) body.UBICACION = ubicacion.trim();

      const r = await fetch("/api/apiSAPStockEWM", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await r.json().catch(async () => ({ raw: await r.text() }));

      if (!r.ok || json?.ok === false) {
        const err = (json as ApiErrWrapped) ?? {};
        setError(err?.message || `Error ${r.status}`);
        setLogId(err?.logId || null);
        setRaw(err?.data ?? json);
        return;
      }

      setRaw(json?.data ?? json);
      setRows(normalizeToRows(json));
    } catch (e: any) {
      setError(e?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  function limpiar() {
    setProducto("");
    setUbicacion("");
    setRows([]);
    setRaw(null);
    setError(null);
    setLogId(null);
    setPage(1);
  }

  // ordenamiento
  const sorted = useMemo(() => {
    const factor = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (sortKey === "CANTIDAD") return (va as number - (vb as number)) * factor;
      if (sortKey === "PRODUCTO") {
        const na = Number(va); const nb = Number(vb);
        if (Number.isFinite(na) && Number.isFinite(nb)) return (na - nb) * factor;
      }
      return String(va ?? "").localeCompare(String(vb ?? "")) * factor;
    });
  }, [rows, sortKey, sortDir]);

  const totalCantidad = useMemo(
    () => rows.reduce((acc, r) => acc + (Number.isFinite(r.CANTIDAD) ? r.CANTIDAD : 0), 0),
    [rows]
  );

  // paginación
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);

  // export usando tu /lib/export-utils
  const exportRows = (data: UiRow[], fileLabel: string) => {
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const name = ["stock_ewm", producto ? `prod-${producto}` : "", ubicacion ? `ubi-${ubicacion}` : "", fileLabel, ts]
      .filter(Boolean).join("_");
    const sheetData = [
      ["UBICACION", "PRODUCTO", "UMB", "CANTIDAD", "DESCRIPCION"],
      ...data.map(r => [r.UBICACION, r.PRODUCTO, r.UMB, r.CANTIDAD, r.DESCRIPCION]),
      ["", "", "TOTAL", data.reduce((a, r) => a + r.CANTIDAD, 0), ""],
    ];
    const fn: any = exportToExcel as any;
    try {
      fn(sheetData, name, "StockEWM");
    } catch {
      try {
        fn({ data: sheetData, filename: name, sheetName: "StockEWM" });
      } catch (e) {
        console.error("exportToExcel fallo", e);
      }
    }
  };

  const exportTodo = () => {
    if (!sorted.length) return;
    exportRows(sorted, "full");
  };

  const exportPagina = () => {
    if (!paged.length) return;
    exportRows(paged, `page-${safePage}of${totalPages}`);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  // Icono de ordenamiento
  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;
    return sortDir === "asc" 
      ? <ChevronUp className="inline w-4 h-4 ml-1" />
      : <ChevronDown className="inline w-4 h-4 ml-1" />;
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Consulta de Stock EWM
          </h1>
          <div className="flex gap-2">
            <button
              onClick={exportPagina}
              disabled={!paged.length}
              className="h-10 px-4 rounded-xl border border-emerald-400/40
                         bg-gradient-to-b from-emerald-500/20 to-emerald-600/10
                         shadow-[0_10px_30px_rgba(0,255,170,0.15)]
                         hover:from-emerald-500/30 hover:to-emerald-600/20
                         disabled:opacity-40 disabled:cursor-not-allowed transition"
              title={paged.length ? "Exportar página actual" : "Sin datos para exportar"}
            >
              Exportar página
            </button>
            <button
              onClick={exportTodo}
              disabled={!sorted.length}
              className="h-10 px-4 rounded-xl border border-cyan-400/40
                         bg-gradient-to-b from-cyan-500/20 to-cyan-600/10
                         shadow-[0_10px_30px_rgba(0,255,255,0.15)]
                         hover:from-cyan-500/30 hover:to-cyan-600/20
                         disabled:opacity-40 disabled:cursor-not-allowed transition"
              title={sorted.length ? "Exportar todo" : "Sin datos para exportar"}
            >
              Exportar todo
            </button>
          </div>
        </div>

        {/* Filtros */}
        <section
          className="mb-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 md:p-6
                     shadow-[0_20px_60px_rgba(0,0,0,0.35)]
                     [box-shadow:inset_2px_2px_10px_rgba(0,0,0,0.35),inset_-2px_-2px_10px_rgba(255,255,255,0.06)]"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="flex flex-col">
              <label className="text-xs uppercase tracking-wide text-white/60 mb-1">Producto (SKU)</label>
              <div className="flex gap-2">
                <input
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && consultar()}
                  placeholder="Ej: 100726"
                  className="flex-1 h-11 rounded-xl px-3 bg-white/5 text-white/90 placeholder-white/40
                             border border-white/10 outline-none focus:ring-2 ring-cyan-400/50"
                />
                <button
                  onClick={() => setScannerOpen("producto")}
                  className="h-11 w-11 rounded-xl border border-white/10 
                             bg-white/5 hover:bg-white/10
                             shadow-[inset_2px_2px_6px_rgba(0,0,0,0.35),inset_-2px_-2px_6px_rgba(255,255,255,0.06)]
                             hover:shadow-[inset_1px_1px_4px_rgba(0,0,0,0.35),inset_-1px_-1px_4px_rgba(255,255,255,0.08)]
                             active:scale-[.98] transition flex items-center justify-center"
                  title="Escanear código de barras"
                >
                  <Camera className="w-5 h-5 text-cyan-400" />
                </button>
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-xs uppercase tracking-wide text-white/60 mb-1">Ubicación (opcional)</label>
              <div className="flex gap-2">
                <input
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && consultar()}
                  placeholder="Ej: BB-012"
                  className="flex-1 h-11 rounded-xl px-3 bg-white/5 text-white/90 placeholder-white/40
                             border border-white/10 outline-none focus:ring-2 ring-cyan-400/50"
                />
                <button
                  onClick={() => setScannerOpen("ubicacion")}
                  className="h-11 w-11 rounded-xl border border-white/10 
                             bg-white/5 hover:bg-white/10
                             shadow-[inset_2px_2px_6px_rgba(0,0,0,0.35),inset_-2px_-2px_6px_rgba(255,255,255,0.06)]
                             hover:shadow-[inset_1px_1px_4px_rgba(0,0,0,0.35),inset_-1px_-1px_4px_rgba(255,255,255,0.08)]
                             active:scale-[.98] transition flex items-center justify-center"
                  title="Escanear código de barras"
                >
                  <Camera className="w-5 h-5 text-cyan-400" />
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={consultar}
                disabled={loading}
                className="h-11 flex-1 rounded-xl border border-cyan-400/30
                           bg-gradient-to-b from-cyan-500/20 to-cyan-600/10
                           hover:from-cyan-500/30 hover:to-cyan-600/20
                           shadow-[0_10px_30px_rgba(0,255,255,0.15)]
                           active:scale-[.98] transition"
              >
                {loading ? "Consultando..." : "Consultar"}
              </button>
              <button
                onClick={limpiar}
                className="h-11 w-28 rounded-xl border border-white/10
                           bg-white/5 hover:bg-white/10 transition"
              >
                Limpiar
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-300/90">
              {error}{logId ? ` • LogID: ${logId}` : ""}
            </p>
          )}
        </section>

        {/* Controles de paginación */}
        <div className="mb-3 flex items-center justify-between text-sm text-white/70">
          <div>Filas: <span className="text-white/90 font-medium">{sorted.length}</span> • Total CANTIDAD: <span className="text-white/90 font-medium">{totalCantidad}</span></div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <span>Tamaño</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-md bg-slate-800/80 border border-white/10 px-2 py-1 
                           text-white/90 outline-none focus:ring-2 focus:ring-cyan-400/50
                           [&>option]:bg-slate-900 [&>option]:text-white"
              >
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1.5 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 
                           disabled:opacity-40 disabled:cursor-not-allowed transition"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>Pág. {safePage} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1.5 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 
                           disabled:opacity-40 disabled:cursor-not-allowed transition"
                aria-label="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div
          className="overflow-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl
                     shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                     [box-shadow:inset_2px_2px_6px_rgba(0,0,0,0.35),inset_-2px_-2px_6px_rgba(255,255,255,0.06)]"
        >
          {paged.length > 0 ? (
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-white/10 backdrop-blur text-white/80">
                <tr className="text-left">
                  {(["UBICACION","PRODUCTO","UMB","CANTIDAD","DESCRIPCION"] as SortKey[]).map(col => (
                    <th
                      key={col}
                      onClick={() => toggleSort(col)}
                      className="px-4 py-3 font-medium cursor-pointer select-none hover:bg-white/5 transition"
                      title="Ordenar"
                    >
                      <span className="flex items-center">
                        {col}
                        <SortIcon column={col} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {paged.map((r, i) => (
                  <tr key={`${r.UBICACION}-${r.PRODUCTO}-${i}`} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-white/90">{r.UBICACION}</td>
                    <td className="px-4 py-3 text-white/90">{r.PRODUCTO}</td>
                    <td className="px-4 py-3 text-white/80">{r.UMB}</td>
                    <td className="px-4 py-3 text-white tabular-nums">{r.CANTIDAD}</td>
                    <td className="px-4 py-3 text-white/80">{r.DESCRIPCION}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white/5 text-white/80">
                <tr>
                  <td className="px-4 py-3 font-medium" colSpan={3}>Filas (página): {paged.length}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    {paged.reduce((a, r) => a + r.CANTIDAD, 0)}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="p-6 text-white/60">
              {loading ? "Cargando..." : "Sin datos. Probá con solo SKU o solo ubicación."}
            </div>
          )}
        </div>

        {/* JSON crudo */}
        {raw && (
          <details className="mt-4">
            <summary className="cursor-pointer text-white/70 hover:text-white/90">Ver JSON</summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 text-xs">
              {JSON.stringify(raw, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* Scanner Modals */}
      <BarcodeScanner
        isOpen={scannerOpen === "producto"}
        onClose={() => setScannerOpen(null)}
        onScan={(value) => {
          setProducto(value);
          setScannerOpen(null);
        }}
        title="Escanear SKU del Producto"
      />
      
      <BarcodeScanner
        isOpen={scannerOpen === "ubicacion"}
        onClose={() => setScannerOpen(null)}
        onScan={(value) => {
          setUbicacion(value.toUpperCase());
          setScannerOpen(null);
        }}
        title="Escanear Ubicación"
      />
    </div>
  );
};

export default StockEwmViewer;