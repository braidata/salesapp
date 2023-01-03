//nextjs tailwind order table component
import TableWidget from "../components/tableWidget";
import React from "react";

const ProductTable = ({ keyN, value, value2, component}) => {
  return (
    <div className="p-2 overflow-x-auto flex mt-2 mb-2 shadow-md rounded-lg dark:bg-gray-600">
      <table  className="min-w-full max-h-md mt-4 mb-4 rounded-lg text-sm text-left text-gray-700 dark:text-gray-300">
        <thead className="mt-1 mb-1 rounded-lg bg-gray-100 dark:bg-gray-800/75">
          <tr className="bg-white  mt-1 mb-1 rounded-lg  dark:bg-gray-900 dark:border-gray-700">
          <th
              
              className="text-center relative mb-8 ml-8 p-1 rounded-md bg-gray-200  dark:bg-gray-800 dark:border-gray-500/75"
            >
              {keyN}
            </th>
            </tr>
          </thead>
          <br />
          
        <tbody>
          <tr className="rounded-lg bg-gray-100 divide-x dark:bg-gray-800/75 dark:border-gray-700">
          {component}

           {value && value.map(
              (item) => (
                <th className="rounded-md py-1 border-b px-1 text-center text-sm dark:border-gray-600" >{item}</th>
              )
            )}
            </tr>
            <tr className="rounded-sm bg-white border-b divide-x dark:bg-gray-700/75 dark:border-gray-700">
           {value2 && value2.map(
              (item) => (
                <td className="rounded-md border-b py-1 px-1 text-sm text-justify dark:border-gray-500" >{item}</td>
              )
            )}
            
            
            
          </tr>
          
        </tbody>
      </table>
    </div>

  );
};

export default ProductTable;