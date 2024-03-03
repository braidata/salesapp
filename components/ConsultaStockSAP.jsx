import React, { useState, useEffect } from 'react';
import StockTable from './StockTable';

const ConsultaStockComponent = () => {
    const [page, setPage] = useState(1);
    const [showNextButton, setShowNextButton] = useState(true);
    const [loading, setLoading] = useState(false);

    const [values, setValues] = useState({
        Material: '',
        werks: '',
        lgort: '',
    });

    const [results, setResults] = useState(null);




    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPage(1)
        setShowNextButton(true)
        setValues({
            ...values,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const queryParams = new URLSearchParams({ ...values, page }).toString();

        try {
            const response = await fetch(`/api/apiSAPStock?${queryParams}`);

            if (response.ok) {
                let data = await response.json();
                if (data.length === 0) {
                    setPage(1)
                    setLoading(false)
                    setShowNextButton(false)
                    return
                }
                console.log("tamaños", data.length)
                // Filtra los resultados para excluir filas donde 'stock_disp', 'stock_Comp', y 'labst' son 0
                data = data.filter(row => row.labst !== "0.000");
                // Ordena los resultados filtrados por 'stock_disp' de mayor a menor
                data.sort((a, b) => b.stock_disp - a.stock_disp);
                setResults(data);
                setLoading(false);

                //setShowNextButton(data.length > 1);
            } else {
                console.error('Error al enviar valores al servidor');
            }
        } catch (error) {
            console.error('Error al enviar valores al servidor', error);
        }
    };


    return (
        <div className="backdrop-blur-sm z-20">
            <div style={{ maxHeight: '600px', overflowY: 'auto' }} className="bg-gray-300 mt-4 text-gray-900 dark:bg-gray-900/50 dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2 z-50 ">
                <h1 className=" text-xl font-semibold">Consulta de Stock</h1>
                <form onSubmit={handleSubmit}>
                    <div class="flex flex-col md:flex-row justify-end">

                        <div className="flex flex-col gap-2 ">
                            <label className=" text-gray-900 dark:text-gray-200">Material:</label>
                            <input
                                className="bg-gray-300 text-gray-900 dark:text-gray-200 dark:bg-gray-700  p-4 rounded-lg shadow-md mx-2 my-2"
                                type="text"
                                name="Material"
                                value={values.Material}
                                onChange={handleInputChange}
                            />
                        </div>

                        {/* Agregamos los otros dos campos que espera la API */}
                        <div className="flex flex-col gap-2 ">
                            <label className=" text-gray-900 dark:text-gray-200">Centro:</label>
                            <input
                                className="bg-gray-300 text-gray-900 dark:bg-gray-700 dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2"
                                type="text"
                                name="werks"
                                value={values.werks}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="flex flex-col gap-2 ">
                            <label className=" text-gray-900 dark:text-gray-200">Almacén:</label>
                            <input
                                className="bg-gray-300 text-gray-900 dark:bg-gray-700 dark:text-gray-200 p-4 rounded-lg shadow-md mx-2 my-2"
                                type="text"
                                name="lgort"
                                value={values.lgort}
                                onChange={handleInputChange}
                            />
                        </div>

                        <button
                            type="submit"
                            style={{ maxWidth: '200px' }}
                            className="bg-purple-400 text-gray-900 dark:bg-purple-700 dark:text-gray-200 rounded-lg shadow-md max-h-16 ml-4 mx-2 my-2"
                        >
                            Consultar
                        </button>





                    </div>

                    {results && results.length > 0 && ( // Verifica que 'results' sea un array y tenga elementos.
                        console.log("tamaño", results.length),
                        <div  >
                            <h2 className=" text-gray-900 dark:text-gray-200">Resultados:</h2>

                            <StockTable data={results} />
                            <div className="flex flex-row gap-2">
                                <button
                                    onClick={() => {
                                        setPage((prevPage) => Math.max(prevPage - 1, 1));
                                    }}
                                    disabled={page === 1 || !showNextButton}
                                    style={{ display: showNextButton ? "inline" : "none" }}
                                >
                                    Anterior
                                </button>
                                <div className="flex flex-col gap-2">
                                    <span className="w-48 mx-2 my-2 p-2">Página {page}</span>
                                    {loading ? <span className="w-48 mx-2 my-2 p-2"> Cargando...</span> : null}
                                    {results.length > 0 ? <span className="w-48 mx-2 my-2 p-2"> Tamaño de Página: {results.length}</span> : null}
                                </div>
                                <button
                                    onClick={() => { setPage((prevPage) => prevPage + 1), setLoading(true) }}
                                    disabled={!showNextButton}
                                    style={{ display: showNextButton ? "inline" : "none" }}
                                >
                                    Siguiente
                                </button>
                            </div>

                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ConsultaStockComponent;
