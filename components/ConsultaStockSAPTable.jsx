import React, { useState } from 'react';

const ConsultaStockComponent = () => {
    const [results, setResults] = useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`/api/productsTableWoo`);
            
            if (response.ok) {
                const data = await response.json();
                setResults(data);
                console.log("la respuesta", data);
            } else {
                console.error('Error al obtener los datos del servidor');
            }
        } catch (error) {
            console.error('Error al obtener los datos del servidor', error);
        }
    };

    return (
        <div className="bg-gray-300 w-full mt-4 text-gray-900 dark:bg-gray-900 dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2 z-50">
            <h1 className="flex flex-col justify-center mx-4 my-2 text-xl font-semibold">Consulta de Stock</h1>

            <div className="mt-4">
                <button
                    className="bg-purple-300 text-gray-900 dark:bg-purple-900 dark:text-gray-200 w-full p-4 rounded-lg shadow-md mx-2 my-2"
                    onClick={handleSubmit}
                    aria-label='search'
                >
                    Consultar
                </button>
            </div>

            {results && results.length > 0 && (
                <div className="mt-4 w-full">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 ">Resultados:</h2>
                    <table className="table-auto w-full">
                        <thead>
                            <tr>
                                <th className="px-4 py-2">Material</th>
                                <th className="px-4 py-2">Nombre</th>
                                <th className="px-4 py-2">Stock Total</th>
                                <th className="px-4 py-2">Stock Comp.</th>
                                <th className="px-4 py-2">Stock Disp.</th>
                                
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((result, index) => (
                                <tr key={index}>
                                    <td className="border px-4 py-2">{result.sku}</td>
                                    <td className="border px-4 py-2">{result.name}</td>
                                    <td className="border px-4 py-2">{result.quantity}</td>
                                    <td className="border px-4 py-2">{result.comprometido}</td>
                                    <td className="border px-4 py-2">{result.disponible}</td>
                                    
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ConsultaStockComponent;
