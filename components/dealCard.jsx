//nextjs tailwind deal order card component

import React from "react";
import { useState } from "react";

export default function DealCard({ data }) {
  const deals = data;
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {/* deal card */}
      {deals.map(
        (key, value, deal) => (
          console.log("key", key, deal),
          (
            // console.log("value", value),

            //table to show data
            <div className="flex flex-col items-center justify-center w-full h-full">
              <table className=" mt-2 w-full h-full">
                <thead className=" text-gray-600 text-sm font-semibold">
                  <tr className="bg-gray-200 dark:bg-gray-800">
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Apellido</th>
                    <th className="px-4 py-3">Teléfono</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{key.Nombre} </td>

                    <td>{key.Apellido}</td>

                    <td>{key.Telefono}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        )
      )}
    </div>
  );
}
