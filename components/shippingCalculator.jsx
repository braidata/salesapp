//shipping calculator component

import React from "react";



export default function ShippingCalculator() {

    return (
    
        <div className="flex flex-col justify-center items-center">
    
        <div className="flex flex-col justify-center items-center">
    
            <h1 className="text-2xl font-bold text-center">Calculadora de envío</h1>
    
            <p className="text-center">Ingresa tu código postal para calcular el costo de envío</p>
    
        </div>
    
        <div className="flex flex-col justify-center items-center">
    
            <input type="text" className="border-2 border-black rounded-md p-2" />
    
            <button className="bg-black text-white rounded-md p-2">Calcular</button>
    
        </div>
    
        </div>
    
    );
    
    }

    











