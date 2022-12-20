import React from "react";

export default function AtomForm ({campo, detalle, type} )  {
  return (
    // componentes de tailwind prueba
    //funcionará
    <div className="flex flex-col justify-center items-center">
      <form className="flex flex-col justify-center items-center">
      <label className="text-gray-500">{campo}</label>
      <input className="border-2 border-gray-300 p-2 rounded-md" placeholder={detalle} type={type} />
      </form>
    </div>
  );
};

