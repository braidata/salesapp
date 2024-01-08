import React from "react";
import { useState, useEffect, useRef } from "react";
import FormatContext from "../../lib/formatContext";
import SpinnerButton from "../spinnerButton";


export default function DealCard({
  name,
  id,
  stage,
  amount,
  sendFunction,
  editFunction,
  refE,
  index,
  comp,
  context,
}) {
  const [isDisabled, setIsDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [show, setShow] = useState(false);
  const refE2 = useRef();
  const [nameD, setName] = useState("Seleccionar");
  const [clicks, setClicks] = useState(1);

  const nameChanger = () => {
    setClicks(prevClicks => prevClicks + 1);
    
    if (clicks === 1) {
      setName("Validar");
    } else if (clicks === 2) {
      setIsLoading(true);
      setTimeout(() => {setIsLoading(false)}, 6000)

      setName("Cargar");



    } else if (clicks === 3) {
      setIsLoading(true);
      setTimeout(() => {setIsLoading(false)}, 6000)

      setName("Siguiente");

    } else if (clicks === 4) {
      setIsDisabled(true);
      setIsLoading(true);
      setTimeout(() => {setIsLoading(false),setShow(true);}, 6000)
      
    }
  };

  const handleClick = (event) => {
    event.preventDefault();
    nameChanger();
    sendFunction(event.target.id);

  };


  useEffect(
    (index) => {
      refE2.current[index];
    },
    [refE2]
  );

  return (
    <div
      key={id}
      className="flex flex-col items-center justify-center w-full h-full rounded-lg bg-gray-100 dark:bg-gray-800 shadow-lg p-2.5"
    >
      <div className="flex flex-col items-center justify-center h-full rounded-lg bg-gray-100 dark:bg-gray-800 shadow-lg p-2.5">
        <table className="mt-1 max-w-min h-full px-2 py-2 z-40 shadow-lg">
          <thead className="px-2 py-2 text-gray-800 dark:text-gray-200 text-sm font-semibold text-center border-b border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800">
            <tr className="px-2 py-2 bg-gray-300 dark:bg-gray-700 rounded-tl-lg">
              <th className="px-2 py-2 rounded-tl-lg flex flex-col text-center max-w-min mr-1 text-sm text-bold">Nombre</th>
              <th className="text-center mr-2 text-md text-bold px-4 py-3">ID</th>
              <th className="hidden lg:block text-center mr-2 text-md text-bold px-4 py-3">Etapa</th>
              <th className="text-center mr-2 text-md text-bold px-4 py-3">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr className="max-w-screen-sm mb-8 bg-gray-200 dark:bg-gray-800 opacity-60 text-gray-900 dark:text-white text-sm">
              <td className="px-2 py-2 text-justify mr-2 mt-2 rounded-bl-lg">{name}</td>
              <td className="px-2 py-2 text-center mr-2 mt-4" key={id} value={id} ref={refE2}>{id}</td>
              <td className="hidden lg:block px-2 py-2 text-center mr-2 mt-4">{stage}</td>
              <td className="px-2 py-2 text-center mr-2 mt-4 rounded-br-lg">{amount}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex flex-row items-center justify-center gap-2">
          <form onSubmit={sendFunction}>
            <label
              className="text-gray-700 dark:text-gray-200"
              htmlFor={refE2.current ? refE2.current.innerHTML : "no hay ref"}
            ></label>
            {isLoading ? (
              <SpinnerButton texto="Cargando..." />
            ) : (
              <button
                type="submit"
                onClick={handleClick}
                disabled={show}
                className={`mt-2 mb-5 text-gray-800 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)] border-sky-800 hover:bg-sky-600/50 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-4 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)] dark:border-sky-200 dark:border-opacity-50 dark:hover:bg-sky-600/50 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-0 hover:skew-x-0 hover:skew-y-0 hover:scale-105 focus:-rotate-0 focus:-skew-x-0 focus:-skew-y-0 focus:scale-90 transition duration-500 origin-center ${show ? "hidden" : "hover:bg-blue-800/90"}`}
              >
                {nameD}
              </button>
            )}
            {show ? <FormatContext context={context} componente={comp} /> : null}
          </form>
        </div>
      </div>
    </div>
  );
}



