"use client"

import React, { useState, useEffect } from "react";

interface BotonEtiquetaProps {
  orderId: string;
}

export default function BotonEtiqueta({ orderId }: BotonEtiquetaProps) {
  const [tracking, setTracking] = useState<string | null>(null);
  const [preview, setPreview] = useState<string[]>([]);
  const [allUrl, setAllUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [blobs, setBlobs] = useState<Record<string,string>>({});

  // 1) Traer otDeliveryCompany
  useEffect(() => {
    (async () => {
      try {
        const today = new Date(), ago = new Date(today);
        ago.setDate(today.getDate() - 30);
        const params = new URLSearchParams({
          from: ago.toISOString().slice(0,10),
          to: today.toISOString().slice(0,10),
          ecommerce: "VENTUSCORP_VTEX",
        });
        const res = await fetch(`/api/sqlConnectorSimply?${params}`);
        const { pedidos } = await res.json();
        const p = pedidos.find((p: any)=> p.CodigoExterno === orderId);
        setTracking(p?.otDeliveryCompany || null);
      } catch {
        setTracking(null);
      }
    })();
  }, [orderId]);

  // 2) Cuando ya tengamos tracking, pedimos las etiquetas
  const openLabels = async () => {
    if (!tracking) return;
    setLoading(true);
    try {
      const res = await fetch("/api/starken/processEtiqueta", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ ordenFlete: tracking, tipoSalida:3, combineAll:false })
      });
      const data = await res.json();
      setPreview(data.data);
    } finally {
      setLoading(false);
    }
  };

  // 3) Pre-cargar “Todas”
  useEffect(() => {
    if (!preview.length) return;
    (async () => {
      setLoadingAll(true);
      try {
        const res = await fetch("/api/starken/processEtiqueta", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ ordenFlete: tracking, tipoSalida:3, combineAll:true })
        });
        const json = await res.json();
        setAllUrl(json.data[0]);
      } finally {
        setLoadingAll(false);
      }
    })();
  }, [preview, tracking]);

  // 4) Generador de blob URLs
  const toBlobUrl = async (url:string) => {
    if (blobs[url]) return blobs[url];
    let blob:Blob;
    if (url.startsWith("data:application/pdf;base64,")) {
      const bin = atob(url.split(",")[1]);
      const arr = Uint8Array.from(bin, c=>c.charCodeAt(0));
      blob = new Blob([arr], { type:"application/pdf" });
    } else {
      const res = await fetch(url, { headers:{ Authorization:`Basic ${btoa("crm:crm2019")}` } });
      blob = await res.blob();
    }
    const bUrl = URL.createObjectURL(blob);
    setBlobs(b => ({ ...b, [url]: bUrl }));
    return bUrl;
  };

  // 5) Descargar
  const download = async (url:string, idx:number) => {
    const b = await toBlobUrl(url);
    const a = document.createElement("a");
    a.href = b;
    a.download = `etiqueta_${idx+1}.pdf`;
    document.body.append(a);
    a.click();
    a.remove();
  };

  if (tracking === null) return <span className="text-slate-400">sin etiqueta</span>;

  return (
    <>
      <button
        onClick={openLabels}
        disabled={loading}
        className="px-3 py-1 rounded-lg bg-green-600/20 text-green-400"
      >
        {loading ? "Cargando…" : "Ver Etiquetas"}
      </button>

      {preview.length > 0 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg overflow-hidden w-full max-w-3xl">
            <div className="p-4 flex justify-between">
              <h4 className="text-white">Etiquetas</h4>
              <button onClick={() => setPreview([])} className="text-gray-400">Cerrar</button>
            </div>
            <div className="grid grid-cols-4 gap-2 p-4 border-t border-gray-700">
              {loadingAll
                ? <div className="col-span-4 text-gray-500">Cargando todas…</div>
                : allUrl && (
                    <button onClick={() => { setSelectedUrl(allUrl); toBlobUrl(allUrl); }}
                      className="p-2 bg-gray-800 text-gray-300 rounded">
                      Todas
                    </button>
                  )
              }
              {preview.map((u,i)=>(
                <button key={i}
                  onClick={()=>{ setSelectedUrl(u); toBlobUrl(u); }}
                  className="p-2 bg-gray-800 text-gray-300 rounded">
                  {`#${i+1}`}
                </button>
              ))}
            </div>
            <div className="h-96 bg-white">
              {selectedUrl
                ? <iframe src={blobs[selectedUrl]||""} className="w-full h-full"/>
                : <div className="flex items-center justify-center h-full text-gray-500">Selecciona</div>
              }
            </div>
            <div className="p-4 flex justify-between border-t border-gray-700">
              <div className="flex gap-2">
                {selectedUrl && (
                  <button onClick={()=>download(selectedUrl, preview.indexOf(selectedUrl))}
                    className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded">
                    Descargar
                  </button>
                )}
                <button onClick={()=>preview.forEach((u,i)=>download(u,i))}
                  className="px-3 py-1 bg-green-600/20 text-green-400 rounded">
                  Descargar todas
                </button>
              </div>
              <button onClick={()=>setPreview([])}
                className="px-3 py-1 bg-gray-800 text-white rounded">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
