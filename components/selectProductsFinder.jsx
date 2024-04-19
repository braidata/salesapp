import React, { useState } from "react";
import Products from "../lib/base_productos";
import { FaTimes, FaCopy } from "react-icons/fa";

const SelectProductos = ({ cuenta }) => {
  const index = cuenta;
  console.log("indexHDP:", index);
  const [filtro, setFiltro] = useState("");
  const [selectedSKU, setSelectedSKU] = useState("");
  const [selectedName, setSelectedName] = useState("");

  const productosFiltrados = Products.filter(
    (producto) =>
      producto.Nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      producto.SKU.toString().includes(filtro)
  );

  const handleSelectChange = (e) => {
    const sku = e.target.value;
    setSelectedSKU(sku);
    const productoSeleccionado = Products.find(
      (p) => p.SKU.toString() === sku
    );
    if (productoSeleccionado) {
      setSelectedName(productoSeleccionado.Nombre);
    }
  };

  const handleClearSearch = () => {
    setFiltro("");
  };

  const handleCopySKU = () => {
    navigator.clipboard.writeText(selectedSKU);
  };

  return (
    <div>
    <>
      <label className="mt-2 text-gray-900 text-md sm:w-full sm:text-lg sm:text-gray-200 text-left bg-gray-400/60 border border-gray-200 text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-blue-500 dark:focus:border-blue-500">
        Consulta de SKU por Nombre
      </label>
      <div className="relative">
        <input
          className="mb-2 bg-gray-300 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg sm:text-gray-200 text-right rounded-sm hover:rounded-md focus:rounded-lg focus:ring-blue-800 focus:border-blue-700 block w-full dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900 pr-10"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
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
      {/* <label className="mt-2 text-gray-900 text-md sm:w-full sm:text-lg sm:text-gray-200 text-left bg-gray-400/60 border border-gray-200 text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-blue-500 dark:focus:border-blue-500">
        Resultado de Búsqueda
      </label> */}
      <select
        className="mb-2 h-10 bg-gray-300 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg text-right rounded-sm hover:rounded-md focus:rounded-lg focus:ring-blue-800 focus:border-blue-700 block w-full dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900"
        value={selectedSKU}
        onChange={handleSelectChange}
      >
        <option value="">Selecciona un Producto</option>
        {productosFiltrados.map((producto) => (
          <option key={producto} value={producto.SKU}>
            {producto.Nombre}
          </option>
        ))}
      </select>

      {selectedSKU && (
        <>
          {/* <label className="mt-2 text-gray-900 text-md sm:w-full sm:text-lg sm:text-gray-200 text-left bg-gray-400/60 border border-gray-200 text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-blue-500 dark:focus:border-blue-500">
            SKU
          </label> */}
          <div className="relative">
            <input
              className="mb-2 bg-gray-300 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg sm:text-gray-200 text-right rounded-sm hover:rounded-md focus:rounded-lg focus:ring-blue-800 focus:border-blue-700 block w-full dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900 pr-10"
              type="text"
              value={selectedSKU || ""}
              readOnly
            />
            <button
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={handleCopySKU}
            >
              <FaCopy />
            </button>
          </div>
          {/* <label className="mt-2 text-gray-900 text-md sm:w-full sm:text-lg sm:text-gray-200 text-left bg-gray-400/60 border border-gray-200 text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-blue-500 dark:focus:border-blue-500">
            Nombre
          </label>
          <input
            className="mb-2 bg-gray-300 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg sm:text-gray-200 text-right rounded-sm hover:rounded-md focus:rounded-lg focus:ring-blue-800 focus:border-blue-700 block w-full dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900"
            type="text"
            value={selectedName || ""}
            readOnly
          /> */}
        </>
      )}
    </>
    </div>
  );
};

export default SelectProductos;