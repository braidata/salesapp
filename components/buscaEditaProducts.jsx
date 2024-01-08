import React, { useState, useEffect } from 'react';

export default function ProductsEditor() {
    const [resultos, setResultos] = useState(null);
    const [fields, setFields] = useState([]);
    const [selectedField, setSelectedField] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        // Cargar los campos disponibles para edición al montar el componente
        async function fetchFields() {
            try {
                const response = await fetch('/api/productsComplet', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ action: 'get' }), // Asumimos que tu API soporta esta acción
                });

                const data = await response.json();
                setFields(data.fields);
            } catch (err) {
                setError(err.message);
            }
        }

        fetchFields();
    }, []);

    function displayValue(value) {
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
        }
        return value;
    }

    function renderValue(value) {
        if (Array.isArray(value)) {
          return (
            <ul>
              {value.map((item, index) => (
                <li key={index}>{renderValue(item)}</li>
              ))}
            </ul>
          );
        } else if (typeof value === 'object' && value !== null) {
          return (
            <table className="min-w-full">
              <tbody>
                {Object.entries(value).map(([key, subValue], index) => (
                  <tr key={index}>
                    <td className="border px-4 py-2">{key}</td>
                    <td className="border px-4 py-2">{renderValue(subValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        } else if (value !== null && value !== undefined) {
          return displayValue(value);
        } else {
          return ''; // Para valores null o undefined, simplemente devolvemos una cadena vacía.
        }
      }
      
      


    const handleSubmit = async (event) => {
        event.preventDefault();
        const sku = event.target.sku.value;

        try {
            const response = await fetch('/api/productsComplet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'get', sku }),
            });

            const result = await response.json();
            setResultos(result);
        } catch (err) {
            setError(err.message);
        }
    }

    const keys = resultos && resultos[0] ? Object.keys(resultos[0]) : [];


    return (
        <>
            <div className="bg-gray-800 min-h-screen text-white mt-24">
                <div className="max-w-md mx-auto p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="sku" className="block text-sm font-medium">SKU</label>
                            <input type="text" id="sku" name="sku" required className="w-full px-3 py-2 border rounded-md bg-gray-700 text-white border-gray-600 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />

                            <label htmlFor="field" className="block mt-4 text-sm font-medium">Campo a editar</label>
                            <select id="field" name="field" value={selectedField} onChange={(e) => setSelectedField(e.target.value)} className="...">
                                {keys.map(key => (
                                    <option key={key} value={key}>{key}</option>
                                ))}
                            </select>


                            <button type="submit" className="w-full mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 focus:ring-offset-indigo-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2  rounded-lg ">
                                Buscar
                            </button>
                        </div>
                    </form>

                    {resultos && (
                        <div className="mt-4">
                            <table className="min-w-full bg-white text-black">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2">Nombre</th>
                                        <th className="px-4 py-2">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-700">
                                    {Object.entries(resultos).map(([sku, item]) => (
                                        <tr key={sku}>
                                            <td className="border px-4 py-2">{sku}</td>
                                            {item && typeof item === 'object' ? Object.values(item).map((value, index) => (
                                                <td key={index} className="border px-4 py-2">{renderValue(value)}</td>
                                            )) : null}
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