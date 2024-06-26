//server component to call the mysqlPayments api
import React, { useState, useEffect } from "react";



const LlamadorPagos = (orderId: any) => {





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
    const [success, setSucces] = useState(false);



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

            idi: e.target.elements["idi"].value ? e.target.elements["idi"].value : "156",
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
            successer();
        //.then((data) => setData(data));
    };

    //funcion para mostrar el exito de la validacion
    const successer = () => {
        setSucces(true);
        setTimeout(() => {
            setSucces(false);
        }, 3000);

    };










    return (
        <>
    {/* this div needs to be a container parent to adapt all the tables */}
        <div className="px-4 py-4 rounded-lg
        flex flex-col max-w-lg items-center justify-center gap-2 bg-gradient-to-r from-gray-500/80 via-gray-600/80 to-purple-900/70 dark:bg-gradient-to-r dark:from-gray-400/70 dark:via-gray-600/70 dark:to-purple-200/70

        "
        
        >
            <div className="w-96 sm:w-full px-4 py-4  flex flex-col mt-10 overflow-x-auto relative shadow-md shadow sm:rounded-lg">
                <h2 className="dark:text-gray-300 font-bold py-2 px-2 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-100
                mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-90 
                 border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]" >Buscador de Pagos</h2>
                {/*  modifica <form action="/api/mysqlPayments" method="post"> para usar handlesubmit */}
                <form onSubmit={handleSubmit} >
                    {/* <input type="text" name="fecha_pago" placeholder="fecha_pago" />
                <input type="text" name="rut_pagador" placeholder="rut_pagador" /> */}
                    <div className="flex flex-col items-center justify-center 
                ">
                        <label className="flex flex-col text-gray-300 font-bold mb-2 dark:text-gray-300 " htmlFor="order_id">Número de Pedido</label>
                        <input className="w-24 text-center bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200 " type="text" name="order_id" placeholder="order_id" />

                        <button className="max-w-sm  mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-1 px-1 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-0 hover:skew-y-0 hover:scale-95 focus:-rotate-[0.1deg] focus:-skew-x-0 focus:-skew-y-0 focus:scale-90 transition duration-1000 origin-center" type="submit">Buscar</button>
                    </div>
                </form>
            </div>
            <div className="w-96 sm:w-full px-4 py-4  flex flex-col mt-10 overflow-x-auto relative shadow-md shadow sm:rounded-lg">
            <h2 className="dark:text-gray-300 font-bold py-2 px-2 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/80 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-90
                 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-100
                    border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)] mb-12" >Resultado de la Búsqueda</h2>
            <div className="w-96 sm:w-full  flex flex-col mt-10 overflow-x-auto relative shadow-md shadow sm:rounded-lg">


                <table  className="mt-8 mb-8">
                    <thead className="text-sm mt-12 text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="row" className="text-center w-2 py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out" >Número de Pedido</th>
                            <th scope="row" className="text-center w-2 py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out" >Rut del Pagador</th>
                            <th scope="row" className="text-center w-2 py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out" >Fecha de Pago</th>
                            <th scope="row" className="text-center w-2 py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out" >Monto Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(data).map((item: any) => (
                            console.log("pagotes", item),
                            item[1].map((itemsub: any, index: React.Key | null | undefined) => (

                                <tr className="bg-white border-b dark:bg-gray-900 dark:border-gray-700" key={itemsub.order_id}>
                                    <td scope="row"
                                        className="text-center py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                    >{itemsub.order_id}</td>
                                    <td scope="row"
                                        className="text-center py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                    >{itemsub.rut_pagador}</td>
                                    <td scope="row"
                                        className="text-center py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                    >{itemsub.payment_date}</td>
                                    <td scope="row"
                                        className="text-center py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                    >{itemsub.payment_amount}</td>



                                </tr>

                            ))
                        ))}
                    </tbody>

                    </table>

                    

                    </div>
                    <div className="w-96 sm:w-full bg-white/20  flex flex-col mt-10 overflow-x-auto relative shadow-md shadow sm:rounded-lg">
                   <table>
                    <thead className="mt-8 text-sm text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="text-center text-sm py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out" >Cantidad de Pagos</th>
                            <th scope="col" className="text-center text-sm py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out" >Código de Autorización</th>
                            <th scope="row" className="text-center text-sm py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out" >Tipo de Pago</th>

                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(data).map((item: any) => (
                            console.log("pagotes", item),
                            item[1].map((itemsub: any, index: React.Key | null | undefined) => (

                                <tr className="bg-white border-b dark:bg-gray-900 dark:border-gray-700" key={itemsub.order_id}>
                                    <td scope="row"
                                        className="text-center py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                    >{itemsub.method}</td>
                                    <td scope="row"
                                        className="text-center py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                    >{itemsub.payment_count}</td>
                                    <td scope="row"
                                        className="text-center py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                    >{itemsub.authorization_code}</td>


                                </tr>

                            ))
                        ))}
                    </tbody>

                </table>
            </div>
            <div className="w-96 sm:w-full  flex flex-col mt-10 overflow-x-auto relative shadow-md shadow sm:rounded-lg">
                <table>

                <thead className="mt-8 text-sm text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="text-center py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out" >Estado</th>
                        <th scope="col" className="text-center py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out" >Observación</th>
                        <th scope="col" className="text-center py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out" >Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(data).map((item: any) => (
                        console.log("pagotes", item),
                        item[1].map((itemsub: any, index: React.Key | null | undefined) => (

                            <tr className="bg-white border-b dark:bg-gray-900 dark:border-gray-700" key={itemsub.order_id}>
                                <td scope="row"
                                    className="text-center py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                >{itemsub.status === "no validado" ? (
                                    <p className="py-2 px-2 mt-2 mb-2 sm:w-48 text-center rounded-md border dark:border-yellow-300/80 dark:hover:border-yellow-200/80 border border-yellow-700 rounded shadow
                                    hover:bg-yellow-100/20 hover:text-yellow-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-yellow-700/20 dark:hover:text-yellow-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
                                    ">{itemsub.status}</p>
                                  ) : itemsub.status === "validado" ? (
                                    <p className="py-2 px-2 mt-2 mb-2 sm:w-48 text-center rounded-md border dark:border-green-300/80 dark:hover:border-green-200/80 border border-green-600 rounded shadow
                                    hover:bg-green-200/20 hover:text-green-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-green-700/20 dark:hover:text-green-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
                                    ">{itemsub.status}</p>
                                  ) : itemsub.status === "rechazado" ? (
                                    <p className="py-2 px-2 mt-2 mb-2 sm:w-48 text-center rounded-md border dark:border-red-300/80 dark:hover:border-red-200/80 border border-red-800 rounded shadow
                                    hover:bg-red-100/20 hover:text-red-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-red-700/20 dark:hover:text-red-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
                                    ">{itemsub.status}</p>
                
                                  ) : (
                                    <p className="py-2 px-2 mt-2 mb-2 sm:w-48 text-center rounded-md border dark:border-blue-300/80 dark:hover:border-blue-200/80 border border-blue-700 rounded shadow
                                    hover:bg-blue-100/20 hover:text-blue-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-blue-700/20 dark:hover:text-blue-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
                                    ">{itemsub.status}</p>
                                  )}</td>
                                <td scope="row"
                                    className="text-center py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                >{itemsub.observation}</td>

                                <td scope="row"
                                    className="text-center py-1 px-1 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                >
                                    <button className="rounded-full w-4 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-green-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]
                transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-80 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-90 transition duration-500 origin-center"
                                        onClick={() => {
                                            setModalIsOpen(true);
                                            console.log("itenazo", itemsub);
                                            setModalData(itemsub);
                                        }}
                                    >
                                        <i className="fas fa-check">Revisar</i>
                                    </button>
                                </td>


                            </tr>

                        ))
                    ))}
                </tbody>

            </table>
            

            </div>
            </div>

            {/* boton Validación que activa el modal donde estarán los botones y campos para validar o rechazar pedidos, para los estilos usamos tailwind css */}
            {/* <div className="flex justify-center">
                <button className="rounded-full p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-green-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]
                transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                    onClick={handleModalOpen}>Validación</button>

            </div> */}

            {/* create modal with validar button anda rechazar button y un formulario para completar una observación, y un campo de fecha que mande la fecha como string */}
            {modalIsOpen && (

                <div className="backdrop-blur-sm bg-gradient-r  backdrop-filter backdrop-blur-sm backdrop-saturate-150 fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    {/* <div className="bg-gray-700/20 w-11/12 md:max-w-3xl mx-auto rounded shadow-lg z-50 overflow-y-auto"> */}


                        <div className=" 
                        " aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="relative bg-white/30 dark:bg-gray-800/80 flex flex-col align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:-my-2 max-h-sm sm:align-middle sm:max-w-lg sm:w-full" role="dialog" aria-modal="true" aria-labelledby="modal-headline">
                      
                            <div className="flex flex-row gap-12 text-center bg-white/30 dark:bg-gray-900/80 px-2 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="  flex flex-row gap-12 text-center  ">
                                    <div className="mt-3 flex flex-col text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-200" id="modal-headline">
                                            Validación de pagos
                                        </h3>
                                        
                                        <div className="mt-2 ml-24">
                                            <p className="text-sm leading-5 text-gray-500 dark:text-gray-200">
                                                Válida o rechaza los pagos ingresando un comentario.
                                            </p>
                                        </div>
                                        
                                    </div>
                                    <p
              title="Cerrar"
              className="absolute top-0 right-0  p-2 rounded-full text-gray-600/20 dark:text-gray-300/10 text-sm font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-70/100 dark:hover:text-green-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)] z-50 transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
              aria-label="close"
              
                onClick={handleModalClose}
              >X</p>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center items-center
                            bg-gray-50/60 dark:bg-gray-700/80 px-2 py-2 w-full  blur-sm">

                                <form className="w-full max-w-sm" onSubmit={handleValidation}>
                                    {/* get id and send in a imput */}

                                    <div className="md:flex md:items-center mb-6">
                                        {Object.entries(modalData).map((itemsub: any, index: React.Key | null | undefined) => (
                                            //  obtener solo el id del pago en la db
                                            itemsub[0] === "id" && (
                                                <div className="">
                                                    <label className="flex flex-col text-gray-500 dark:text-gray-200  font-bold md:text-right mb-1 md:mb-0 pr-4" htmlFor="idi">
                                                        ID
                                                    </label>
                                                    <input className="bg-gray-200 dark:bg-gray-900 dark:text-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" id="idi" type="text" placeholder="Jane Doe" value={itemsub[1]} />


                                                </div>
                                            )
                                        ))}



                                        <div className="">
                                            <label className="flex flex-col text-gray-500 dark:text-gray-200 font-bold md:text-right mb-1 md:mb-0 pr-4" htmlFor="validation_date">
                                                Fecha
                                            </label>
                                        </div>
                                        <div className="md:w-2/3">
                                            <input className="bg-gray-200 dark:bg-gray-900 dark:text-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" id="validation_date" type="date" placeholder="Jane Doe" />
                                        </div>
                                    </div>
                                    {/* select de status validado, no validado, rechazado */}
                                    <div className="md:flex md:items-center mb-6">
                                        <div className="">
                                            <label className="flex flex-col text-gray-500 dark:text-gray-200 font-bold md:text-right mb-1 md:mb-0 pr-4" htmlFor="status">
                                                Status
                                            </label>
                                        </div>
                                        <div className="">
                                            <select className="bg-gray-200 dark:bg-gray-900 dark:text-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" id="status" placeholder="No Validado">
                                                <option value="validado">Validado</option>
                                                <option value="no validado">No validado</option>
                                                <option value="rechazado">Rechazado</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="md:flex md:items-center mb-6">
                                        <div className="">
                                            <label className="flex flex-col text-gray-500 dark:text-gray-200 font-bold md:text-right mb-1 md:mb-0 pr-4" htmlFor="observacion">
                                                Observación
                                            </label>
                                        </div>
                                        <div className="md:w-2/3">
                                            <input className="bg-gray-200 dark:bg-gray-900 dark:text-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" id="observacion" type="text" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                    

                                        <button type="submit" className="rounded-full bg-gray-500/80 p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-green-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]
                transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                                        >
                                            Enviar
                                        </button>
                                    
                                    
                                        <button className="rounded-full p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-green-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]
                transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                                            type="button" onClick={handleModalClose}>
                                            Cerrar
                                        </button>
                                        {success && (
                                        <div className="text-sm">
                                            {/* muestra que se ha enviado la evaluación del pago con exito o con error */}
                                            
                                                {success ? <div className="mt-12 mb-4 py-2 px-2 w-48 h-24 bg-gradient-r from-gray-200/50 via-gray-50/80 to-gray-500/90  dark:bg-gradient-r dark:from-gray-200/50 dark:via-gray-50/80 dark:to-gray-500/90text-green-500 dark:text-green-300 font-semibold">Evaluación enviada con éxito</div> : <div className="text-orange-500 dark:text-orange-300 font-semibold">Error al enviar la evaluación</div>}
                                            
                                        </div>
                                        )}


                                        

                                    </div>

                                    {/* <span className="mt-3 flex w-full rounded-md shadow-sm sm:mt-0 sm:w-auto">
                                        <button type="submit" className="rounded-full p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-green-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]
                transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                                        >
                                            Rechazar
                                        </button>

                                    </span> */}
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