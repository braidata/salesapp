//server component to call the mysqlPayments api
import React, { useState, useEffect } from "react";

const LlamadorPagos = () => {



    const [data, setData] = useState([]);
    //console.log()
    // useEffect(() => {
    //     fetch("/api/mysqlPayments")
    //     .then((res) => res.json())
    //     .then((data) => setData(data));
    // }, []);

    //evita esto, usa el form de abajo con una funcion que haga el fetch
    const handleSubmit = (e: any) => {
        e.preventDefault();
        const data = {
            order_id: e.target.order_id.value,
        };
        const JSONdata = JSON.stringify(data);
        fetch("/api/mysqlPayments", {
            method: "POST",
            body: JSONdata,
        })
            .then((res) => res.json())
            .then((data) => setData(data));
    };



    return (
        <div className="w-96 sm:w-full flex flex-col mt-10 overflow-x-auto relative shadow-md sm:rounded-lg">
            <h2 className="dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
        mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
        border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]" >Buscador de Pagos</h2>
            {/*  modifica <form action="/api/mysqlPayments" method="post"> para usar handlesubmit */}
            <form onSubmit={handleSubmit} >
                {/* <input type="text" name="fecha_pago" placeholder="fecha_pago" />
                <input type="text" name="rut_pagador" placeholder="rut_pagador" /> */}
                <div className="flex flex-col items-center justify-center 
                ">
                <label className="block text-gray-300 font-bold mb-2 dark:text-gray-300 " htmlFor="order_id">Número de Pedido</label>
                <input className="w-48 bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200 " type="text" name="order_id" placeholder="order_id" />
                
                <button className="w-2 mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-1 px-1 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-0 hover:skew-y-0 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-0 focus:-skew-y-0 focus:scale-105 transition duration-500 origin-center" type="submit">Buscar</button>
                </div>
            </form>
            < table className=" w-48 text-sm text-left text-gray-500 dark:text-gray-400" >
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="py-2 px-2" >Número de Pedido</th>
                        <th scope="col" className="py-2 px-2" >Rut del Pagador</th>
                        <th scope="col" className="py-2 px-2" >Fecha de Pago</th>
                        <th scope="col" className="py-2 px-2" >Monto Total</th>
                        <th scope="col" className="py-2 px-2" >Tipo de Pago</th>
                        <th scope="col" className="py-2 px-2" >Cantidad de Pagos</th>
                        <th scope="col" className="hidden lg:flex lg:flex-col py-2 px-2" >Código de Autorización</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(data).map((item: any) => (
                        console.log("pagotes", item),
                        item[1].map((itemsub: any, index: React.Key | null | undefined) => (
                            <tr className="bg-white border-b dark:bg-gray-900 dark:border-gray-700" key={itemsub.order_id}>
                                <td scope="row"
                                    className="text-center py-4 px-2 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                >{itemsub.order_id}</td>
                                <td scope="row"
                                    className="text-center py-4 px-2 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                >{itemsub.rut_pagador}</td>
                                <td scope="row"
                                    className="text-center py-4 px-2 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                >{itemsub.payment_date}</td>
                                <td scope="row"
                                    className="text-center py-4 px-2 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                >{itemsub.payment_amount}</td>
                                <td scope="row"
                                    className="text-center py-4 px-2 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                >{itemsub.method}</td>
                                <td scope="row"
                                    className="text-center py-4 px-2 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                >{itemsub.payment_count}</td>
                                <td scope="row"
                                    className="hidden lg:flex lg:flex-col text-center py-4 px-2 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                >{itemsub.authorization_code}</td>
                            </tr>
                        ))
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default LlamadorPagos;

/**  <ul>
    {Object.entries(data).map((item: any) => (
        console.log("pagotes", item),
        item[1].map((itemsub: any, index: React.Key | null | undefined) => (
                
            <li key={index}>
                {itemsub.order_id}
            </li>
            ))
        )
    )} 
        </ul> */