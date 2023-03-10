//nextjs tailwind order table component

import React from "react";
import { useState } from "react";


const OrderTable = ({ data }) => {

  //extraer los pedidos de la base de datos
  const datas = data

  console.log("la gran data: ", data)

  //modal cards with data info on click on "ver" button
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalData, setModalData] = useState({});

  const handleModalOpen = (data) => {
    setModalData(data);
    setModalIsOpen(true);
  };

  const handleModalClose = () => {
    setModalIsOpen(false);
  };











  return (

    <div className="w-96 sm:w-full flex flex-col mt-10 overflow-x-auto relative shadow-md sm:rounded-lg">
      <table className="text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="py-2 px-2">
              Cliente
            </th>
            <th scope="col" className="hidden lg:flex lg:flex-col py-2 px-2">
              Productos
            </th>
            <th scope="col" className="py-2 px-2">
              Estado
            </th>
            <th scope="col" className="py-2 px-2">
              Empresa
            </th>
            <th scope="col" className="py-2 px-2">
              Acción
            </th>
          </tr>
        </thead>
        <tbody>
          {datas ? Object.entries(datas).map((item, i) => (
            console.log("itita1", item[1]),
            item[1].map((item, i) => (
              console.log("itita2", item),
              <tr key={i} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
                <th

                  scope="row"
                  className="text-center py-4 px-2 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                >
                  {item.customer_name} {item.customer_lastname}
                </th>
                <td className="hidden lg:flex lg:flex-col py-4 px-2 w-full text-sm dark:text-gray-400">
                  {item.order_items.map(
                    (item, i) => (
                      console.log("itita4", item),
                      <p className="py-4 px-2 mt-2 mb-2 rounded-md border dark:border-blue-300/80 dark:hover:border-blue-200/80 border border-gray-400 rounded shadow
                      hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700/20 dark:hover:text-gray-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out 
                      ">{item.name}</p>
                    )

                  )}
                </td>
                <td className="py-4 px-2 w-24 sm:w-24 text-sm dark:text-gray-400">
                  {/* <p className="py-4 px-2 mt-2 mb-2 rounded-md border dark:border-blue-300/80 dark:hover:border-blue-200/80 border border-green-400 rounded shadow
                hover:bg-green-100 hover:text-green-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-green-700/20 dark:hover:text-green-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out 
                ">
                    {item.statusSAP}</p> */}
                  {item.statusSAP === "Procesando" ? (
                    <p className="py-2 px-2 mt-2 mb-2 sm:w-24 text-center rounded-md border dark:border-yellow-300/80 dark:hover:border-yellow-200/80 border border-yellow-700 rounded shadow
                    hover:bg-yellow-100/20 hover:text-yellow-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-yellow-700/20 dark:hover:text-yellow-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
                    ">{item.statusSAP}</p>
                  ) : item.statusSAP === "Facturado" ? (
                    <p className="py-2 px-2 mt-2 mb-2 sm:w-24 text-center rounded-md border dark:border-green-300/80 dark:hover:border-green-200/80 border border-green-600 rounded shadow
                    hover:bg-green-200/20 hover:text-green-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-green-700/20 dark:hover:text-green-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
                    ">{item.statusSAP}</p>
                  ) : item.statusSAP === "Error SAP" ? (
                    <p className="py-2 px-2 mt-2 mb-2 sm:w-24 text-center rounded-md border dark:border-red-300/80 dark:hover:border-red-200/80 border border-red-800 rounded shadow
                    hover:bg-red-100/20 hover:text-red-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-red-700/20 dark:hover:text-red-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
                    ">{item.statusSAP}</p>

                  ) : (
                    <p className="py-2 px-2 mt-2 mb-2 sm:w-24 text-center rounded-md border dark:border-blue-300/80 dark:hover:border-blue-200/80 border border-blue-700 rounded shadow
                    hover:bg-blue-100/20 hover:text-blue-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-blue-700/20 dark:hover:text-blue-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
                    ">{item.statusSAP}</p>
                  )}



                </td>
                <td className="py-4 px-2 text-sm dark:text-gray-400">
                  {item.billing_company_name}
                </td>
                <td className="w-full sm:w-24 py-4 px-2 text-sm dark:text-gray-400">
                  <button className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center" onClick={() => handleModalOpen(item)}>
                    Ver
                  </button>
                </td>
              </tr>
            ))
          )) : null}
        </tbody>
      </table>
      {modalIsOpen && (
        <div className="backdrop-blur-sm bg-white/30 transition-colors duration-500 lg:z-50 lg:border-b lg:border-slate-900/10 dark:border-slate-50/[0.06] bg-white/30 supports-backdrop-blur:bg-white/30 dark:bg-transparent fixed top-0 left-0 w-full h-full z-50 flex items-center justify-center overflow-auto 
         
        " id="modal">
          {/* modal-background gradient */}
          <div className=" bg-gray-900 bg-opacity-30 absolute w-full h-full z-0   
          "></div>
          {/* modal-card */}
          <div className=" bg-gray-700/20 w-11/12 md:max-w-3xl mx-auto rounded shadow-lg z-50 overflow-y-auto 
          ">
            {/* modal-card-head*/}
            <header className="bg-gray-300/90 flex items-center justify-between p-5 border-b border-gray-300 dark:border-gray-700 dark:bg-gray-800 
            ">
              {/* modal-card-title */}
              <p className="text-gray-600  text-xl font-semibold dark:text-gray-300 
              ">Detalles del pedido</p>
              <button
                title="Cerrar"
                className="rounded-full p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-green-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]
                transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                aria-label="close"
                onClick={handleModalClose}
              >X</button>
            </header>
            {/* modal-card-body */}
            <section className=" p-2 dark:text-gray-300 mt-2 rounded-lg">
              <table className="py-3 px-2  w-full text-sm dark:text-gray-400 rounded-lg">
                <thead>
                  <tr className="w-full py-3 px-2 text-gray-700 bg-gray-300/80 border-b border-blue-300/30 dark:border-gray-800/80 dark:bg-gray-900/80 dark:text-gray-200 rounded-md">
                    <th scope="col" className="py-3 px-2 rounded-tl-lg">
                      ID
                    </th>
                    <th scope="col" className="py-3 px-2">
                      Cliente
                    </th>
                    <th scope="col" className="py-3 px-2">
                      Correo
                    </th>
                    {/* <th scope="col" className="py-3 px-2 hidden lg:flex lg:flex-row">
                      Teléfono
                    </th>
                    <th scope="col" className="py-3 px-2 hidden lg:flex lg:flex-row">
                      Rut
                    </th> */}
                    <th scope="col" className="py-3 px-2 rounded-tr-lg ">
                      Estado
                    </th>

                  </tr>
                </thead>
                <tbody>
                  <tr className="text-center max-w-sm py-3 px-2 text-gray-600 bg-gray-200/90 border-t border-gray-900/60 dark:border-gray-700/80 dark:bg-gray-800/80 dark:text-gray-300 rounded-lg
                  ">
                    <td className="py-3 px-2 rounded-bl-lg">{modalData.id}</td>
                    <td className="py-3 px-2">{modalData.customer_name}</td>
                    <td className="py-3 px-2">{modalData.customer_email}</td>
                    {/* <td className="py-3 px-2 hidden lg:flex lg:flex-row">{modalData.customer_phone}</td>
                    <td className="py-3 px-2 hidden lg:flex lg:flex-row">{modalData.customer_rut}</td> */}
                    <td className="py-3 px-2 rounded-br-lg">{modalData.statusSAP}</td>
                  </tr>
                </tbody>
              </table>
            </section>
            {modalData.order_items && (
              <section className=" p-2 dark:text-gray-300 mt-2">
                <table className="py-3 px-2  w-full text-sm dark:text-gray-400 rounded-lg">
                  <thead>
                    <tr className="w-full max-w-sm py-3 px-2 text-gray-700 bg-gray-300/80 border-b border-blue-300/30 dark:border-gray-800/80 dark:bg-gray-900/80 dark:text-gray-200 rounded-md">
                      <th scope="col" className="py-3 px-2 rounded-tl-lg">
                        Producto
                      </th>
                      <th scope="col" className="py-3 px-2">
                        Precio
                      </th>
                      <th scope="col" className="py-3 px-2">
                        Cantidad
                      </th>
                      <th scope="col" className="py-3 px-2 ">
                        SKU
                      </th>
                      <th scope="col" className="py-3 px-2 rounded-tr-lg">
                        Totales
                      </th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {modalData.order_items.map((item, i) => (
                      <tr className={`text-center -mt-${(i + 4) * 2} max-w-sm py-3 px-2 text-gray-600 bg-gray-200/90 border-t border-gray-900/60 dark:border-gray-700/80 dark:bg-gray-800/80 dark:text-gray-300 rounded-lg z-${i + 2}0`} key={i}>
                        <td className="py-3  px-2 ">{item.name}</td>
                        <td className="py-3  px-2">{item.price}</td>
                        <td className="py-3  px-2">{item.quantity}</td>
                        <td className="py-3  px-2 ">{item.sku}</td>
                        <td className="-py-8  px-2">{item.price * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
            {modalData.payments && (
              <section className=" p-2 dark:text-gray-300 mt-2">
                <table className="py-3 px-2  w-full text-sm dark:text-gray-400 rounded-lg">
                  <thead>
                    <tr className="w-full max-w-sm py-3 px-2 text-gray-700 bg-gray-300/80 border-t border-blue-300/30 dark:border-gray-800/80 dark:bg-gray-900/80 dark:text-gray-200 rounded-md" >
                      <th scope="col" className="py-3 px-2 rounded-tl-lg">
                        Método de Pago
                      </th>
                      <th scope="col" className="py-3 px-2">
                        Total
                      </th>
                      <th scope="col" className="py-3 px-2">
                        Monto
                      </th>
                      <th scope="col" className="py-3 px-2">
                        Rut Pagador
                      </th>
                      <th scope="col" className="py-3 px-2 rounded-tr-lg">
                        Fecha de Pago
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.payments.map((item, i) => (
                      <tr className="text-center max-w-sm py-3 px-2 text-gray-600 bg-gray-200/90 border-t border-gray-900/60 dark:border-gray-700/80 dark:bg-gray-800/80 dark:text-gray-300 rounded-lg" >
                        <td className="py-3  px-2 rounded-bl-lg">{item.method}</td>
                        <td className="py-3  px-2">{item.payment_count}</td>
                        <td className="py-3  px-2">{item.payment_amount}</td>
                        <td className="py-3  px-2">{item.rut_pagador}</td>
                        <td className="py-3  px-2 rounded-br-lg">{item.payment_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>



            )}

            {/* glass mini footer */}
            <footer className=" flex justify-end p-5 border-t border-gray-300 dark:border-gray-700 dark:bg-gray-800/80  
            ">
              {/* <button className="button is-success">Save changes</button> */}
              {/* colocar boton en  */}

            </footer>
          </div>
        </div>
      )}
    </div>
  );
};




export default OrderTable;
