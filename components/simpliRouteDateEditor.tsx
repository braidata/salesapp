// import React, { useState } from 'react';

// const UpdateOrderDate = () => {
//     const [id, setId] = useState('');  
//     const [newDate, setNewDate] = useState('');  
//     const [response, setResponse] = useState("");  

//     const handleUpdate = async () => {
//         try {
//             // Actualizar la fecha
//             const updateRes = await fetch(`/api/mysqlShippingEdit?method=PUT&id=${id}&newDate=${newDate}`);
//             const updatedData = await updateRes.json();
            
//             // Si la actualización fue exitosa, usar la información de la orden para enviar a SimpliRoute
//             if (updatedData && updatedData.updatedOrder) {
//                 const order = updatedData.updatedOrder;
                
//                 // Formatear el objeto para SimpliRoute
//                 const visitData = {
//                     title: order.billing_company_name,
//                     numberAdd: order.Shipping_number || order.billing_number,
//                     street: order.Shipping_street || order.billing_street,
//                     comuna: order.Shipping_commune || order.billing_commune,
//                     names: order.customer_name,
//                     lastNames: order.customer_last_name,
//                     phone: order.customer_phone,
//                     email: order.customer_email,
//                     referenceID: order.id,
//                     notes: order.Shipping_Observacion,
//                     date: order.Shipping_Fecha_de_Despacho_o_Retiro
//                 };
                
//                 // Enviar la información a SimpliRoute
//                 const simpliRes = await fetch('/api/simpliRouteConnectorPost', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify(visitData),
//                 });
                
//                 const simpliData = await simpliRes.json();
//                 setResponse(simpliData);
//             } else {
//                 setResponse("Error al actualizar la fecha o recuperar la orden.");
//             }
//         } catch (error) {
//             console.error("Error:", error);
//             setResponse("Error al procesar la solicitud.");
//         }
//     }

//     return (
//         <div>
//             <div>
//                 <label>
//                     ID de la Orden:
//                     <input type="text" value={id} onChange={e => setId(e.target.value)} />
//                 </label>
//             </div>
//             <div>
//                 <label>
//                     Nueva Fecha:
//                     <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
//                 </label>
//             </div>
//             <button onClick={handleUpdate}>Actualizar Fecha y Crear Visita</button>

//             {response && (
//                 <div>
//                     <h3>Respuesta:</h3>
//                     <pre>{JSON.stringify(response, null, 2)}</pre>
//                 </div>
//             )}
//         </div>
//     );
// }

// export default UpdateOrderDate;

import React, { useState } from 'react';

//interface for order and onClose
interface Order {
    id: string;
    billing_company_name: string;
    Shipping_number: string;
    billing_number: string;
    Shipping_street: string;
    billing_street: string;
    Shipping_commune: string;
    billing_commune: string;
    customer_name: string;
    customer_last_name: string;
    customer_phone: string;
    customer_email: string;
    Shipping_Observacion: string;
    Shipping_Fecha_de_Despacho_o_Retiro: string;
}

interface Props {
    order: Order;
    onClose: () => void;
}



const UpdateOrderDate = ({ order, onClose }: Props) => {
    const [id, setId] = useState(order.id);  // Precarga el ID de la orden
    const [SFDR, setSFDR] = useState(order.Shipping_Fecha_de_Despacho_o_Retiro);  // Precarga la fecha de la orden
    const [newDate, setNewDate] = useState('');  
    const [response, setResponse] = useState("");  

    const handleUpdate = async () => {
        try {
            // Actualizar la fecha
            const updateRes = await fetch(`/api/mysqlShippingEdit?method=PUT&id=${id}&newDate=${newDate}`);
            const updatedData = await updateRes.json();
            
            // Si la actualización fue exitosa, usar la información de la orden para enviar a SimpliRoute
            if (updatedData && updatedData.updatedOrder) {
                const order = updatedData.updatedOrder;
                
                // Formatear el objeto para SimpliRoute
                const visitData = {
                    title: order.billing_company_name,
                    numberAdd: order.Shipping_number || order.billing_number,
                    street: order.Shipping_street || order.billing_street,
                    comuna: order.Shipping_commune || order.billing_commune,
                    names: order.customer_name,
                    lastNames: order.customer_last_name,
                    phone: order.customer_phone,
                    email: order.customer_email,
                    referenceID: order.id,
                    notes: order.Shipping_Observacion,
                    date: order.Shipping_Fecha_de_Despacho_o_Retiro
                };
                
                // Enviar la información a SimpliRoute
                const simpliRes = await fetch('/api/simpliRouteConnectorPost', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(visitData),
                });
                
                const simpliData = await simpliRes.json();
                setResponse(simpliData);

                // Cierra el modal después de actualizar con éxito
                onClose();

            } else {
                setResponse("Error al actualizar la fecha o recuperar la orden.");
            }
        } catch (error) {
            console.error("Error:", error);
            setResponse("Error al procesar la solicitud.");
        }
    }

    return (
        <div className="flex flex-col items-center justify-center p-5">
        <div className="shadow-lg p-6 rounded-lg w-full max-w-md bg-gray-800/20">
            <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
                    ID de la Orden:
                </label>
                <div className="p-3 rounded bg-gray-700/50 text-gray-700 dark:text-gray-200">
                    {id}
                </div>
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
                    Fecha Actual:
                </label>
                <p className="text-gray-700 dark:text-gray-200">{SFDR}</p>
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
                    Nueva Fecha:
                </label>
                <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:shadow-outline" type="date" value={newDate} placeholder={SFDR} onChange={e => (setNewDate(e.target.value), setSFDR(e.target.value))} />
            </div>
            <div className="text-center mt-4">
            <button onClick={handleUpdate} className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)] border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)] dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center">
                Actualizar
            </button>
        </div>
    
            {response && (
                <div className="mt-4 p-4 rounded shadow-inner bg-gray-700/50">
                    <h3 className="text-gray-700 dark:text-gray-200 mb-2">Respuesta:</h3>
                    <pre className="text-xs p-3 bg-gray-600/50 rounded">{JSON.stringify(response, null, 2)}</pre>
                </div>
            )}
        </div>
    </div>
    
    );
}

export default UpdateOrderDate;


