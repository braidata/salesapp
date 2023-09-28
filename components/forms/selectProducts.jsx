import React from "react";
import Products from "../../lib/base_productos";
import { useState, useEffect, useRef } from "react";
import { useField } from "@unform/core";
// import input from "../Input Fields/Input";
import Input from "../Input Fields/Input";

const SelectProductos = ({ cuenta }) => {
    const index = cuenta;
    console.log("indexHDP:", index);
    const [filtro, setFiltro] = useState("");
    const [selectedSKU, setSelectedSKU] = useState("");
    const [selectedSKUI, setSelectedSKUI] = useState("");
    const [precioEditable, setPrecioEditable] = useState("");
    const [selectedName, setSelectedName] = useState("");

    const skuRef = useRef(null);
    const nameRef = useRef(null);
    const priceRef = useRef(null);


    const productosFiltrados = Products.filter(producto =>
        producto.Nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        producto.SKU.toString().includes(filtro)
    );

    useEffect(() => {
        const productoSeleccionado = Products.find(p => p.SKU.toString() === selectedSKU);
        if (productoSeleccionado) {

            const precio = productoSeleccionado["Precio normal"];
            const nombre = productoSeleccionado["Nombre"];

            setPrecioEditable(precio);
            setSelectedName(nombre);
        }
    }, [selectedSKU]);




    return (
        <>
            {/*  selector de select */}
            <label className=" mt-2 text-gray-900 text-md  sm:w-full sm:text-lg sm:text-gray-200 text-left bg-gray-400/60 border border-gray-200 text-gray-900 rounded-md  focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-blue-500 dark:focus:border-blue-500">
                Buscar por Nombre o SKU
            </label>
            <input
                className="mb-2 bg-gray-300 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg sm:text-gray-200 text-right rounded-sm hover:rounded-md focus:rounded-lg  focus:ring-blue-800 focus:border-blue-700 block w-full  dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Introduce el nombre o SKU"
            />
            {/*  select */}
            <label className=" mt-2 text-gray-900 text-md  sm:w-full sm:text-lg sm:text-gray-200 text-left bg-gray-400/60 border border-gray-200 text-gray-900 rounded-md  focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-300 dark:focus:ring-blue-500 dark:focus:border-blue-500">
                Nombre del Producto
            </label>
            <select
                className="mb-2 h-10 bg-gray-300 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg  text-right rounded-sm hover:rounded-md focus:rounded-lg  focus:ring-blue-800 focus:border-blue-700 block w-full  dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900"
                value={selectedSKU}
                onChange={(e) => setSelectedSKU(e.target.value)}
                ref={skuRef}
            >
                <option className="mb-2 bg-gray-200 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg text-right rounded-sm hover:rounded-md focus:rounded-lg  focus:ring-blue-800 focus:border-blue-700 block w-full  dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900"
                value="">Selecciona un Producto</option>
                {productosFiltrados.map(producto => (
                    <option key={producto.SKU} value={producto.SKU} className="mb-2 bg-gray-300/30 border lg:w-full border-gray-100 text-gray-900 text-md sm:w-2 sm:text-lg text-right rounded-sm hover:rounded-md focus:rounded-lg  focus:ring-blue-800 focus:border-blue-700 block w-full  dark:bg-gray-900 dark:border-gray-800 dark:placeholder-gray-400 dark:text-white dark:focus:ring-gray-800 dark:focus:border-gray-900">
                        {producto.Nombre}
                    </option>
                ))}
            </select>

            {selectedSKU && (
                <>
                    {/*  use input component */}
                    <Input key={selectedSKU} name={index >= 0 ? `products.SKU-${index}` : "products.SKU"} label="SKU" type="text" valua={selectedSKU}/>
                    {/*  use input component */}
                    <Input  name={index >= 0 ? `products.Nombre_Producto-${index}` : "products.Nombre_Producto"} label="Nombre" type="text" valua={selectedName} />
                    {/*  use input component */}
                    <Input  name={index >= 0 ? `products.Precio-${index}` : "products.Precio"} label="Precio" type="text" valua={precioEditable} />
                </>
            )}
        </>
    );
};

export default SelectProductos;



