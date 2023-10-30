import React, { useState } from 'react';

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
                const data = await response.json();
                setResults(data);
            } else {
                console.error('Error al enviar valores al servidor');
            }
        } catch (error) {
            console.error('Error al enviar valores al servidor', error);
        }
    };

    return (
        <div className="bg-gray-300 w-full mt-4 text-gray-900 dark:bg-gray-900 dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2 z-50">
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

            {results && (
                <div className="mt-4 w-full">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 ">Resultados:</h2>
                    <table className="table-auto w-full">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 hidden md:block">Material</th>
                                <th className='px-4 py-2'>Nombre</th>
                                <th className="px-4 py-2 hidden md:block">Centro</th>
                                <th className="px-4 py-2">Almacen</th>
                                <th className="px-4 py-2 hidden md:block">Stock Total</th>
                                <th className='px-4 py-2'>Stock Disp.</th>
                                <th className="px-4 py-2 hidden md:block">Stock Comp.</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border px-4 py-2 hidden md:block">{results.Material}</td>
                                <td className="border px-4 py-2">{results.MaterialName}</td>
                                <td className="border px-4 py-2 hidden md:block">{results.werks}</td>
                                <td className="border px-4 py-2">{results.lgort}</td>
                                <td className="border px-4 py-2 hidden md:block">{results.labst}</td>
                                <td className="border px-4 py-2">{results.stock_disp}</td>
                                <td className="border px-4 py-2 hidden md:block">{results.stock_Comp}</td>
                            </tr>
                        </tbody>
                    </table>

                </div>
            )}
        </div>
    );
};

export default ConsultaStockComponent;
