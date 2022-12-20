//copy table content button component

import React from "react";

const CopyButton = ({ text }) => {
  return (
    <button
      className="mt-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      onClick={() => {
        navigator.clipboard.writeText(text);
      }}
    >
      Copiar Tabla
    </button>
  );
};

export default CopyButton;
