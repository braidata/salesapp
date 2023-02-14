import { useEffect, useRef } from 'react';


const SuccessMessage = () => {

    return (
        <div className="flex flex-col text-center items-center justify-center w-full h-full mt-5">
            {/* order send succes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-96">
                <div className="flex items-center justify-center">
                    {/* <span className="text-green-500">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">

                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.536-11.464a1 1 0 00-1.414 0L8 9.586 6.879 8.464a1 1 0 10-1.414 1.414l1.121 1.121a1 1 0 001.414 0l3.536-3.536a1 1 0 000-1.414z" clipRule="evenodd"></path>

                        </svg>
                    </span> */}
                </div>
                <div className="dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
      mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
      border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]">
                    <h1 className="text-xl text-center font-semibold text-gray-700 dark:text-gray-200">Orden Enviada</h1>
                    <p className="mt-2 text-center text-gray-600 dark:text-gray-400">La orden se ha enviado correctamente.</p>
                </div>
            </div>
        </div>
    );
};

export default SuccessMessage;