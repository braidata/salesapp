import React, { useState } from 'react';
import ConsultaStockSAP from "../components/ConsultaStockSAP"; // Asegúrate de que la ruta de importación sea la correcta
import SelectProductos from './selectProductsFinder';
const ModalConsultaStock = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    return (
        <div className="relative">

            {/* <SelectProductos/>   */}

            <button onClick={toggleModal} aria-label="stock" className="mt-2 mb-5 bg-gradient-to-r from-teal-600/40 to-teal-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)]  border-teal-800 hover:bg-teal-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-teal-400/50 dark:to-teal-600/50 border-2 dark:drop-shadow-[0_5px_5px_rgba(0,255,255,0.25)]  dark:border-teal-200 dark:hover:bg-teal-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-0 hover:skew-x-0 hover:skew-y-0 hover:scale-105 focus:-rotate-0 focus:-skew-x-0 focus:-skew-y-0 focus:scale-90 transition duration-500 origin-center">
                Consulta de Stock
            </button>

            {isModalOpen && (

                <div className="fixed inset-0 w-full h-full z-50 flex  flex-col items-center justify-center">
                    {/* Overlay para fondo opaco */}

                    <div className="absolute inset-0 w-full h-full bg-black opacity-50" onClick={toggleModal}></div>

                    {/* Contenido del Modal */}
                    <div className="relative z-10">

                    </div>
                    <div className="flex flex-col justify-end rounded-lg z-50 ">

                        <header className="rounded-md flex flex-col justify-end bg-gray-300/90   p-5 border-b border-gray-300 dark:border-gray-700 dark:bg-gray-800/30 
            ">
                            {/* modal-card-title */}
                            
                            <div
                                title="Cerrar"
                                className="rounded-full flex justify-center items-center w-10 h-10 p-2 mx-2 my-2 text-gray-600 dark:text-green-100/80 font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:hover:bg-gray-700/40 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)] transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"

                                aria-label="close"
                                onClick={toggleModal}
                            >X</div>
                            <SelectProductos/>
                            <ConsultaStockSAP />
                            
                            
                        </header>

                        
                    </div>

                </div>
            )}
        </div>
    );
};

export default ModalConsultaStock;

