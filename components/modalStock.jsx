import React, { useState } from 'react';
import ConsultaStockSAP from "../components/ConsultaStockSAP"; // Asegúrate de que la ruta de importación sea la correcta

const ModalConsultaStock = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    return (
        <div className="relative">
            <button onClick={toggleModal} className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-400/50 dark:to-sky-600/50 border-2 dark:drop-shadow-[0_5px_5px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-0 hover:skew-x-0 hover:skew-y-0 hover:scale-105 focus:-rotate-0 focus:-skew-x-0 focus:-skew-y-0 focus:scale-90 transition duration-500 origin-center">
                Consulta de Stock
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 w-full h-full z-50 flex items-center justify-center">
                    {/* Overlay para fondo opaco */}
                    <div className="absolute inset-0 w-full h-full bg-black opacity-50" onClick={toggleModal}></div>

                    {/* Contenido del Modal */}
                    <div className="relative z-10">
                    {/* <div className="absolute top-4 right-24">
                        <button onClick={toggleModal} className="text-yellow-500 hover:text-yellow-600">
                            [X]
                        </button>
                    </div> */}
                        <ConsultaStockSAP />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModalConsultaStock;

