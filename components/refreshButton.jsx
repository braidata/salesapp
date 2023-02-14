//nextjs tailwind refresh button component

import React from "react";

export default function RefreshButton ({functions})  {
    return (
        
        //refresh button+icon
        <div className="flex flex-col justify-center items-center w-96 mt-24 sm:w-full">
            
            <button
        onClick={functions}
        className="bg-gradient-to-r from-yellow-600/40 to-yellow-800/40 border-2 drop-shadow-[0_10px_10px_rgba(155,0,0,0.75)]  border-yellow-800 hover:bg-yellow-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-yellow-200/40 dark:to-yellow-400/40 border-2 dark:drop-shadow-[0_10px_10px_rgba(255,0,0,0.25)]  dark:border-yellow-200 dark:hover:bg-yellow-900 dark:text-gray-200 font-bold py-2 px-4"
        type="submit"
        title="Cuidado, refrescarás todo el sitio y perderás los datos ingresados"
      >
        Refrescar
      </button>
        </div>
    );
}

