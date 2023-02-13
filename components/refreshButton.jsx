//nextjs tailwind refresh button component

import React from "react";

export default function RefreshButton ({functions})  {
    return (
        
        //refresh button+icon
        <div className="flex flex-col justify-center items-center">
            
            <button
        onClick={functions}
        className="bg-gradient-to-r from-green-600/40 to-green-800/40 border-2 drop-shadow-[0_10px_10px_rgba(0,155,0,0.75)]  border-green-800 hover:bg-green-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-green-200/40 dark:to-green-400/40 border-2 dark:drop-shadow-[0_10px_10px_rgba(0,255,0,0.25)]  dark:border-green-200 dark:hover:bg-green-900 dark:text-gray-200 font-bold py-2 px-4"
        type="submit"
        title="Cuidado, refrescarás todo el sitio y perderás los datos ingresados"
      >
        Refrescar
      </button>
        </div>
    );
}

