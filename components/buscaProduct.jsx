import React, { useState } from 'react';

export default function Products() {
  const [resultos, setResultos] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const data = {
      sku: event.target.sku.value
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      setResultos(result);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="bg-gray-800 min-h-screen text-white mt-24">
        <div className="max-w-md mx-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="sku" className="block text-sm font-medium">SKU</label>
              <input type="text" id="sku" name="sku" required className="w-full px-3 py-2 border rounded-md bg-gray-700 text-white border-gray-600 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />

              <button type="submit" className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 focus:ring-offset-indigo-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2  rounded-lg ">
                Buscar
              </button>
            </div>
          </form>

          {resultos && (
          <div className="mt-4">
            <table className="min-w-full bg-white text-black">
              <thead>
                <tr>
                  <th className="px-4 py-2">SKU</th>
                  <th className="px-4 py-2">ID</th>
                </tr>
              </thead>
              <tbody className="bg-gray-700">
                {Object.entries(resultos).map(([sku, id]) => (
                  <tr key={sku}>
                    <td className="border px-4 py-2">{sku}</td>
                    <td className="border px-4 py-2">{id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && <p className="mt-4 text-red-500">Error: {error}</p>}
      </div>
    </div>
  </>
)

} 

// agregar opción de descuento en $$$ monto fijo. 
// probar caso de productos que no están en SAP

// UIUX agregar divisor visual entre productos y reducir tamaño de campos y padding
// validación de tipo de despacho
// sumatoria de totales de productos
// busqueda de pedidos por rut o nombre de cliente o mail

