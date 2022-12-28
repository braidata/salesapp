//tailwind deal order card component

//nextjs tailwind deal order card component

import React from "react";
import { useState, useRef } from "react";

export default function DealCard({ name, id, stage, amount, sendFunction, editFunction, refE, index, comp}) {
  const [show, setShow] = useState(false);

  const sendingShow = () => {
    setShow(true);
  };


    return (
        <div key={id} className="flex flex-col items-center justify-center w-full h-full">
        <div  className="flex flex-col items-center justify-center w-full h-full">
        {/* deal card */}
            <table className=" mt-2 w-full h-full">
            <thead className=" text-gray-600 text-sm font-semibold">
                <tr className="bg-gray-200 dark:bg-gray-800">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Etapa</th>
                <th className="px-4 py-3">Monto</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    
                <td >{name} </td>
    
                <td  ref={refE
                }>{id}</td>
    
                <td >{stage}</td>
    
                <td >{amount}</td>
                </tr>
            </tbody>
            </table>
            {/* codigo para enviar seleccionar o editar este id de negocio y enviar */}
            <div className="flex flex-row items-center justify-center gap-2">
                {/* hacer los botones pequeños medianos */}
                <form onSubmit={sendFunction}>
            <button onClick={sendingShow} className="bg-blue-500 hover:bg-blue-700 text-gray-800 font-bold py-4 px-4 rounded-sm w-1 h-16 dark:text-gray-800">
                   
                    Enviar
                </button>
                { show ? comp : null}
                </form>
                
                
                {/* <button className="bg-blue-500 hover:bg-blue-700 text-gray-800 font-bold py-4 px-4 rounded-sm w-1 h-16 dark:text-gray-800">
                    Editar
                </button> */}
                   </div>
                   
        </div>
        </div>
    );
    }










