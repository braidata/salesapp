"use client"

import React, { useState } from "react";

interface BotonFacturaProps {
  febosId: string;
}

export default function BotonFactura({ febosId }: BotonFacturaProps) {
  const [loading, setLoading] = useState(false);

  const viewDocument = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/febos?id=${id}`);
      if (!response.ok) throw new Error("Error al obtener el documento de Febos");
      const data = await response.json();
      window.open(data.imagenLink, "_blank");
    } catch (error) {
      console.error("Error al obtener el documento de Febos:", error);
      alert("Error al cargar la DTE");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={() => viewDocument(febosId)}
      disabled={loading}
      className="px-3 py-1 text-sm rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-400" />
      ) : (
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
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      )}
      <span>{loading ? "Cargando..." : "Ver DTE"}</span>
    </button>
  );
}