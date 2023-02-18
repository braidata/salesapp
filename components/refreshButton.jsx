//nextjs tailwind refresh button component

import React from "react";

export default function RefreshButton ({functions})  {
    return (
        
        //refresh button+icon
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-24">
            
            <button
        onClick={functions}
        className="bg-gradient-to-r from-rose-600/20 via-yellow-200/30 to-orange-800/40 border-2 drop-shadow-[0_10px_10px_rgba(155,0,0,0.75)]  border-yellow-800 hover:bg-pink-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-rose-400/50 dark:via-yellow-200/40 dark:to-orange-200/80 dark:focus:bg-gradient-to-r dark:focus:from-rose-200/50 dark:focus:via-yellow-100/40 dark:focus:to-orange-100/80 border-2 dark:drop-shadow-[0_10px_10px_rgba(255,0,0,0.25)]  dark:border-rose-200 dark:hover:bg-rose-900 dark:text-gray-200 font-bold py-2 px-4 transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
        type="submit"
        title="Cuidado, refrescarás todo el sitio y perderás los datos ingresados"
      >
        Refrescar
      </button>
        </div>
    );
}

