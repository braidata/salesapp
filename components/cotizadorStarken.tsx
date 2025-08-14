'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

/* =================== ENDPOINT BASE =================== */
const API_BASE = '/api/starken/cotizacionAPI'; // GET ?tipo=origen|destino, POST cotización

/* =================== TIPOS =================== */
type Ciudad = {
  codigoCiudad: string | number | null;
  codigoRegion?: number | null;
  codigoZonaGeografica?: number | null;
  nombreCiudad: string | number | null;
};

type ApiGetResp = {
  message: string;
  data: {
    listaCiudadesOrigen?: Ciudad[] | Record<string, any>;
    listaCiudadesDestino?: Ciudad[] | Record<string, any>;
    [k: string]: any;
  };
};

type Tarifa = {
  costoTotal: number;
  diasEntrega: number;
  tipoEntrega?: { codigoTipoEntrega?: number; descripcionTipoEntrega?: string };
  tipoServicio?: { codigoTipoServicio?: number; descripcionTipoServicio?: string };
};

type ApiPostResp = {
  message: string;
  data?: {
    type?: string;
    codigoRespuesta?: number;
    mensajeRespuesta?: string;
    listaTarifas?: Tarifa[] | Record<string, Tarifa>;
    [k: string]: any;
  };
};

/* =================== HELPERS =================== */
const s = (v: any) => (v ?? '').toString();
const norm = (v: any) => s(v).toLowerCase();
const fmtCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(n || 0));

const Spinner = () => (
  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
  </svg>
);

// const IconSwap = () => (
//   <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
//     <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 7l3-3M7 7l3 3M17 17H7m10 0l-3-3m3 3l-3 3"/>
//   </svg>
// );

