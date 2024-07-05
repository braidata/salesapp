import React from "react";
import Link from "next/link";
import { useState, useEffect } from "react";
import ShippingModal from "../components/simpliRouteDateEditor"
import SalesData from "../components/sapSalesData"
import CreadorPagos from "../lib/creadorPagos";
import VisualizatorPayments from "../lib/visualizatorPayments";
import ValidatorPayments from "../lib/validatorPayments";
const OrderTable = ({ data, functionS }) => {
  // Estado para manejar la apertura y cierre del modal
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalData, setModalData] = useState({});
  const [modalStatus, setModalStatus] = useState("Procesando");
  // Estado para manejar la apertura y cierre del modal
  const [modalIsOpen2, setModalIsOpen2] = useState(false);
  const [modalData2, setModalData2] = useState({});
  const [modalDate2, setModalDate2] = useState({});
  const [modalRut2, setModalRut2] = useState({});
  const [modalStatus2, setModalStatus2] = useState("Procesando");
  const [modalIsOpen3, setModalIsOpen3] = useState(false);
  const [modalData3, setModalData3] = useState({});
  const [modalStatus3, setModalStatus3] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalData, setDeleteModalData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);


  // Estado para manejar los filtros
  const [filteredOrders, setFilteredOrders] = useState({});
  const [filter, setFilter] = useState({ orderId: null, status: null, companyName: null, sap: null, hubspot: null });

  useEffect(() => {
    if (data && data.orders) {
      let orders = Array.isArray(data.orders) ? data.orders : Object.values(data.orders);
      let filtered = orders;

      if (filter.orderId) {
        filtered = filtered.filter(order => order.id.toString().includes(filter.orderId));
      }

      if (filter.status) {
        filtered = filtered.filter(order => order.statusSAP.toString().includes(filter.status));
      }
      //billing_company_name
      if (filter.companyName) {
        filtered = filtered.filter(order => order.billing_company_name.toString().includes(filter.companyName));
      }

      if (filter.sap) {
        filtered = filtered.filter(order => order.respuestaSAP?.toString().includes(filter.sap));
      }

      if (filter.hubspot) {
        filtered = filtered.filter(order => order.dealId?.toString().includes(filter.hubspot));
      }

      setFilteredOrders({ orders: filtered });
    } else {
      setFilteredOrders({ orders: [] });
    }
  }, [filter, data]);

  const handleFilterChange = (newFilter) => {
    setFilter({ ...filter, ...newFilter });
  };


  // Función para manejar la presentación del formulario de edición.
  const handleEditSubmit = (event) => {
    event.preventDefault();
    // Aquí puedes enviar los datos actualizados (modalData) a tu backend para actualizar el pedido.
    // Luego de la actualización exitosa, puedes cerrar el modal y actualizar la lista de pedidos si es necesario.
  };

  const extractNumber = (text) => {
    const regex = /\d+/; // Expresión regular para encontrar números
    const match = text.match(regex);

    return match ? match[0] : '';
  };

  // Función para manejar los cambios en los campos del formulario.
  const handleInputChange = (key, value) => {
    setModalData(prevData => ({ ...prevData, [key]: value }));
  };

  // Función para manejar el evento de borrado.
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/mysqlDeleter?id=${id.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },

      });

      if (response.ok) {
        const data = await response.json();
        handleDeleteModalClose();
        functionS();
        // Manejar la respuesta
      } else {
        // Manejar errores
        console.error('Error al eliminar');
      }
    } catch (error) {
      console.error('Hubo un error', error);
    }
  };

  const handleStatus = async (id) => {
    try {
      const response = await fetch(`/api/mysqlStatus?id=${id.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },

      });

      if (response.ok) {
        const data = await response.json();
      }
    } catch (error) {
      console.error('Hubo un error', error);
    }
  };

  // Funciones para cerrar los modales.
  const handleEditModalClose = () => setShowEditModal(false);
  const handleDeleteModalClose = () => setShowDeleteModal(false);

  // Función para abrir el modal de edición y establecer los datos actuales del pedido.
  const handleEditModalOpen = (item) => {
    setModalData(item);
    setShowEditModal(true);
  };

  // Función para abrir el modal de confirmación de borrado y establecer los datos actuales del pedido.
  const handleDeleteModalOpen = (item) => {
    setDeleteModalData(item);
    setShowDeleteModal(true);
  };


  // Estado para manejar los estados de la orden


  const handleModalOpen = (data, status) => {
    setModalData(data);
    setModalStatus(status);
    setModalIsOpen(true);
  };

  const handleModalClose = () => {
    setModalIsOpen(false);
  };

  const handleModalOpen2 = (data, date, rut, status, message) => {

    setModalData2(data);
    setModalDate2(date);
    setModalRut2(rut)
    setModalStatus2(status);
    let messageId = extractNumber(message)
    setModalData3(messageId);
    setModalIsOpen2(true);

  };

  const handleModalClose2 = () => {
    setModalIsOpen2(false);
  };

  const handleModalOpen3 = (data, status) => {
    data = extractNumber(data)
    setModalData3(data);
    setModalStatus3(status);
    setModalIsOpen3(true);
  };

  const handleModalClose3 = () => {
    setModalIsOpen3(false);
  };

  // Función para cerrar el modal al hacer clic fuera de él
  const handleOutsideClick = (event) => {
    if (event.target.id === "modal") {
      handleModalClose();
      handleModalClose2();
      handleModalClose3();
      toggleModal();

    }
  };

  const clearFilter = (filterName) => {
    setFilter(prevFilters => ({
      ...prevFilters,
      [filterName]: ''
    }));
  };

  const toggleModal = () => {
    setShowModal(!showModal);
    setActiveFilter(null); // Close any active filter input when closing modal
  };

  const filterLabels = {
    orderId: 'ID',
    status: 'Estado',
    companyName: 'Razón Social',
    sap: 'ID SAP',
    hubspot: 'ID HubSpot'
  };

  const handleStatusPf = async (id) => {
    try {
      const currentStatus = await fetch(`/api/mysqlGetOrderStatus?id=${id}`).then(res => res.json());
      
      if (currentStatus.status === 'Prefacturar' || currentStatus.status === 'Facturado') {
        return false; // El pedido ya está marcado como pagado, no necesitamos hacer nada
      }
  
      const response = await fetch(`/api/mysqlStatusPreFacturar?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (response.ok) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Hubo un error', error);
      return false;
    }
  };





  return (
    <div className="flex flex-col items-center justify-center mt-10 w-full relative shadow-md sm:rounded-lg">
      <div className="flex flex-row items-center justify-center px-2"
      ><Link href="/dashboard" passHref>
        <button
          className="px-4 py-2 mx-2 my-2 dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-teal-400 hover:bg-teal-600/50 text-teal-900 dark:bg-gradient-to-r dark:from-teal-400/80 dark:via-teal-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-teal-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
        mt-48 mt-2 mb-5 bg-gradient-to-r from-teal-200 via-teal-100 to-green-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
        border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]"
        >
          Refrescar
        </button>
      </Link>
        <button
          onClick={toggleModal}
          className="px-4 py-2 mx-2 my-2 dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
        mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
        border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]">
          Filtros
        </button></div>




      {showModal && (
        <div
          className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg z-30 mb-4"
          id="modal"
          onClick={handleOutsideClick}
        >
          <div className="flex items-center justify-center overflow-auto  top-0 left-0 w-full h-full z-30 bg-white/30 dark:bg-transparent">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-full">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Filtros</h2>
                <button
                  onClick={toggleModal}
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center w-full overflow-auto mt-4 gap-2">
                {['orderId', 'status', 'companyName', 'sap', 'hubspot'].map(filter => (
                  <div key={filter} className="mb-2">
                    <button
                      onClick={() => setActiveFilter(filter)}
                      className={`block w-52 text-left px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg ${activeFilter === filter ? 'font-bold' : ''}`}>
                      {`Filtrar por ${filterLabels[filter]}`}
                    </button>
                    {activeFilter === filter && (
                      <div className="relative mt-2">
                        <input
                          type="text"
                          placeholder={`Filtrar por ${filterLabels[filter]}`}
                          value={filter[filter]}
                          onChange={(e) => handleFilterChange({ [filter]: e.target.value })}
                          className="block w-full p-2.5 pr-10 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        />
                        <button
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-900 dark:text-gray-300 font-bold rounded-lg hover:text-gray-900 dark:hover:text-white transition duration-500 ease-in-out"
                          onClick={() => clearFilter(filter)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12 4V1L8 5l4 4V6a8 8 0 11-7.53 11.36l-1.42-1.42A10 10 0 1012 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}




      <table className="text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="py-2 px-2 rounded-tl-lg">
              ID
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
            <th scope="col" className="py-2 px-2 hidden lg:flex lg:flex-row">
              HubSpot ID
            </th>
            <th scope="col" className="py-2 px-2">
              Observaciones
            </th>
            <th scope="col" className="py-2 px-2 rounded-tr-lg">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Procesa los datos y genera las filas de la tabla */}
          {filteredOrders ? Object.entries(filteredOrders).reverse().map((item, i) => (
            Object.entries(item[1]).map((item, i) => {


              if (item[1]) {


                // Procesa respuestaSAP y almacena los mensajes en un array
                let messages = [];
                let status = item[1]?.statusSAP;
                if (item[1]?.respuestaSAP) {
                  let responses = JSON.parse(item[1].respuestaSAP.split("|")[0]).RESP;
                  // if (Array.isArray(responses)) {
                  //   messages = responses.map(response => response.TEXT);
                  if (Array.isArray(responses)) {
                    // Solo guarda el primer mensaje
                    status = () => handleStatus(item[1]);
                    messages.push(responses[0].TEXT);
                  } else {
                    // status = "En SAP"
                    messages.push(responses?.TEXT);
                  }
                }

                return (
                  <tr key={i} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
                    <td
                      scope="row"
                      className="text-center py-4 px-2 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                    >
                      {item[1]?.id}
                    </td>

                    <td className="hidden lg:flex lg:flex-col py-4 px-2 w-full text-sm dark:text-gray-400">
                      {item[1]?.order_items?.map(
                        (item, i) => (

                          <p key={i} className="py-4 px-2 mt-2 mb-2 rounded-md border dark:border-blue-300/80 dark:hover:border-blue-200/80 border-gray-400 shadow
                        hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700/20 dark:hover:text-gray-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out 
                        ">{item.name}</p>
                        )
                      )}
                    </td>

                    <td className="py-4 px-2 w-24 sm:w-24 text-sm dark:text-gray-400">
                      {status === "Procesando" ? (
                        <p className="py-2 px-2 mt-2 mb-2 sm:w-24 text-center rounded-md border dark:border-yellow-300/80 dark:hover:border-yellow-200/80 border border-yellow-700 rounded shadow hover:bg-yellow-100/20 hover:text-yellow-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-yellow-700/20 dark:hover:text-yellow-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
  ">{status}</p>
                      ) : status === "Pagado" ? (
                        <p className="py-2 px-2 mt-2 mb-2 sm:w-24 text-center rounded-md border dark:border-green-300/80 dark:hover:border-green-200/80 border border-green-600 rounded shadow hover:bg-green-200/20 hover:text-green-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-green-700/20 dark:hover:text-green-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
  ">{status}</p>
                      ) : status === "Error SAP" ? (
                        <p className="py-2 px-2 mt-2 mb-2 sm:w-24 text-center rounded-md border dark:border-red-300/80 dark:hover:border-red-200/80 border border-red-800 rounded shadow hover:bg-red-100/20 hover:text-red-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-red-700/20 dark:hover:text-red-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
  ">{status}</p>
                      ) : status === "Borrado" ? (
                        <p className="py-2 px-2 mt-2 mb-2 sm:w-24 text-center rounded-md border  dark:border-gray-300/80 border border-gray-400 rounded shadow hover:bg-gray-100/20 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700/20 dark:hover:text-gray-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
  ">{status}</p>
                      ) : (
                        <p className="py-2 px-2 mt-2 mb-2 sm:w-24 text-center rounded-md border dark:border-blue-300/80 dark:hover:border-blue-200/80 border border-blue-700 rounded shadow hover:bg-blue-100/20 hover:text-blue-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-blue-700/20 dark:hover:text-blue-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
  ">{status}</p>
                      )}

                    </td>

                    <td className="py-4 px-2 text-sm dark:text-gray-400">
                      {item[1]?.billing_company_name}
                    </td>

                    <td
                      scope="row"
                      className="hidden lg:flex lg:flex-row text-center py-4 px-2 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                    >
                      {item[1]?.dealId}
                      
                    </td>

                    <td>
                      {/* Muestra cada mensaje */}
                      {messages.map((message, index) => (
                        <div key={index}>
                          <p className="py-4 px-2 mt-2 mb-2 rounded-md border dark:border-blue-300/80 dark:hover:border-blue-200/80 border border-gray-400 rounded shadow
                        hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700/20 dark:hover:text-gray-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
                        ">{message} </p>


                          <button className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center" onClick={() => handleModalOpen3(message, status)}>
                            Info SAP
                          </button>

                        </div>
                      ))}
                    </td>

                    <td className="w-full sm:w-24 py-4 px-2 text-sm dark:text-gray-400">
                      
                      <button className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center" onClick={() => handleModalOpen(item[1], status)}>
                        Ver +
                      </button>
                      
                      {status === "Borrado" ? null :
                        <>
                        {status !== "Prefacturar"&&status !== "Agendado"&&status !== "Procesado"&&status !== "Facturar"&&status !== "Facturado"&&status !== "Pagado"&&item[1].order_class==='ZVFA'?<button className="mt-2 mb-5 bg-gradient-to-r from-orange-600/40 to-orange-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,177,60,0.75)]  border-orange-800 hover:bg-orange-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-orange-500/40 dark:to-orange-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,0,0.25)]  dark:border-orange-200 dark:hover:bg-orange-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center" onClick={() => handleStatusPf(item[1].id)}>
                              Facturar
                            </button>:null}
                          {messages.map((message, index) => (

                            <button className="mt-2 mb-5 bg-gradient-to-r from-green-600/40 to-green-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,177,60,0.75)]  border-green-800 hover:bg-green-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-green-500/40 dark:to-green-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,0,0.25)]  dark:border-green-200 dark:hover:bg-green-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center" onClick={() => handleModalOpen2(item[1].id, item[1].order_date, item[1].billing_company_rut, status, message)}>
                              Pagos
                            </button>
                          ))}
                          <button className="mt-2 mb-5 bg-gradient-to-r from-red-600/40 to-red-800/40 border-2 drop-shadow-[0_9px_9px_rgba(177,0,0,0.75)]  border-red-800 hover:bg-red-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-red-500/40 dark:to-red-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(255,0,0,0.25)]  dark:border-red-200 dark:hover:bg-red-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center" onClick={() => handleDeleteModalOpen(item[1])}>
                            Borrar
                          </button></>}

                    </td>
                  </tr>
                )
              }

              else if (item[0]) {


                // Procesa respuestaSAP y almacena los mensajes en un array
                let messages = [];
                let status = item[0]?.statusSAP;
                if (item[0]?.respuestaSAP) {
                  let responses = JSON.parse(item[0].respuestaSAP.split("|")[0]).RESP;
                  // if (Array.isArray(responses)) {
                  //   messages = responses.map(response => response.TEXT);
                  if (Array.isArray(responses)) {
                    // Solo guarda el primer mensaje
                    status = () => handleStatus(item[0]);
                    messages.push(responses[0].TEXT);
                  } else {
                    // status = "En SAP"
                    messages.push(responses?.TEXT);
                  }
                }

                return (
                  <tr key={i} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
                    <td
                      scope="row"
                      className="text-center py-4 px-2 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                    >
                      {item[0]?.id}
                    </td>

                    <td className="hidden lg:flex lg:flex-col py-4 px-2 w-full text-sm dark:text-gray-400">
                      {item[0]?.order_items?.map(
                        (item, i) => (

                          <p key={i} className="py-4 px-2 mt-2 mb-2 rounded-md border dark:border-blue-300/80 dark:hover:border-blue-200/80 border-gray-400 shadow
                        hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700/20 dark:hover:text-gray-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out 
                        ">{item.name}</p>
                        )
                      )}
                    </td>

                    <td className="py-4 px-2 w-24 sm:w-24 text-sm dark:text-gray-400">
                      {status === "Procesando" ? (
                        <p className="py-2 px-2 mt-2 mb-2 sm:w-24 text-center rounded-md border dark:border-yellow-300/80 dark:hover:border-yellow-200/80 border border-yellow-700 rounded shadow hover:bg-yellow-100/20 hover:text-yellow-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-yellow-700/20 dark:hover:text-yellow-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
  ">{status}</p>
                      ) : status === "Facturado" ? (
                        <p className="py-2 px-2 mt-2 mb-2 sm:w-24 text-center rounded-md border dark:border-green-300/80 dark:hover:border-green-200/80 border border-green-600 rounded shadow hover:bg-green-200/20 hover:text-green-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-green-700/20 dark:hover:text-green-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
  ">{status}</p>
                      ) : status === "Error SAP" ? (
                        <p className="py-2 px-2 mt-2 mb-2 sm:w-24 text-center rounded-md border dark:border-red-300/80 dark:hover:border-red-200/80 border border-red-800 rounded shadow hover:bg-red-100/20 hover:text-red-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-red-700/20 dark:hover:text-red-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
  ">{status}</p>
                      ) : status === "Borrado" ? (
                        <p className="py-2 px-2 mt-2 mb-2 sm:w-24 text-center rounded-md border  dark:border-gray-300/80 border border-gray-400 rounded shadow hover:bg-gray-100/20 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700/20 dark:hover:text-gray-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
  ">{status}</p>
                      ) : (
                        <p className="py-2 px-2 mt-2 mb-2 sm:w-24 text-center rounded-md border dark:border-blue-300/80 dark:hover:border-blue-200/80 border border-blue-700 rounded shadow hover:bg-blue-100/20 hover:text-blue-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-blue-700/20 dark:hover:text-blue-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
  ">{status}</p>
                      )}

                    </td>

                    <td className="py-4 px-2 text-sm dark:text-gray-400">
                      {item[0]?.billing_company_name}
                    </td>

                    <td
                      scope="row"
                      className="hidden lg:flex lg:flex-row text-center py-4 px-2 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                    >
                      {item[0]?.dealId}
                    </td>

                    <td>
                      {/* Muestra cada mensaje */}
                      {messages.map((message, index) => (
                        <div key={index}>
                          <p className="py-4 px-2 mt-2 mb-2 rounded-md border dark:border-blue-300/80 dark:hover:border-blue-200/80 border border-gray-400 rounded shadow
                        hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700/20 dark:hover:text-gray-300 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out
                        ">{message} </p>


                          <button className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center" onClick={() => handleModalOpen3(message, status)}>
                            Info SAP
                          </button>

                        </div>
                      ))}
                    </td>

                    <td className="w-full sm:w-24 py-4 px-2 text-sm dark:text-gray-400">
                      <button className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center" onClick={() => handleModalOpen(item[1], status)}>
                        Ver +
                      </button>
                      {status === "Borrado" ? null :
                        <>
                          {messages.map((message, index) => (

                            <button className="mt-2 mb-5 bg-gradient-to-r from-green-600/40 to-green-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,177,60,0.75)]  border-green-800 hover:bg-green-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-green-500/40 dark:to-green-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,0,0.25)]  dark:border-green-200 dark:hover:bg-green-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center" onClick={() => handleModalOpen2(item.id, item.order_date, item.billing_company_rut, status, message)}>
                              Pagos
                            </button>
                          ))}
                          <button className="mt-2 mb-5 bg-gradient-to-r from-red-600/40 to-red-800/40 border-2 drop-shadow-[0_9px_9px_rgba(177,0,0,0.75)]  border-red-800 hover:bg-red-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-red-500/40 dark:to-red-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(255,0,0,0.25)]  dark:border-red-200 dark:hover:bg-red-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center" onClick={() => handleDeleteModalOpen(item)}>
                            Borrar
                          </button></>}

                    </td>
                  </tr>
                )
              }
            }

            )
          )) : null}
        </tbody>
      </table>
      {modalIsOpen && (
        <div
          className="backdrop-blur-sm bg-white/30 transition-colors duration-500 lg:z-50 lg:border-b lg:border-slate-900/10 dark:border-slate-50/[0.06] bg-white/30 supports-backdrop-blur:bg-white/30 dark:bg-transparent fixed top-0 left-0 w-full h-full z-50 flex items-center justify-center overflow-auto"
          id="modal"
          onClick={handleOutsideClick}
        >
          {/* modal-background gradient */}
          {/* <div className=" bg-gray-900 bg-opacity-30 absolute w-full h-full z-0   
          "></div> */}
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
                      Empresa
                    </th>
                    <th scope="col" className="py-3 px-2 hidden lg:flex lg:flex-row">
                      Tipo de Entrega
                    </th>
                    {/* <th scope="col" className="py-3 px-2 hidden lg:flex lg:flex-row">
                      Teléfono
                    </th>
                    <th scope="col" className="py-3 px-2 hidden lg:flex lg:flex-row">
                      Rut
                    </th> */}
                    <th scope="col" className="py-3 px-2">
                      Fecha de Entrega</th>
                    <th scope="col" className="py-3 px-2">
                      Rut de Empresa
                    </th>


                  </tr>
                </thead>
                <tbody>
                  <tr className="text-center max-w-sm py-3 px-2 text-gray-600 bg-gray-200/90 border-t border-gray-900/60 dark:border-gray-700/80 dark:bg-gray-800/80 dark:text-gray-300 rounded-lg
                  ">
                    <td className="py-3 px-2 rounded-bl-lg">{modalData.id}</td>
                    <td className="py-3 px-2">{modalData.billing_company_name}</td>
                    <td className="py-3 px-2 hidden lg:flex lg:flex-row">{modalData.Shipping_Tipo_de_Despacho.replace(/_/g, " ")}</td>
                    <td className="py-3 px-2">{modalData.Shipping_Fecha_de_Despacho_o_Retiro}</td>
                    
                    <td className="py-3 px-2 hidden lg:flex lg:flex-row">{modalData.billing_company_rut}</td>
                    
                  </tr>
                </tbody>
              </table>
            </section>
            {modalData.order_items && (
              <section className=" p-2 dark:text-gray-300 mt-2">
                <table className="py-3 px-2  w-full text-sm dark:text-gray-400 rounded-lg">
                  <thead>
                    <tr className="w-full max-w-sm py-3 px-2 text-gray-700 dark:text-gray-200  bg-gray-300/80 border-b border-blue-300/30 dark:border-gray-800/80 dark:bg-gray-900/80 rounded-md">
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
                      <th scope="col" className="py-3 px-2 ">
                        % Descuento
                      </th>
                      <th scope="col" className="py-3 px-2 ">
                        Almacén
                      </th>
                      <th scope="col" className="py-3 px-2 rounded-tr-lg">
                        Totales
                      </th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {modalData.order_items.map((item, i) => (
                      <tr
                        className={`text-center -mt-${(i + 4) * 2} max-w-sm py-3 px-2 text-gray-600 bg-gray-200/90 border-t border-gray-900/60 dark:border-gray-700/80 dark:bg-gray-800/80 dark:text-gray-300 rounded-lg z-${i + 2}0`}
                        key={i}
                      >
                        <td className="py-3 px-2 ">{item.name}</td>
                        <td className="py-3 px-2">{item.price / item.quantity}</td>
                        <td className="py-3 px-2">{item.quantity}</td>
                        <td className="py-3 px-2 ">{item.sku}</td>
                        <td className="py-3 px-2 ">{item.discount = isNaN(item.discount) ? 0 : item.discount}</td>
                        <td className="py-3 px-2 ">{modalData.almacen}</td>
                        <td className="-py-8 px-2">{item.price}</td>
                      </tr>
                    ))}
                    <tr className="text-center py-3 px-2 text-gray-600 bg-gray-200/90 border-t border-gray-900/60 dark:border-gray-700/80 dark:bg-gray-800/80 dark:text-gray-300 rounded-lg">
                      <td colSpan="6" className="py-3 px-2 text-right text-gray-700 dark:text-gray-200">Total:</td>
                      <td className="py-3 px-2">
                        {modalData.order_items.reduce((total, item) => total + parseFloat(item.price), 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>
            )}
            {modalData && (
              <section className=" p-2 dark:text-gray-300 mt-2">
                <table className="py-3 px-2  w-full text-sm dark:text-gray-400 rounded-lg">
                  <thead>
                    <tr className="w-full max-w-sm py-3 px-2 text-gray-700 bg-gray-300/80 border-t border-blue-300/30 dark:border-gray-800/80 dark:bg-gray-900/80 dark:text-gray-200 rounded-md" >
                      <th scope="col" className="py-3 px-2 rounded-tl-lg">
                        Tipo de Dirección
                      </th>
                      <th scope="col" className="py-3 px-2">
                        Calle
                      </th>
                      <th scope="col" className="py-3 px-2">
                        Número
                      </th>
                      <th scope="col" className="py-3 px-2">
                        Depto.
                      </th>
                      <th scope="col" className="py-3 px-2">
                        Comuna
                      </th>
                      <th scope="col" className="py-3 px-2">
                        Ciudad
                      </th>
                      <th scope="col" className="py-3 px-2 rounded-tr-lg">
                        Región
                      </th>
                    </tr>
                  </thead>
                  <tbody>

                    <tr className="text-center max-w-sm py-3 px-2 text-gray-600 bg-gray-200/90 border-t border-gray-900/60 dark:border-gray-700/80 dark:bg-gray-800/80 dark:text-gray-300 rounded-lg" >
                      <td className="py-3  px-2 rounded-bl-lg">DIRECCIÓN FACTURACIÓN</td>
                      <td className="py-3  px-2 rounded-bl-lg">{modalData.billing_street}</td>
                      <td className="py-3  px-2">{modalData.billing_number}</td>
                      <td className="py-3  px-2">{modalData.billing_department}</td>
                      <td className="py-3  px-2">{modalData.billing_commune}</td>
                      <td className="py-3  px-2">{modalData.billing_city}</td>
                      <td className="py-3  px-2 rounded-br-lg">{modalData.billing_region}</td>
                    </tr>
                    {modalData.Shipping_street ? <tr className="text-center max-w-sm py-3 px-2 text-gray-600 bg-gray-200/90 border-t border-gray-900/60 dark:border-gray-700/80 dark:bg-gray-800/80 dark:text-gray-300 rounded-lg" >
                      <td className="py-3  px-2 rounded-bl-lg">DIRECCIÓN ENVÍO</td>
                      <td className="py-3  px-2">{modalData.Shipping_street}</td>
                      <td className="py-3  px-2">{modalData.Shipping_number}</td>
                      <td className="py-3  px-2">{modalData.Shipping_department}</td>
                      <td className="py-3  px-2">{modalData.Shipping_commune}</td>
                      <td className="py-3  px-2">{modalData.Shipping_city}</td>
                      <td className="py-3  px-2 rounded-br-lg">{modalData.Shipping_region}</td>
                    </tr> : ""}

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

      {modalIsOpen2 && (
        <div
          className="mt-8 mb-8 mx-4 my-4 backdrop-blur-sm bg-white/30 transition-colors duration-500 lg:z-30 lg:border-b lg:border-slate-900/10 dark:border-slate-50/[0.06] bg-white/30 supports-backdrop-blur:bg-white/30 dark:bg-transparent fixed top-0 left-0 w-full h-full z-30 flex items-center justify-center"
          id="modal"
          onClick={handleOutsideClick}
        >
          <div className="mt-8 mb-8 bg-gray-700/20 w-11/12 md:max-w-3xl mx-auto rounded shadow-lg z-30">
            <header className="mt-8 mb-8 bg-gray-300/90 flex items-center justify-between p-5 border-b border-gray-300 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-gray-600 text-xl font-semibold dark:text-gray-300">
                Creador y consulta de Pagos.
              </p>
              <button
                title="Cerrar"
                className="rounded-full p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-green-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)] transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                aria-label="close"
                onClick={handleModalClose2}
              >
                X
              </button>
            </header>
            <div className="max-h-[80vh] overflow-y-auto">
              <section className="p-2 dark:text-gray-300 mt-2 rounded-lg">
                <ValidatorPayments orderId={modalData2} />
                <CreadorPagos orderId={modalData2} orderDate={modalDate2} rut={modalRut2} sapId={modalData3} />
                {/* <VisualizatorPayments orderId={modalData2} /> */}

              </section>
              <footer className="flex justify-end p-5 border-t border-gray-300 dark:border-gray-700 dark:bg-gray-800/80"></footer>
            </div>
          </div>
        </div>
      )}

      {/* {modalIsOpen2 && (
        <div
          className="backdrop-blur-sm bg-white/30 transition-colors duration-500 lg:z-50 lg:border-b lg:border-slate-900/10 dark:border-slate-50/[0.06] bg-white/30 supports-backdrop-blur:bg-white/30 dark:bg-transparent fixed top-0 left-0 w-full h-full z-50 flex items-center justify-center overflow-auto"
          id="modal"
          onClick={handleOutsideClick}
        >
     

          <div className=" bg-gray-700/20 w-11/12 md:max-w-3xl mx-auto rounded shadow-lg z-50 overflow-y-auto 
          ">
          
            <header className="bg-gray-300/90 flex items-center justify-between p-5 border-b border-gray-300 dark:border-gray-700 dark:bg-gray-800 
            ">
       
              <p className="text-gray-600  text-xl font-semibold dark:text-gray-300 
              ">Editar Fecha de Envío</p>
              <button
                title="Cerrar"
                className="rounded-full p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-green-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]
                transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                aria-label="close"
                onClick={handleModalClose2}
              >X</button>
            </header>
      
            <section className=" p-2 dark:text-gray-300 mt-2 rounded-lg">

              <ShippingModal order={modalData2} onClose={handleModalClose2} />

            </section>





            <footer className=" flex justify-end p-5 border-t border-gray-300 dark:border-gray-700 dark:bg-gray-800/80  
            ">


            </footer>
          </div>
        </div>
      )}
     */}

      {modalIsOpen3 && (
        <div
          className="backdrop-blur-sm bg-white/30 transition-colors duration-500 lg:z-50 lg:border-b lg:border-slate-900/10 dark:border-slate-50/[0.06] bg-white/30 supports-backdrop-blur:bg-white/30 dark:bg-transparent fixed inset-0 z-50 flex items-center justify-center overflow-auto"
          id="modal"
          onClick={handleOutsideClick}
        > {/* modal-background gradient */}
          <div className="bg-gray-900 bg-opacity-30 absolute w-11/12 md:w-4/5 lg:w-3/5 xl:w-1/2 max-h-[90vh] overflow-hidden flex flex-col">
            {/* modal-card */}
            {/* <div className="bg-gray-700/20 w-11/12 md:max-w-3xl mx-auto rounded shadow-lg z-50 overflow-hidden"> */}
            {/* modal-card-head */}
            <header className="bg-gray-300/90 flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700 dark:bg-gray-800">
              {/* modal-card-title */}
              <p className="text-gray-600 text-xl font-semibold dark:text-gray-300">Detalles del Pedido en SAP</p>
              <button
                title="Cerrar"
                className="rounded-full p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-green-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)] transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                aria-label="close"
                onClick={handleModalClose3}
              >
                X
              </button>
            </header>
            {/* modal-card-body <CreadorPagos/>*/}
            <section className="p-4 overflow-auto dark:text-gray-300 mt-2 rounded-lg">
              <SalesData salesOrder={modalData3} />
            </section>
          </div>
        </div>
      )}



      {showEditModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto ">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity mt-24">

              <div className="inline-block  align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-y-auto max-h-[calc(100%-10rem)] shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div className="flex flex-row justify-end">
                  <button
                    title="Cerrar"
                    className="mt-4 rounded-full p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-green-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]
                transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                    aria-label="close"
                    onClick={handleEditModalClose}
                  >X</button>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                    Editar Pedido
                  </h3>

                  <form onSubmit={handleEditSubmit}>
                    {Object.entries(modalData).map(([key, value]) => (
                      <div key={key} className="mb-4">

                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={key}>
                          {key}
                        </label>
                        <input
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          id={key}
                          type="text"
                          value={value}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                        />
                      </div>
                    ))}
                    <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                      Actualizar
                    </button>
                  </form>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="backdrop-blur-sm bg-white/30 transition-colors duration-500 lg:z-50 lg:border-b lg:border-slate-900/10 dark:border-slate-50/[0.06] bg-white/30 supports-backdrop-blur:bg-white/30 dark:bg-transparent fixed inset-0 z-50 flex items-center justify-center overflow-auto"
          id="modal"
          onClick={handleDeleteModalClose}>
          {/* <div className="bg-gray-900 bg-opacity-30 absolute w-full h-full z-0"></div> */}
          <div className="bg-gray-700/20 w-11/12 md:max-w-3xl mx-auto rounded shadow-lg z-50 overflow-y-auto">
            <header className="bg-gray-300/90 flex items-center justify-between p-5 border-b border-gray-300 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-gray-600 text-xl font-semibold dark:text-gray-300">Confirmar Eliminación</p>
              <button
                title="Cerrar"
                className="rounded-full p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-green-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)] transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                aria-label="close"
                onClick={handleDeleteModalClose}
              >
                X
              </button>
            </header>
            <section className="p-8 dark:text-gray-300 mt-2 rounded-lg">
              <p>¿Estás seguro de que deseas eliminar este pedido?</p>
              <div className="flex justify-end gap-4 mt-4">
                <button onClick={() => handleDelete(deleteModalData)} className="mt-2 mb-5 bg-gradient-to-r from-red-600/40 to-red-800/40 border-2 drop-shadow-[0_9px_9px_rgba(177,0,0,0.75)]  border-red-800 hover:bg-red-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-red-500/40 dark:to-red-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(255,0,0,0.25)]  dark:border-red-200 dark:hover:bg-red-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center">
                  Borrar
                </button>
                <button onClick={handleDeleteModalClose} className="mt-2 mb-5 bg-gradient-to-r from-gray-600/40 to-gray-800/40 border-2 drop-shadow-[0_9px_9px_rgba(35,35,35,0.75)]  border-gray-800 hover:bg-gray-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-gray-500/40 dark:to-gray-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(190,190,190,0.25)]  dark:border-gray-200 dark:hover:bg-gray-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center">
                  Cancelar
                </button>
              </div>
            </section>
          </div>
        </div>
      )}


    </div>

  );
};




export default OrderTable;


