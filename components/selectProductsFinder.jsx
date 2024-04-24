import React, { useState } from "react";
import Products from "../lib/base_productos";
import { FaTimes, FaCopy } from "react-icons/fa";

const SelectProductos = ({ cuenta }) => {
  const index = cuenta;
  console.log("indexHDP:", index);
  const [filtro, setFiltro] = useState("");
  const [selectedSKU, setSelectedSKU] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [showResults, setShowResults] = useState(false);

  const productosFiltrados = Products.filter(
    (producto) =>
      producto.Nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      producto.SKU.toString().includes(filtro)
  );

  const handleSelectProduct = (producto) => {
    setSelectedSKU(producto.SKU.toString());
    setSelectedName(producto.Nombre);
    setFiltro(producto.Nombre);
    setShowResults(false);
    copyToClipboard(producto.SKU.toString());
  };

  const handleClearSearch = () => {
    setFiltro("");
    setSelectedSKU("");
    setSelectedName("");
    setShowResults(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="px-2">
      <label className="mt-2 text-gray-900 text-md sm:w-full sm:text-lg sm:text-gray-200 text-left bg-gray-400/60 border border-gray-200 text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-blue-500 dark:focus:border-blue-500">
        Consulta de SKU por Nombre
      </label>
      <div className="relative">
        <input
          className="mb-2 bg-gray-300 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg sm:text-gray-200 text-right rounded-sm hover:rounded-md focus:rounded-lg focus:ring-blue-800 focus:border-blue-700 block w-full dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900 pr-10"
          value={filtro}
          onChange={(e) => {
            setFiltro(e.target.value);
            setShowResults(e.target.value.length > 0);
          }}
          placeholder="Buscar por Nombre o SKU"
        />
        {filtro && (
          <button
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={handleClearSearch}
          >
            <FaTimes />
          </button>
        )}
      </div>
      {showResults && (
        <div className="mt-2 max-h-60 overflow-y-auto backdrop-blur-sm">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {productosFiltrados.map((producto) => (
              <li
                key={producto}
                className="py-3 sm:py-4 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => handleSelectProduct(producto)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                      {producto.Nombre}
                    </p>
                    <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                      SKU: {producto.SKU}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedSKU && (
        <div className="mt-4">
          <div className="relative">
            <input
              className="mb-2 bg-gray-300 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg sm:text-gray-200 text-right rounded-sm hover:rounded-md focus:rounded-lg focus:ring-blue-800 focus:border-blue-700 block w-full dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900 pr-10"
              type="text"
              value={selectedSKU}
              readOnly
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectProductos;