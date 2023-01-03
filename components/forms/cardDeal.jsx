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
    clicks >= 2 ? setName("Enviar") : setName("Validar");
    clicks === 3 && setName("Finalizar");
    clicks >= 4 && setName("Enviado");
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
      className="flex flex-col items-center justify-center w-full h-full"
    >
      <div className="flex flex-col items-center justify-center w-full h-full">
        {/* deal card */}
        <table className="rounded-lg mt-1 w-full h-full">
          <thead className="w-full rounded-lg text-gray-800 dark:text-gray-300 text-sm font-semibold">
            <tr className="w-full rounded-lg bg-gray-300 dark:bg-gray-800">
              <th className=" text-center mr-4 text-md text-bold rounded-sm px-4 py-3">
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
            <tr className="w-full rounded-lg mb-8 bg-gray-200 dark:bg-gray-700">
              <td className="text-center mr-4 mt-4 text-sm">{name} </td>

              <td
                className="text-center mr-4 mt-4 text-sm"
                key={id}
                value={id}
                ref={refE2}
              >
                {id}
              </td>

              <td className="text-center mr-4 mt-4 text-sm">{stage}</td>

              <td className="text-center mr-4 mt-4 text-sm">{amount}</td>
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
              className={`bg-blue-900/90  text-gray-800 font-bold py-2 px-2 mt-12 rounded-sm w-1 h-14 dark:bg-blue-600/20 dark:hover:bg-blue-400/20 dark:text-gray-800 ${
                status
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-blue-800/90"
              }`}
            >
              {nameD}
            </button>

            {show ? comp : null}
          </form>

          {/* <button className="bg-blue-500 hover:bg-blue-700 text-gray-800 font-bold py-4 px-4 rounded-sm w-1 h-16 dark:text-gray-800">
                    Editar
                </button> */}
        </div>
      </div>
      {show ? <FormatContext context={context}/> : null}
    </div>
  );
}
