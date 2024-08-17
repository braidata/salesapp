import React, { useState, useEffect } from 'react';
import StockTable from './StockTable';
import SpinnerButton from "./spinnerButton";

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
                
                <form onSubmit={handleSubmit}>
                <h1 className=" text-xl font-semibold mx-4 my-4 p-2">Consulta de Stock</h1>
                    <div className="flex flex-col md:flex-row justify-end rounded-md bg-gray-400/30   p-5 border-b border-gray-300 dark:border-gray-700 dark:bg-gray-800/30  mt-8 mb-8
            ">
                    

                        <div className="flex flex-col gap-2  ">
                            
                            <label className=" text-gray-900 md:max-w-44 lg:max-w-md max-w-80 px-2 py-2 rounded-lg shadow-md md:mx-2 md:my-2 dark:text-gray-200">Material:</label>
                            <input
                                className="bg-gray-300 text-gray-900 md:max-w-44 lg:max-w-md max-w-80 dark:text-gray-200 dark:bg-gray-700  px-2 py-2 rounded-lg shadow-md md:mx-2 md:my-2"
                                type="text"
                                name="Material"
                                value={values.Material}
                                onChange={handleInputChange}
                            />
                        </div>

                        {/* Agregamos los otros dos campos que espera la API */}
                        <div className="flex flex-col gap-2 ">
                            <label className=" text-gray-900 md:max-w-44 lg:max-w-md max-w-80 px-2 py-2 rounded-lg shadow-md md:mx-2 md:my-2 dark:text-gray-200">Centro:</label>
                            <input
                                className="bg-gray-300 text-gray-900 md:max-w-44 lg:max-w-md max-w-80 dark:bg-gray-700 dark:text-gray-200 px-2 py-2 rounded-lg shadow-md md:mx-2 md:my-2"
                                type="text"
                                name="werks"
                                value={values.werks}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="flex flex-col md:justify-evenly gap-2 ">
                            <label className=" text-gray-900 md:max-w-44 lg:max-w-md max-w-80 px-2 py-2 rounded-lg shadow-md md:mx-2 md:my-2 dark:text-gray-200">Almacén:</label>
                            <input
                                className="bg-gray-300 text-gray-900 md:max-w-44 lg:max-w-md max-w-80 dark:bg-gray-700 dark:text-gray-200 px-2 py-2 rounded-lg shadow-md md:mx-2 md:my-2"
                                type="text"
                                name="lgort"
                                value={values.lgort}
                                onChange={handleInputChange}
                            />
                                                    
                        </div>
                        <button
    type="submit"
    aria-label="search"
    className="
        md:mx-2 md:my-2 
        px-2 py-2 
        w-full max-w-80 md:w-auto 
        rounded-lg 
        bg-gray-300/60 dark:bg-gray-800/60  
        text-gray-600 dark:text-green-100/80 
        font-semibold 
        border border-gray-700 hover:border-gray-900 dark:border-gray-400 hover:dark:border-gray-200
        hover:text-gray-200 hover:bg-gray-500/20 
        focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 
        focus:border-transparent 
        drop-shadow-[0_1px_1px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_1px_1px_rgba(0,255,255,0.85)]
    "
    
>
    Consultar
</button>








                    </div>

                    {results && results.length > 0 && ( // Verifica que 'results' sea un array y tenga elementos.
                        
                        <div  >
                            <h2 className=" text-gray-900 dark:text-gray-200">Resultados:</h2>

                            <StockTable data={results} />
                            <div className="flex flex-col md:flex-row max-h-16 gap-2">
                                <button
                                    className="rounded-lg bg-gray-200/30 dark:bg-gray-700/60 text-gray-600 dark:text-green-100/80 font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:hover:bg-gray-700/30 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]"
                                    onClick={() => {
                                        setPage((prevPage) => Math.max(prevPage - 1, 1));
                                    }}
                                    disabled={page === 1 || !showNextButton}
                                    style={{ display: showNextButton ? "inline" : "none" }}
                                >
                                    Anterior
                                </button>
                                <div className="flex flex-col gap-2 mx-4 my-4 rounded-lg bg-gray-300/30 dark:bg-gray-800/30  text-gray-600 dark:text-green-100/80 font-semibold leading-none  dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]">
                                    <span className="w-48 mx-2 my-2 p-2">Página {page}</span>
                                    {loading ? <SpinnerButton texto="Cargando..." /> : null}
                                    {results.length > 0 ? <span className="w-48 mx-2 my-2 p-2"> Tamaño de Página: {results.length}</span> : null}
                                </div>
                                <button
                                    className="rounded-lg bg-gray-200/30 dark:bg-gray-700/60 text-gray-600 dark:text-green-100/80 font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:hover:bg-gray-700/30 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]"
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
