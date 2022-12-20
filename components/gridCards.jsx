//nextjs tailwind cards

import React from 'react'

const GridCards = () => {

    const data = [
        
        {
            title: 'Login y Autorización',
            description: 'Permitirá a los usuarios ingresar a la plataforma y gestionar sus pedidos.'
        },
        {
            title: 'Captura de Datos',
            description: 'HubSpot, API Productos, Modulo Logistica.'
        },
        {
            title: 'Formulario',
            description: 'Campos extra necesarios para la gestión de una Orden (metodo de pago, de envío, etc.).'
        },
        {
            title: 'API',
            description: 'La información consolidada se envía vía API en Formato JSON para ser procesada en SAP y generar registros en Dashboard.'
        },
        {
            title: 'Dashboard',
            description: 'Plataforma para ver y gestionar los pedidos ingresados, nos permitirá editar, eliminar, ver detalles, etc.'
        },
        {
            title: 'Log',
            description: 'Registo de actividades y de estado del portal'
        },
    ]

    return (
        <div className="flex flex-row justify-center items-center flex-wrap">
            {data.map((item, index) => (
                <div className="flex flex-col justify-center items-center m-5" key={index}>
                    <div className="w-auto justify-center items-center bg-gray-200 dark:bg-gray-600 p-5 rounded-md">
                        <h1 className="h-12 text-2xl font-bold text-gray-900 dark:text-gray-200 mb-5">{item.title}</h1>
                        <p className="h-12 text-justify text-gray-700 dark:text-gray-300 w-96 mb-5">{item.description}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default GridCards
    