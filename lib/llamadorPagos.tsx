//server component to call the mysqlPayments api
import React, { useState, useEffect } from "react";



const LlamadorPagos = () => {





    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalData, setModalData] = useState({});



    //validation_data es una string, no un objeto
    const [validation_data, setValidation_data] = useState("");
    //status
    const [status, setStatus] = useState("");
    //observación
    const [observacion, setObservacion] = useState("");



    const [data, setData] = useState([]);
    const [data2, setData2] = useState([]);
    const [id, setId] = useState("");



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

    const handleModalOpen = (data: any) => {
        setModalData(data);
        setModalIsOpen(true);
    };

    const handleModalClose = () => {
        setModalIsOpen(false);
    };

    //validador de pagos
    const handleValidation = (e: any) => {
        e.preventDefault();
        const data = {
    
            idi: e.target.elements["idi"].value  ? e.target.elements["idi"].value : "156",
            validation_date: e.target.elements["validation_date"].value ? e.target.elements["validation_date"].value : "2022-12-22",
            status: e.target.elements["status"].value ? e.target.elements["status"].value : "error",
            observacion: e.target.elements["observacion"].value ? e.target.elements["observacion"].value : "vacio",
        };
        console.log("itenazo4", data)
        const JSONdata = JSON.stringify(data);
        fetch("/api/mysqlPaymentsValidator", {
            method: "POST",
            body: JSONdata,
        })
            .then((res) => res.json())
            //.then((data) => setData(data));
    };






    return (
        <>
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
                        <th scope="col" className="py-2 px-2" >Código de Autorización</th>
                        <th scope="col" className="py-2 px-2" >Estado</th>
                        <th scope="col" className="py-2 px-2" >Observación</th>
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
                                    className="text-center py-4 px-2 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                >{itemsub.authorization_code}</td>
                                <td scope="row"
                                    className="text-center py-4 px-2 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                >{itemsub.status}</td>
                                <td scope="row"
                                    className="text-center py-4 px-2 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                >{itemsub.observation}</td>
                                <td scope="row"
                                    className="text-center py-4 px-2 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                >
                                    <button className="rounded-full p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-green-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)]"
                                        onClick={() => {
                                            setModalIsOpen(true);
                                            console.log("itenazo", itemsub);
                                            setModalData(itemsub);
                                        }}
                                    >
                                        <i className="fas fa-check"></i>
                                    </button>
                                </td>


                            </tr>
                        ))
                    ))}
                </tbody>
            </table>
            {/* boton Validación que activa el modal donde estarán los botones y campos para validar o rechazar pedidos, para los estilos usamos tailwind css */}
            <div className="flex justify-center">
                <button className="rounded-full p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-green-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]
                transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                    onClick={handleModalOpen}>Validación</button>

            </div>

            {/* create modal with validar button anda rechazar button y un formulario para completar una observación, y un campo de fecha que mande la fecha como string */}
            {modalIsOpen && (

                <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                                            Validación de pagos
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm leading-5 text-gray-500">
                                                ¿Desea validar o rechazar el pago?
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">

                                <form className="w-full max-w-sm" onSubmit={handleValidation}>
                                    {/* get id and send in a imput */}

                                    <div className="md:flex md:items-center mb-6">
                                        {Object.entries(modalData).map((itemsub: any, index: React.Key | null | undefined) => (
                                            //  obtener solo el id del pago en la db
                                            itemsub[0] === "id" && (
                                                <div className="md:w-1/3">
                                                    <label className="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4" htmlFor="idi">
                                                        ID
                                                    </label>
                                                    <input className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" id="idi" type="text" placeholder="Jane Doe" value={itemsub[1]} />


                                                </div>
                                            )
                                        ))}



                                        <div className="md:w-1/3">
                                            <label className="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4" htmlFor="validation_date">
                                                Fecha
                                            </label>
                                        </div>
                                        <div className="md:w-2/3">
                                            <input className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" id="validation_date" type="date" placeholder="Jane Doe" />
                                        </div>
                                    </div>
                                    {/* select de status validado, no validado, rechazado */}
                                    <div className="md:flex md:items-center mb-6">
                                        <div className="md:w-1/3">
                                            <label className="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4" htmlFor="status">
                                                Status
                                            </label>
                                        </div>
                                        <div className="md:w-2/3">
                                            <select className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" id="status" placeholder="No Validado">
                                                <option value="validado">Validado</option>
                                                <option value="no validado">No validado</option>
                                                <option value="rechazado">Rechazado</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="md:flex md:items-center mb-6">
                                        <div className="md:w-1/3">
                                            <label className="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4" htmlFor="observacion">
                                                Observación
                                            </label>
                                        </div>
                                        <div className="md:w-2/3">
                                            <input className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" id="observacion" type="text" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <button className="rounded-full p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-green-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]
                transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                                            type="button" onClick={handleModalClose}>
                                            Cancelar
                                        </button>
                                    </div>
                                    <span className="flex w-full rounded-md shadow-sm sm:ml-3 sm:w-auto">

                                        <button type="submit" className="rounded-full p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-green-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]
                transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                                        >
                                            Validar
                                        </button>
                                    </span>
                                    <span className="mt-3 flex w-full rounded-md shadow-sm sm:mt-0 sm:w-auto">
                                        <button type="submit" className="rounded-full p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-green-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]
                transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                                        >
                                            Rechazar
                                        </button>

                                    </span>
                                </form>

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
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