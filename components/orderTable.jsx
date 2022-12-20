//nextjs tailwind order table component

import React from "react";

const OrderTable = () => {
  return (
    <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="py-3 px-6">
              Cliente
            </th>
            <th scope="col" className="py-3 px-6">
              Pedido
            </th>
            <th scope="col" className="py-3 px-6">
              Estado
            </th>
            <th scope="col" className="py-3 px-6">
              Total
            </th>
            <th scope="col" className="py-3 px-6">
              Acción
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
            <th
              scope="row"
              className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white"
            >
              Jorge Céspedes
            </th>
            <td className="py-4 px-6">154848</td>
            <td className="py-4 px-6">Pendiente</td>
            <td className="py-4 px-6">$299.900</td>
            <td className="py-4 px-6">
              <a
                href="#"
                className="font-medium text-blue-600 dark:text-blue-500 hover:underline ml-2"
              >
                Editar
              </a>
              <a
                href="#"
                className="font-medium text-blue-600 dark:text-blue-500 hover:underline ml-2"
              >
                Enviar
              </a>
            </td>
          </tr>
          <tr className="bg-gray-50 border-b dark:bg-gray-800 dark:border-gray-700">
            <th
              scope="row"
              className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white"
            >
              María Julia Blanco
            </th>
            <td className="py-4 px-6">154849</td>
            <td className="py-4 px-6">Procesando</td>
            <td className="py-4 px-6">$1.999.000</td>
            <td className="py-4 px-6">
              <a
                href="#"
                className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
              >
                Ver
              </a>
            </td>
          </tr>
          <tr className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
            <th
              scope="row"
              className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white"
            >
              Pedro Astorga
            </th>
            <td className="py-4 px-6">154850</td>
            <td className="py-4 px-6">Facturado</td>
            <td className="py-4 px-6">$99.000</td>
            <td className="py-4 px-6">
              <a
                href="#"
                className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
              >
                Ver
              </a>
            </td>
          </tr>
          <tr className="bg-gray-50 border-b dark:bg-gray-800 dark:border-gray-700">
            <th
              scope="row"
              className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white"
            >
              Alejandro Gómez
            </th>
            <td className="py-4 px-6">154851</td>
            <td className="py-4 px-6">Completado</td>
            <td className="py-4 px-6">$799.990</td>
            <td className="py-4 px-6">
              <a
                href="#"
                className=" disable font-medium text-blue-600 dark:text-blue-500 hover:underline"
              >
                Ver
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;
