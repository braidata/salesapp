//nextjs tailwind refresh button component

import React from "react";

export default function RefreshButton ({functions})  {
    return (
        
        //refresh button+icon
        <div className="flex flex-col justify-center items-center">
            
            <button
        onClick={functions}
        className="mt-2 mb-5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        type="submit"
        title="Cuidado, refrescarás todo el sitio y perderás los datos ingresados"
      >
        Refrescar
      </button>
        </div>
    );
}

