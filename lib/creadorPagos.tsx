// //server component to call the mysqlPayments api
// import React, { useState, useEffect } from "react";

// const CreadorPagos = () => {



//     const [data, setData] = useState([]);
//     //console.log()
//     // useEffect(() => {
//     //     fetch("/api/mysqlPayments")
//     //     .then((res) => res.json())
//     //     .then((data) => setData(data));
//     // }, []);

//     //evita esto, usa el form de abajo con una funcion que haga el fetch
//     const handleSubmit = (e: any) => {
//         e.preventDefault();
//         const data = {
//             order_id: e.target.order_id.value,
//             rut_pagador: e.target.rut_pagador.value,
//             payment_date: e.target.payment_date.value,
//             payment_amount: e.target.payment_amount.value,
//             method: e.target.method.value,
//             payment_count: e.target.payment_count.value,
//             authorization_code: e.target.authorization_code.value,
//         };
//         const JSONdata = JSON.stringify(data);
//         fetch("/api/mysqlPaymentsCreator", {
//             method: "POST",
//             body: JSONdata,
//         })
//             .then((res) => res.json())
//             .then((data) => setData(data));
//     };



//     return (
//         <div>
//             <h1>Pagos</h1>
//             {/*  modifica <form action="/api/mysqlPayments" method="post"> para usar handlesubmit */}
//             <form onSubmit={handleSubmit}>
//                 {/* <input type="text" name="fecha_pago" placeholder="fecha_pago" />
//                 <input type="text" name="rut_pagador" placeholder="rut_pagador" /> */}
//                 <input className="bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="order_id" placeholder="order_id" />
//                 <input className="bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="rut_pagador" placeholder="rut_pagador" />
//                 <input className="bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="method" placeholder="method" />
//                 <input className="bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="payment_date" placeholder="payment_date" />
//                 <input className="bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="payment_amount" placeholder="payment_amount" />
//                 <input className="bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="payment_count" placeholder="payment_count" />
//                 <input className="bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="authorization_code" placeholder="authorization_code" />
//                 <button type="submit">Crear Pago</button>
//             </form>
//             {/* <h2>Resultados</h2>
//             < table >
//                 <thead>
//                     <tr>
//                         <th>Número de Pedido</th>
//                         <th>Rut del Pagador</th>
//                         <th>Fecha de Pago</th>
//                         <th>Monto Total</th>
//                         <th>Tipo de Pago</th>
//                         <th>Cantidad de Pagos</th> 
//                         <th>Código de Autorización</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {Object.entries(data).map((item: any) => (
//                         console.log("pagotes", item),
//                         item[1].map((itemsub: any, index: React.Key | null | undefined) => (
//                             <tr key={itemsub.order_id}>
//                                 <td>{itemsub.order_id}</td>
//                                 <td>{itemsub.rut_pagador}</td>
//                                 <td>{itemsub.payment_date}</td>
//                                 <td>{itemsub.payment_amount}</td>
//                                 <td>{itemsub.method}</td>
//                                 <td>{itemsub.payment_count}</td>
//                                 <td>{itemsub.authorization_code}</td>
//                             </tr>
//                         ))
//                     ))}
//                 </tbody>
//             </table> */}
//         </div>
//     );
// };

// export default CreadorPagos;

import { useState } from "react";

export default function PaymentForm() {
  const [paymentData, setPaymentData] = useState({
    order_id: "",
    method: "",
    rut_pagador: "",
    authorization_code: "",
    payment_count: "",
    payment_amount: "",
    payment_date: "",
  });

  const handleSubmit = async (event: { preventDefault: () => void; }) => {
    event.preventDefault();
    const res = await fetch("/api/mysqlPaymentsCreator", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });
    if (res.status === 201) {
      setPaymentData({
        order_id: "",
        method: "",
        rut_pagador: "",
        authorization_code: "",
        payment_count: "",
        payment_amount: "",
        payment_date: "",
      });
      alert("El Pago fue creado con éxito");
    } else {
      alert("Error al crear el Pago");
    }
  };

  const handleChange = (event: { target: { name: any; value: any; }; }) => {
    const { name, value } = event.target;
    setPaymentData({ ...paymentData, [name]: value });
  };

  return (
    <>
    <h1 className="w-96 sm:w-full text-6xl font-bold text-gray-900 dark:text-gray-300 mt-24 mb-24 dark:text-gray-300 font-bold py-4 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
    bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
    border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]">
      INGRESA EL PAGO DE TU PEDIDO
    </h1>
    <form onSubmit={handleSubmit} className="bg-gray-800 bg-opacity-75 rounded-lg px-8 pt-6 pb-8 mb-4">
      <div className="mb-4">
        <label className="block text-gray-300 font-bold mb-2 dark:text-gray-300 " htmlFor="order_id">
          Order ID:
        </label>
        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="order_id" value={paymentData.order_id} onChange={handleChange} required />
      </div>
      <div className="mb-4">
        <label className="block text-gray-300 font-bold mb-2 dark:text-gray-300" htmlFor="method">
          Método de Pago:
        </label>
        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="method" value={paymentData.method} onChange={handleChange} required />
      </div>
      <div
      className="mb-4">
        <label className="block text-gray-300 font-bold mb-2 dark:text-gray-300" htmlFor="rut_pagador">
            Rut pagador:
        </label>
        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="rut_pagador" value={paymentData.rut_pagador} onChange={handleChange} required />
        <label className="block text-gray-300 font-bold mb-2 dark:text-gray-300" htmlFor="authorization_code">
          Código de Autorización:
        </label>
        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="authorization_code" value={paymentData.authorization_code} onChange={handleChange} required />
      </div>
      <div className="mb-4">
        <label className="block text-gray-300 font-bold mb-2 dark:text-gray-300" htmlFor="payment_count">
          Cantidad de pagos:
        </label>
        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="payment_count" value={paymentData.payment_count} onChange={handleChange} required />
      </div>
      <div className="mb-4">
        <label className="block text-gray-300 font-bold mb-2 dark:text-gray-300" htmlFor="payment_amount">
          Monto total:
        </label>
        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="payment_amount" value={paymentData.payment_amount} onChange={handleChange} required />
        </div>
        <div className="mb-4">
        <label className="block text-gray-300 font-bold mb-2 dark:text-gray-300" htmlFor="payment_date">
            Fecha de Pago:
        </label>
        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="payment_date" value={paymentData.payment_date} onChange={handleChange} required />  
        </div>
        <div className="flex items-center justify-between">
        <button className="mt-2 mb-5 bg-gradient-to-r from-green-600/40 to-green-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)]  border-green-800 hover:bg-green-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-green-500/40 dark:to-green-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-green-200 dark:hover:bg-green-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-0 hover:skew-y-0 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center" type="submit">
            Crear Pago
        </button>
        </div>
    </form></>
    );
}
