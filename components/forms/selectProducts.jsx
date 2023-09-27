import React from "react";
import Products from "../../lib/base_productos";
import { useState, useEffect, useRef } from "react";
import { useField } from "@unform/core";

const SelectProductos = () => {
    const [filtro, setFiltro] = useState("");
    const [selectedSKU, setSelectedSKU] = useState("");
    const [precioEditable, setPrecioEditable] = useState("");
    const [selectedName, setSelectedName] = useState("");

    const skuRef = useRef(null);
    const nameRef = useRef(null);
    const priceRef = useRef(null);

    const { fieldName: skuFieldName, registerField: registerSkuField } = useField("products.SKU");
    const { fieldName: nameFieldName, registerField: registerNameField } = useField("products.Nombre_Producto");
    const { fieldName: priceFieldName, registerField: registerPriceField } = useField("products.Precio");

    const productosFiltrados = Products.filter(producto =>
        producto.Nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        producto.SKU.toString().includes(filtro)
    );

    useEffect(() => {
        const productoSeleccionado = Products.find(p => p.SKU.toString() === selectedSKU);
        if (productoSeleccionado) {
            setPrecioEditable(productoSeleccionado["Precio normal"]);
            setSelectedName(productoSeleccionado["Nombre"]);
        }
    }, [selectedSKU]);

    useEffect(() => {
        registerSkuField({
            name: skuFieldName,
            ref: skuRef.current,
            getValue: (ref) => ref ? ref.value : null,
        });
        registerNameField({
            name: nameFieldName,
            ref: nameRef.current,
            getValue: (ref) => ref ? ref.value : null,
        });
        registerPriceField({
            name: priceFieldName,
            ref: priceRef.current,
            getValue: (ref) => ref ? ref.value : null,
        });
    }, [skuFieldName, registerSkuField, nameFieldName, registerNameField, priceFieldName, registerPriceField]);
    
    return (
        <>
            <label className="mt-2 text-gray-900 text-md">
                Buscar por Nombre o SKU
            </label>
            <input
                className="mb-2 bg-gray-600 border lg:w-full text-gray-900"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Introduce el nombre o SKU"
            />

            <label className="mt-2 text-gray-900 text-md">
                Nombre del Producto
            </label>
            <select
                className="mb-2 bg-gray-600 border lg:w-full text-gray-900"
                value={selectedSKU}
                onChange={(e) => setSelectedSKU(e.target.value)}
                ref={skuRef}
            >
                <option value="">Selecciona un Producto</option>
                {productosFiltrados.map(producto => (
                    <option key={producto.SKU} value={producto.SKU}>
                        {producto.Nombre}
                    </option>
                ))}
            </select>

            {selectedSKU && (
                <>
                    <label className="mt-2 text-gray-900 text-md">
                        SKU
                    </label>
                    <input
                        className="mb-2 bg-gray-600 border lg:w-full text-gray-900"
                        id="products.SKU"
                        value={selectedSKU}
                        readOnly
                    />
                    <label className="mt-2 text-gray-900 text-md">
                        Nombre
                    </label>
                    <input
                        className="mb-2 bg-gray-600 border lg:w-full text-gray-900"
                        id="products.Nombre_Producto"
                        value={selectedName}
                        readOnly
                        ref={nameRef}
                    />
                    <label className="mt-2 text-gray-900 text-md">
                        Precio
                    </label>
                    <input
                        className="mb-2 bg-gray-600 border lg:w-full text-gray-900"
                        id="products.Precio"
                        value={precioEditable}
                        onChange={(e) => setPrecioEditable(e.target.value)}
                        ref={priceRef}
                    />
                </>
            )}
        </>
    );
};

export default SelectProductos;



