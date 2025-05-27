// pages/bbq-grill-export.tsx

import React, { useState } from 'react';

const BBQGrillExport: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  // Función para exportar directamente a Excel
  const exportarExcel = async () => {
    try {
      // Validar que al menos una fecha esté especificada
      if (!fechaInicio && !fechaFin) {
        setError(true);
        setMensaje('Por favor, especifique al menos una fecha');
        return;
      }

      setLoading(true);
      setError(false);
      setMensaje('Procesando solicitud...');

      // Construir la URL para la API de exportación a Excel
      let apiUrl = '/api/apiSqlBBQ';
      const params = new URLSearchParams();
      
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);
      
      if (params.toString()) {
        apiUrl += `?${params.toString()}`;
      }

      // Usar window.open para descargar el Excel directamente
      // Esto evita el error de JSON al intentar procesar una respuesta binaria
      window.open(apiUrl, '_blank');
      
      setMensaje('La descarga debería comenzar automáticamente');
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setError(true);
      setMensaje(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4 text-center">Exportar Datos BBQ GRILL</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Fecha Inicio:</label>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Fecha Fin:</label>
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <button
        onClick={exportarExcel}
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded disabled:bg-blue-300"
      >
        {loading ? 'Procesando...' : 'Exportar a Excel'}
      </button>
      
      {mensaje && (
        <div className={`mt-4 p-3 rounded ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {mensaje}
        </div>
      )}
    </div>
  );
};

export default BBQGrillExport;