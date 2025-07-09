"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

// Interfaces
interface LabelPreview {
  message: string
  data: string[]
  status: number
}

interface ZStarkenProps {
  ordenFlete: string // Directamente el número de orden de flete
  className?: string
}

export default function ZStarken({ ordenFlete, className = "" }: ZStarkenProps) {
  // Estados para manejo de etiquetas
  const [labelPreview, setLabelPreview] = useState<LabelPreview | null>(null)
  const [isLoadingLabel, setIsLoadingLabel] = useState(false)
  const [isLoadingAllLabels, setIsLoadingAllLabels] = useState(false)
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false)
  const [allUrl, setAllUrl] = useState<string | null>(null)
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null)
  const [pdfBlobUrls, setPdfBlobUrls] = useState<{ [key: string]: string }>({})
  const [error, setError] = useState<string | null>(null)

  // Función para obtener etiquetas
  const obtenerEtiquetas = async () => {
    if (!ordenFlete) {
      setError("No hay orden de flete disponible")
      return
    }

    try {
      setIsLoadingLabel(true)
      setError(null)
      
      const response = await fetch('/api/starken/processEtiqueta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ordenFlete,
          tipoSalida: 3,
          combineAll: false
        }),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron obtener las etiquetas`)
      }

      const data = await response.json()
      setLabelPreview(data)
      setIsLabelModalOpen(true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener etiquetas'
      setError(errorMessage)
      console.error('Error:', error)
    } finally {
      setIsLoadingLabel(false)
    }
  }

  // Efecto para obtener todas las etiquetas cuando se abre el preview
  useEffect(() => {
    if (!labelPreview || !ordenFlete) return

    (async () => {
      try {
        setIsLoadingAllLabels(true)
        const res = await fetch('/api/starken/processEtiqueta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ordenFlete,
            tipoSalida: 3,
            combineAll: true
          })
        })
        
        if (res.ok) {
          const json = await res.json()
          setAllUrl(json.data[0])
        } else {
          setAllUrl(null)
        }
      } catch {
        setAllUrl(null)
      } finally {
        setIsLoadingAllLabels(false)
      }
    })()
  }, [labelPreview, ordenFlete])

  // Función para cargar PDF como blob
  const loadPdfAsBlob = async (url: string): Promise<string | null> => {
    try {
      if (url.startsWith("blob:")) {
        return url
      }

      if (url.startsWith("data:application/pdf;base64,")) {
        const base64 = url.split(",")[1]
        const binary = atob(base64)
        const len = binary.length
        const buf = new Uint8Array(len)
        for (let i = 0; i < len; i++) {
          buf[i] = binary.charCodeAt(i)
        }
        const blob = new Blob([buf], { type: "application/pdf" })
        const blobUrl = window.URL.createObjectURL(blob)
        setPdfBlobUrls((prev) => ({ ...prev, [url]: blobUrl }))
        return blobUrl
      }

      if (!pdfBlobUrls[url]) {
        const response = await fetch(url, {
          headers: {
            Authorization: `Basic ${Buffer.from("crm:crm2019").toString("base64")}`,
          },
        })

        if (!response.ok) throw new Error("Error al cargar PDF")
        const blob = await response.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        setPdfBlobUrls((prev) => ({ ...prev, [url]: blobUrl }))
        return blobUrl
      }

      return pdfBlobUrls[url]
    } catch (error) {
      console.error("Error al cargar PDF:", error)
      return null
    }
  }

  // Función para descargar PDF
  const downloadPDF = async (url: string, index: number) => {
    try {
      let blobUrl = url
      if (!url.startsWith("blob:") && !url.startsWith("data:application/pdf")) {
        const response = await fetch(url, {
          headers: {
            Authorization: `Basic ${Buffer.from("crm:crm2019").toString("base64")}`,
          },
        })
        
        if (!response.ok) throw new Error("Error al descargar")
        const blob = await response.blob()
        blobUrl = window.URL.createObjectURL(blob)
      }
      
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `etiqueta_starken_${ordenFlete}_${index + 1}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      if (blobUrl.startsWith("blob:") && blobUrl !== url) {
        window.URL.revokeObjectURL(blobUrl)
      }
    } catch (error) {
      console.error("Error al descargar la etiqueta:", error)
      setError("Error al descargar la etiqueta")
    }
  }

  // Función para descargar todas las etiquetas
  const downloadAllLabels = async () => {
    try {
      const response = await fetch('/api/starken/processEtiqueta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ordenFlete,
          tipoSalida: 3,
          combineAll: true
        })
      })

      if (!response.ok) throw new Error('Error al obtener etiquetas combinadas')

      const data = await response.json()
      if (data.data && data.data[0]) {
        const link = document.createElement('a')
        link.href = data.data[0]
        link.download = `etiquetas_starken_${ordenFlete}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error al descargar todas las etiquetas')
    }
  }

  // Cleanup de blob URLs
  useEffect(() => {
    return () => {
      Object.values(pdfBlobUrls).forEach((url) => {
        window.URL.revokeObjectURL(url)
      })
    }
  }, [pdfBlobUrls])

  // Si no hay orden de flete, no mostrar nada
  if (!ordenFlete) {
    return (
      <div className={`text-gray-400 text-sm ${className}`}>
        Sin orden de flete
      </div>
    )
  }

  return (
    <>
      {/* BOTÓN PRINCIPAL */}
      <div className={`flex items-center gap-2 ${className}`}>
        <p className="text-white text-sm font-mono">
          {ordenFlete}
        </p>
        
        <motion.button
          onClick={obtenerEtiquetas}
          disabled={isLoadingLabel}
          className="px-3 py-1 text-sm rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: isLoadingLabel ? 1 : 1.02 }}
          whileTap={{ scale: isLoadingLabel ? 1 : 0.98 }}
        >
          {isLoadingLabel ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-400"></div>
              Cargando...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L2 6v14a2 2 0 002 2h16a2 2 0 002-2V6l-4-4H6z" />
                <path d="M6 2v4h12V2" />
                <path d="M8 12h8" />
                <path d="M8 16h8" />
              </svg>
              Ver Etiquetas
            </>
          )}
        </motion.button>
      </div>

      {/* Mostrar error si existe */}
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}

      {/* MODAL DE ETIQUETAS */}
      {isLabelModalOpen && labelPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl max-w-4xl w-full h-[80vh]">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">
                Etiquetas Starken - {ordenFlete} ({labelPreview.data.length})
              </h3>
              <button
                onClick={() => {
                  setIsLabelModalOpen(false)
                  setSelectedPdfUrl(null)
                  setError(null)
                }}
                className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="p-4 grid grid-cols-4 gap-4 border-b border-gray-700">
              {isLoadingAllLabels ? (
                <div className="p-2 rounded bg-gray-800 animate-pulse">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-400"></div>
                    <div className="h-4 bg-gray-600 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
              ) : allUrl ? (
                <button
                  onClick={async () => {
                    setSelectedPdfUrl(allUrl)
                    await loadPdfAsBlob(allUrl)
                  }}
                  className={`p-2 rounded text-sm ${selectedPdfUrl === allUrl
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                  Todas las Etiquetas
                </button>
              ) : (
                <div className="p-2 rounded bg-gray-800/50 text-gray-500 text-center text-sm">
                  No disponible
                </div>
              )}

              {labelPreview.data.map((url, index) => (
                <button
                  key={index}
                  onClick={async () => {
                    setSelectedPdfUrl(url)
                    await loadPdfAsBlob(url)
                  }}
                  className={`p-2 rounded text-sm ${selectedPdfUrl === url
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                  Etiqueta {index + 1}
                </button>
              ))}
            </div>

            <div className="flex-1 h-[calc(80vh-420px)] p-4">
              {selectedPdfUrl ? (
                <div className="relative w-full h-full bg-white rounded-lg overflow-y-scroll">
                  {pdfBlobUrls[selectedPdfUrl] ? (
                    <iframe
                      src={pdfBlobUrls[selectedPdfUrl]}
                      className="w-full h-full absolute inset-0"
                      style={{
                        border: "none",
                        backgroundColor: "gray",
                      }}
                      title="PDF Viewer"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Selecciona una etiqueta para visualizarla
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 flex justify-between items-center shrink-0">
              <div className="flex gap-2">
                {selectedPdfUrl && (
                  <button
                    onClick={() => {
                      const idx = labelPreview.data.indexOf(selectedPdfUrl)
                      if (idx >= 0) downloadPDF(selectedPdfUrl, idx)
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Descargar Actual
                  </button>
                )}
                <button
                  onClick={downloadAllLabels}
                  className="px-4 py-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Descargar Todas
                </button>
              </div>
              <button
                onClick={() => {
                  setIsLabelModalOpen(false)
                  setSelectedPdfUrl(null)
                  setError(null)
                }}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}