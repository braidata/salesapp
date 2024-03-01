import React, { useState } from 'react';
import StockTable from './StockTable';

const ConsultaStockComponent = () => {
    const [values, setValues] = useState({
        Material: '',
        werks: '',
        lgort: '',
    });

    const [results, setResults] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setValues({
            ...values,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const queryParams = new URLSearchParams(values).toString();
    
        try {
            const response = await fetch(`/api/apiSAPStock?${queryParams}`);
    
            if (response.ok) {
                let data = await response.json();
                // Filtra los resultados para excluir filas donde 'stock_disp', 'stock_Comp', y 'labst' son 0
                data = data.filter(row => row.stock_disp !== "0.000" && row.stock_Comp !== "0.000" && row.labst !== "0.000");
                // Ordena los resultados filtrados por 'stock_disp' de mayor a menor
                data.sort((a, b) => b.stock_disp - a.stock_disp);
                setResults(data);
            } else {
                console.error('Error al enviar valores al servidor');
            }
        } catch (error) {
            console.error('Error al enviar valores al servidor', error);
        }
    };
    

    return (
        <div style={{ maxHeight: '600px', overflowY: 'auto' }} className="bg-gray-300 w-full mt-4 text-gray-900 dark:bg-gray-900 dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2 z-50">
            <h1 className="flex flex-col justify-center mx-4 my-2 text-xl font-semibold">Consulta de Stock</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label className="flex flex-col justify-center mx-4 my-2 text-gray-900 dark:text-gray-200">Material:</label>
                    <input
                        className="bg-gray-300 text-gray-900 dark:text-gray-200 dark:bg-gray-700 w-full  p-4 rounded-lg shadow-md mx-2 my-2"
                        type="text"
                        name="Material"
                        value={values.Material}
                        onChange={handleInputChange}
                    />

                    {/* Agregamos los otros dos campos que espera la API */}
                    <label className="flex flex-col justify-center mx-4 my-2 text-gray-900 dark:text-gray-200">Centro:</label>
                    <input
                        className="bg-gray-300 text-gray-900 dark:bg-gray-700 w-full dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2"
                        type="text"
                        name="werks"
                        value={values.werks}
                        onChange={handleInputChange}
                    />

                    <label className="flex flex-col justify-center mx-4 my-2 text-gray-900 dark:text-gray-200">Almacén:</label>
                    <input
                        className="bg-gray-300 text-gray-900 dark:bg-gray-700 w-full dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2"
                        type="text"
                        name="lgort"
                        value={values.lgort}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="mt-4">
                    <button
                        type="submit"
                        className="bg-purple-300 text-gray-900 dark:bg-purple-900 dark:text-gray-200 w-full p-4 rounded-lg shadow-md mx-2 my-2"
                    >
                        Consultar
                    </button>
                </div>
            </form>

            {results && results.length > 0 && ( // Verifica que 'results' sea un array y tenga elementos.
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    <h2 className="flex flex-col justify-center mx-4 my-2 text-gray-900 dark:text-gray-200">Resultados:</h2>
                    <StockTable data={results}/>
                    {/* <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th>Material</th>
                                <th>Nombre</th>
                                <th>Centro</th>
                                <th>Almacen</th>
                                <th>Stock Total</th>
                                <th>Stock Disp.</th>
                                <th>Stock Comp.</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {results.map((result, index) => ( // Itera sobre el array 'results'.
                                <tr key={index}> 
                                    <td>{result.Material}</td>
                                    <td>{result.MaterialName}</td>
                                    <td>{result.werks}</td>
                                    <td>{result.lgort}</td>
                                    <td>{result.labst}</td>
                                    <td>{result.stock_disp}</td>
                                    <td>{result.stock_Comp}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table> */}
                </div>
            )}
        </div>
    );
};

export default ConsultaStockComponent;