const Toast: React.FC<{ kind?: 'info'|'success'|'error', msg: string, onClose: () => void }> = ({kind='info', msg, onClose}) => {
  const colors = {
    info: 'from-sky-500/20 to-sky-500/10 border-sky-400/40',
    success: 'from-emerald-500/20 to-emerald-500/10 border-emerald-400/40',
    error: 'from-rose-500/20 to-rose-500/10 border-rose-400/40',
  }[kind];
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-2xl border backdrop-blur-md px-4 py-2 text-sm shadow-xl bg-gradient-to-b ${colors}`}>
      {msg}
    </div>
  );
};

/* =================== COMPONENTE =================== */
const CotizadorPorTipo: React.FC = () => {
  // Estados de comunas
  const [ciudadesOrigen, setCiudadesOrigen] = useState<Ciudad[]>([]);
  const [ciudadesDestino, setCiudadesDestino] = useState<Ciudad[]>([]);
  const [loadingOrigen, setLoadingOrigen] = useState(false);
  const [loadingDestino, setLoadingDestino] = useState(false);

  // Filtros y selecciones
  const [filterOrigen, setFilterOrigen] = useState('');
  const [filterDestino, setFilterDestino] = useState('');
  const [origen, setOrigen] = useState<string>('');
  const [destino, setDestino] = useState<string>('');

  // Bultos
  const [bultos, setBultos] = useState<{ peso: string; alto: string; ancho: string; largo: string; }[]>([
    { peso:'', alto:'', ancho:'', largo:'' }
  ]);

  // Otros
  const [loadingCotizar, setLoadingCotizar] = useState(false);
  const [toast, setToast] = useState<{kind:'info'|'success'|'error', msg:string} | null>(null);
  const [result, setResult] = useState<ApiPostResp | null>(null);

  /* ---- Totales (info UI; el server recalcula igual) ---- */
  const toNum = (v:string) => Number((v||'').toString().replace(',', '.')) || 0;
  const totals = useMemo(() => {
    const kilos = bultos.reduce((acc, b) => acc + toNum(b.peso), 0);
    const largoTotal = bultos.reduce((acc, b) => acc + toNum(b.largo), 0);
    const anchoMax = bultos.reduce((acc, b) => Math.max(acc, toNum(b.ancho)), 0);
    const altoMax  = bultos.reduce((acc, b) => Math.max(acc, toNum(b.alto)), 0);
    return { kilos, largoTotal, anchoMax, altoMax };
  }, [bultos]);

  /* ---- Fetch por tipo: origen/destino (con normalización) ---- */
  const fetchCiudades = async (tipo: 'origen' | 'destino') => {
    try {
      tipo === 'origen' ? setLoadingOrigen(true) : setLoadingDestino(true);

      const { data } = await axios.get<ApiGetResp>(API_BASE, { params: { tipo } });

      // Tomar lista según tipo y convertir a array si viniera como objeto
      const raw = tipo === 'origen'
        ? (data?.data?.listaCiudadesOrigen ?? [])
        : (data?.data?.listaCiudadesDestino ?? []);

      const asArray: any[] = Array.isArray(raw) ? raw : Object.values(raw ?? {});

      const lista: Ciudad[] = asArray
        .filter(Boolean)
        .map((c: any) => ({
          ...c,
          nombreCiudad: s(c?.nombreCiudad),
          codigoCiudad: s(c?.codigoCiudad),
        }))
        .sort((a, b) => norm(a.nombreCiudad).localeCompare(norm(b.nombreCiudad)));

      if (tipo === 'origen') {
        setCiudadesOrigen(lista);
        if (!origen && lista.length) {
          const pre = lista.find(c => norm(c.nombreCiudad).includes('santiago'))?.codigoCiudad ?? s(lista[0].codigoCiudad);
          setOrigen(pre);
        }
      } else {
        setCiudadesDestino(lista);
        if (!destino && lista.length) {
          const pre = lista.find(c => norm(c.nombreCiudad).includes('santiago'))?.codigoCiudad ?? s(lista[0].codigoCiudad);
          setDestino(pre);
        }
      }

      setToast({ kind:'success', msg:`Comunas de ${tipo} cargadas` });
    } catch (e:any) {
      console.error(e);
      setToast({ kind:'error', msg:`Error cargando comunas de ${tipo}` });
    } finally {
      tipo === 'origen' ? setLoadingOrigen(false) : setLoadingDestino(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    fetchCiudades('origen');
    fetchCiudades('destino');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Filtros con normalización segura ---- */
  const origenFiltrado = useMemo(() => {
    const f = norm(filterOrigen);
    return !f
      ? ciudadesOrigen
      : ciudadesOrigen.filter(c =>
          norm(c.nombreCiudad).includes(f) || norm(c.codigoCiudad).includes(f)
        );
  }, [ciudadesOrigen, filterOrigen]);

  const destinoFiltrado = useMemo(() => {
    const f = norm(filterDestino);
    return !f
      ? ciudadesDestino
      : ciudadesDestino.filter(c =>
          norm(c.nombreCiudad).includes(f) || norm(c.codigoCiudad).includes(f)
        );
  }, [ciudadesDestino, filterDestino]);

  /* ---- ABM Bultos ---- */
  const addBulto = () => setBultos(prev => [...prev, { peso:'', alto:'', ancho:'', largo:'' }]);
  const removeBulto = (idx:number) => setBultos(prev => prev.length<=1 ? prev : prev.filter((_,i)=>i!==idx));
  const updateBulto = (idx:number, field: 'peso'|'alto'|'ancho'|'largo', value:string) =>
    setBultos(prev => prev.map((b,i)=> i===idx ? { ...b, [field]: value } : b));

  /* ---- Swap OD ---- */
  const swapOD = () => {
    setOrigen(destino);
    setDestino(origen);
    setToast({ kind:'info', msg:'Origen/Destino intercambiados' });
  };

  /* ---- Validación ---- */
  const validate = (): string | null => {
    if (!s(origen)) return 'Seleccioná ciudad de origen';
    if (!s(destino)) return 'Seleccioná ciudad de destino';
    if (s(origen) === s(destino)) return 'Origen y destino no pueden ser iguales';
    for (let i=0;i<bultos.length;i++){
      const { peso, alto, ancho, largo } = bultos[i];
      if (!peso || !alto || !ancho || !largo) return `Completá todos los campos del bulto #${i+1}`;
      if (toNum(peso)<=0 || toNum(alto)<=0 || toNum(ancho)<=0 || toNum(largo)<=0) return `Los valores del bulto #${i+1} deben ser > 0`;
    }
    return null;
  };

  /* ---- Cotizar (POST a /api/starken/cotizacionAPI) ---- */
  const cotizar = async () => {
    const err = validate();
    if (err) { setToast({kind:'error', msg: err}); return; }

    try {
      setLoadingCotizar(true);
      setResult(null);

      const payload = {
        bultos,
        ciudadOrigen: origen,
        ciudadDestino: destino,
      };

      const { data } = await axios.post<ApiPostResp>(API_BASE, payload);
      setResult(data);
      setToast({ kind:'success', msg:'Cotización lista' });
    } catch (e:any) {
      console.error(e);
      setToast({ kind:'error', msg:'Error al cotizar' });
    } finally {
      setLoadingCotizar(false);
    }
  };

  /* ---- Derivar listaTarifas y destacar el más barato ---- */
  const listaTarifas: Tarifa[] = useMemo(() => {
    const raw = result?.data?.listaTarifas;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') return Object.values(raw ?? {});
    return [];
  }, [result]);

  const idxBarata = useMemo(() => {
    if (!listaTarifas.length) return -1;
    let idx = 0, min = listaTarifas[0].costoTotal ?? Number.MAX_SAFE_INTEGER;
    for (let i=1;i<listaTarifas.length;i++){
      const c = Number(listaTarifas[i].costoTotal ?? Number.MAX_SAFE_INTEGER);
      if (c < min) { min = c; idx = i; }
    }
    return idx;
  }, [listaTarifas]);

  /* ---- Render ---- */
  return (
    <div className="mx-auto max-w-5xl p-4">
      {toast && <Toast kind={toast.kind} msg={toast.msg} onClose={()=>setToast(null)} />}

      <div className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur-xl p-6 shadow-[0_10px_40px_-10px_rgba(80,200,255,0.4)]">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-100">
            Cotizador Starken
          </h2>
          {/* <div className="flex gap-2">
            <button
              type="button"
              onClick={()=>fetchCiudades('origen')}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-slate-100 hover:bg-white/20"
              title="Refrescar comunas de origen (GET /api/starken/cotizacionAPI?tipo=origen)"
            >
              Refresh Origen
            </button>
            <button
              type="button"
              onClick={()=>fetchCiudades('destino')}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-slate-100 hover:bg-white/20"
              title="Refrescar comunas de destino (GET /api/starken/cotizacionAPI?tipo=destino)"
            >
              Refresh Destino
            </button>
          </div> */}
        </div>

        {/* Origen / Destino */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {/* Origen */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-300">Origen</label>
              {loadingOrigen && <Spinner/>}
            </div>
            <input
              placeholder="Filtrar comunas de origen..."
              className="mt-2 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-slate-100 outline-none ring-1 ring-white/10 focus:ring-sky-400/40"
              value={filterOrigen}
              onChange={(e)=>setFilterOrigen(e.target.value)}
              disabled={loadingOrigen}
            />
            <select
              className="mt-2 w-full rounded-xl bg-slate-950/60 px-3 py-2 text-slate-100 outline-none ring-1 ring-white/10 hover:ring-sky-400/30 focus:ring-sky-400/50"
              value={origen}
              onChange={(e)=>setOrigen(e.target.value)}
              disabled={loadingOrigen || !ciudadesOrigen.length}
            >
              <option value="" disabled>Seleccione una ciudad de origen</option>
              {origenFiltrado.map((c)=>(
                <option key={`o-${s(c.codigoCiudad)}`} value={s(c.codigoCiudad)}>
                  {s(c.nombreCiudad)} ({s(c.codigoCiudad)})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
            
            </p>
          </div>

          {/* Destino */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-300">Destino</label>
              {loadingDestino && <Spinner/>}
            </div>
            <input
              placeholder="Filtrar comunas de destino..."
              className="mt-2 w-full rounded-xl bg-slate-950/40 px-3 py-2 text-slate-100 outline-none ring-1 ring-white/10 focus:ring-emerald-400/40"
              value={filterDestino}
              onChange={(e)=>setFilterDestino(e.target.value)}
              disabled={loadingDestino}
            />
            <select
              className="mt-2 w-full rounded-xl bg-slate-950/60 px-3 py-2 text-slate-100 outline-none ring-1 ring-white/10 hover:ring-emerald-400/30 focus:ring-emerald-400/50"
              value={destino}
              onChange={(e)=>setDestino(e.target.value)}
              disabled={loadingDestino || !ciudadesDestino.length}
            >
              <option value="" disabled>Seleccione una ciudad de destino</option>
              {destinoFiltrado.map((c)=>(
                <option key={`d-${s(c.codigoCiudad)}`} value={s(c.codigoCiudad)}>
                  {s(c.nombreCiudad)} ({s(c.codigoCiudad)})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              
            </p>
          </div>
        </div>

        {/* Swap */}
        {/* <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={swapOD}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-slate-100 hover:bg-white/10 active:scale-[0.99] transition"
            title="Intercambiar origen/destino"
          >
            <IconSwap/> Intercambiar
          </button>
        </div> */}

        {/* Bultos */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-100">Bultos</h3>
            <button
              type="button"
              onClick={addBulto}
              className="rounded-xl border border-white/10 bg-emerald-500/20 px-3 py-1.5 text-emerald-100 hover:bg-emerald-500/30"
            >
              + Agregar bulto
            </button>
          </div>

          <div className="mt-3 grid gap-3">
            {bultos.map((b, idx) => (
              <div
                key={idx}
                className="grid grid-cols-2 md:grid-cols-5 gap-2 rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                <div className="col-span-2 md:col-span-1">
                  <label className="text-xs text-slate-300">Peso (kg)</label>
                  <input
                    inputMode="decimal"
                    placeholder="12.5"
                    className="mt-1 w-full rounded-xl bg-slate-950/50 px-3 py-2 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-sky-400/40"
                    value={b.peso}
                    onChange={(e)=>updateBulto(idx, 'peso', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300">Alto (cm)</label>
                  <input
                    inputMode="decimal"
                    className="mt-1 w-full rounded-xl bg-slate-950/50 px-3 py-2 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-sky-400/40"
                    value={b.alto}
                    onChange={(e)=>updateBulto(idx, 'alto', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300">Ancho (cm)</label>
                  <input
                    inputMode="decimal"
                    className="mt-1 w-full rounded-xl bg-slate-950/50 px-3 py-2 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-sky-400/40"
                    value={b.ancho}
                    onChange={(e)=>updateBulto(idx, 'ancho', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300">Largo (cm)</label>
                  <input
                    inputMode="decimal"
                    className="mt-1 w-full rounded-xl bg-slate-950/50 px-3 py-2 text-slate-100 ring-1 ring-white/10 outline-none focus:ring-sky-400/40"
                    value={b.largo}
                    onChange={(e)=>updateBulto(idx, 'largo', e.target.value)}
                  />
                </div>

                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={()=>removeBulto(idx)}
                    disabled={bultos.length<=1}
                    className="h-10 rounded-xl border border-white/10 bg-rose-500/20 px-3 text-rose-100 hover:bg-rose-500/30 disabled:opacity-40"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen (informativo) */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-slate-400">Kilos (suma)</div>
            <div className="text-xl font-semibold text-slate-100">{totals.kilos.toFixed(2)} kg</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-slate-400">Largo (suma)</div>
            <div className="text-xl font-semibold text-slate-100">{totals.largoTotal.toFixed(2)} cm</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-slate-400">Ancho (máx)</div>
            <div className="text-xl font-semibold text-slate-100">{totals.anchoMax.toFixed(2)} cm</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-slate-400">Alto (máx)</div>
            <div className="text-xl font-semibold text-slate-100">{totals.altoMax.toFixed(2)} cm</div>
          </div>
          {/* <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-slate-400">OD</div>
            <div className="text-sm text-slate-200">{origen || '—'} → {destino || '—'}</div>
          </div> */}
        </div>

        {/* Acciones */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={()=>{ setBultos([{ peso:'', alto:'', ancho:'', largo:'' }]); setResult(null); }}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-slate-100 hover:bg-white/10"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={cotizar}
            disabled={loadingCotizar || !origen || !destino}
            className="inline-flex items-center gap-2 rounded-2xl border border-teal-300/30 bg-teal-500/20 px-5 py-2.5 text-teal-50 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] hover:bg-teal-500/30 disabled:opacity-60"
          >
            {loadingCotizar && <Spinner/>}
            {loadingCotizar ? 'Cotizando...' : 'Cotizar'}
          </button>
        </div>

        {/* Resultado (tabla hermosa + JSON crudo) */}
        {result && (
          <div className="mt-8 grid gap-4">
            {/* Banner de estado si viene distinto a 1 */}
            {typeof result?.data?.codigoRespuesta !== 'undefined' && result.data.codigoRespuesta !== 1 && (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-100">
                <div className="text-sm font-medium">Estado: código {result.data.codigoRespuesta}</div>
                <div className="text-xs opacity-90">{result.data.mensajeRespuesta || 'Respuesta del servicio'}</div>
              </div>
            )}

            {/* Tabla de tarifas si hay data */}
            {listaTarifas.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-4 shadow-[0_10px_40px_-10px_rgba(80,200,255,0.25)]">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm text-slate-300">
                    {result.data?.mensajeRespuesta || 'Resultados'} — {listaTarifas.length} opciones
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[680px] w-full text-left text-sm">
                    <thead className="sticky top-0 bg-white/10 backdrop-blur-md text-slate-200">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Tipo de Entrega</th>
                        <th className="px-4 py-2 font-semibold">Tipo de Servicio</th>
                        <th className="px-4 py-2 font-semibold">Costo Total</th>
                        <th className="px-4 py-2 font-semibold">Días de Entrega</th>
                        <th className="px-4 py-2 font-semibold">Etiqueta</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-100">
                      {listaTarifas.map((t, i) => {
                        const entrega = t?.tipoEntrega?.descripcionTipoEntrega ?? '—';
                        const servicio = t?.tipoServicio?.descripcionTipoServicio ?? '—';
                        const costo = Number(t?.costoTotal ?? 0);
                        const dias = t?.diasEntrega ?? '—';
                        const isBest = i === idxBarata;

                        return (
                          <tr key={i} className={`border-t border-white/10 ${isBest ? 'bg-emerald-500/10' : 'hover:bg-white/5'}`}>
                            <td className="px-4 py-2">
                              <span className="inline-flex items-center rounded-xl bg-white/10 px-2 py-1 text-xs">
                                {entrega}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <span className="inline-flex items-center rounded-xl bg-white/10 px-2 py-1 text-xs">
                                {servicio}
                              </span>
                            </td>
                            <td className="px-4 py-2 font-semibold">{fmtCLP(costo)}</td>
                            <td className="px-4 py-2">{dias}</td>
                            <td className="px-4 py-2">
                              {isBest ? (
                                <span className="inline-flex items-center rounded-full border border-emerald-300/40 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-100 shadow-[0_8px_24px_-12px_rgba(16,185,129,0.6)]">
                                  Mejor precio
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[11px]">
                                  Opción
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* JSON crudo para debug/flexibilidad */}
            {/* <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 text-sm text-slate-300">Respuesta completa</div>
              <pre className="max-h-[420px] overflow-auto rounded-xl bg-slate-950/60 p-3 text-[12px] leading-relaxed text-slate-100 ring-1 ring-white/10">
{JSON.stringify(result, null, 2)}
              </pre>
            </div> */}
          </div>
        )}
      </div>
    </div>
  );
};

export default CotizadorPorTipo;
