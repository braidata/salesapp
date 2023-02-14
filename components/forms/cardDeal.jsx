//tailwind deal order card component

//nextjs tailwind deal order card component

import React from "react";
import { useState, useEffect, useRef } from "react";
import FormatContext from "../../lib/formatContext";
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
  const [show, setShow] = useState(false);
  const refE2 = useRef();
  const status = isDisabled;
  const [nameD, setName] = useState("Seleccionar");
  const [clicks, setClicks] = useState(1);
  //console.log("lA REFE", refE2 != null ? refE2 : "no hay ref")

  const sendingShow = () => {
    setShow(true);
  };

  const nameChanger = () => {
    setClicks(clicks + 1);
    setName("Validar");
    clicks >= 2 ? setName("Cargar") : setName("Validar");
    clicks === 3 && setName("Siguiente");
    clicks >= 4 && setName("Cargado");
    console.log("Cuántos clicks: ", clicks);

    clicks >= 4 ? setIsDisabled(true) : setIsDisabled(false);
    clicks >= 4 ? setShow(true) : setShow(false);
  };

  const handleClick = () => {
    nameChanger();
    sendFunction;
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
    >       {/* deal card cristal glow transparent*/}
      <div className="flex flex-col items-center justify-center w-full h-full rounded-lg bg-gray-100 dark:bg-gray-800 shadow-lg p-2.5 
      ">
        {/* deal card cristal glow transparent*/}
        <table className="rounded-lg mt-1 w-full h-full px-2 py-2">
          <thead className="px-2 py-2 w-full rounded-lg text-gray-800 dark:text-gray-300 text-sm font-semibold text-center border-b border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800">
         
            <tr className="px-2 py-2 w-full rounded-lg bg-gray-300 dark:bg-gray-700">
              <th className="text-center mr-4 text-md text-bold rounded-sm px-4 py-3">
                Nombre
              </th>
              <th className=" text-center mr-4 text-md text-bold rounded-sm px-4 py-3">
                ID
              </th>
              <th className=" text-center mr-4 text-md text-bold rounded-sm px-4 py-3">
                Etapa
              </th>
              <th className=" text-center mr-4 text-md text-bold rounded-sm px-4 py-3">
                Monto
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="px-2 py-2 w-full rounded-lg mb-8 bg-gray-200 dark:bg-gray-700">
              <td className="px-2 py-2 text-center mr-4 mt-4 text-sm">{name} </td>

              <td
                className="px-2 py-2 text-center mr-4 mt-4 text-sm"
                key={id}
                value={id}
                ref={refE2}
              >
                {id}
              </td>

              <td className="px-2 py-2 text-center mr-4 mt-4 text-sm">{stage}</td>

              <td className="px-2 py-2 text-center mr-4 mt-4 text-sm">{amount}</td>
            </tr>
          </tbody>
        </table>
        {/* codigo para enviar seleccionar o editar este id de negocio y enviar */}
        <div className="flex flex-row items-center justify-center gap-2">
          {/* hacer los botones pequeños medianos */}
          <form onSubmit={sendFunction}>
            <label
              className="text-gray-700 dark:text-gray-200"
              htmlFor={
                refE2.current != null ? refE2.current.innerHTML : "no hay ref"
              }
            ></label>

            <button
              type="submit"
              onClick={handleClick}
              disabled={status}
              className={`mt-2 mb-5 text-gray-800 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50  dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-4 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:border-opacity-50 dark:hover:bg-sky-600/50 dark:text-gray-200 font-bold py-2 px-4 rounded-full
               
               ${
                status
                  ? "invisible"
                  : "hover:bg-blue-800/90"
              }`}
            >
              {nameD}
            </button>

            {show ? <FormatContext context={context}  componente={comp}/> : null}
          </form>

          {/* <button className="bg-blue-500 hover:bg-blue-700 text-gray-800 font-bold py-4 px-4 rounded-sm w-1 h-16 dark:text-gray-800">
                    Editar
                </button> */}
        </div>
      </div>
      {/* {show ? comp : null} */}
    </div>
  );
}
