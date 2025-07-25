import React, { useState } from 'react';
import ConsultaStockSAP from "../components/ConsultaStockSAP";
import SelectProductos from './selectProductsFinder';

const ModalConsultaStock = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    return (
        <div className="relative">
            <button onClick={toggleModal} aria-label="stock" className="mt-2 mb-5 bg-gradient-to-r from-teal-600/40 to-teal-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)]  border-teal-800 hover:bg-teal-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-teal-400/50 dark:to-teal-600/50 border-2 dark:drop-shadow-[0_5px_5px_rgba(0,255,255,0.25)]  dark:border-teal-200 dark:hover:bg-teal-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-0 hover:skew-x-0 hover:skew-y-0 hover:scale-105 focus:-rotate-0 focus:-skew-x-0 focus:-skew-y-0 focus:scale-90 transition duration-500 origin-center">
                Consulta de Stock
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 w-full h-full z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 w-full h-full bg-black opacity-50" onClick={toggleModal}></div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 w-full max-w-md md:max-w-4xl lg:max-w-5xl overflow-hidden relative">
                        <div className="p-2 border-b border-gray-300 dark:border-gray-700">
                            {/*<h2 className="top-4 text-xl font-semibold dark:text-gray-300">Consulta de Stock</h2>*/}
                             <button
                                onClick={toggleModal}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                                aria-label="Cerrar"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button> 
                        </div>
                        <div className="p-4 max-h-[80vh] overflow-y-auto">
                            {/* <SelectProductos /> */}
                            <ConsultaStockSAP />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModalConsultaStock;

