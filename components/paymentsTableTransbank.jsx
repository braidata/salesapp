import React, { useState, useEffect } from "react";
import SalesData from "./sapSalesData";
import CreadorPagos from "../lib/creadorPagos";
import ValidatorPayments from "../lib/validatorPayments";
import { saveAs } from 'file-saver';
import { FaCopy } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import Link from "next/link";

const PaymentsTable = ({ data, dataP, functionS, functionsSP, initialPaymentId, initialOrderId }) => {
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
  const [paymentP, setPayment] = useState();
  const [paymentStatus, setPaymentStatus] = useState('Pendiente');
  const [selectedRow, setSelectedRow] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [filterId, setFilterId] = useState(initialOrderId || "");
  const [filterSapId, setFilterSapId] = useState("");
  const [filterAmmount, setFilterAmmount] = useState("");
  const [filterPaymentId, setFilterPaymentId] = useState(initialPaymentId || "");

  useEffect(() => {
    functionsSP(paymentStatus);
  }, [paymentStatus]);

  useEffect(() => {
    if (initialPaymentId) {
      setFilterPaymentId(initialPaymentId);
    }
    if (initialOrderId) {
      setFilterId(initialOrderId);
    }
  }, [initialPaymentId, initialOrderId]);

  const handlePaymentStatusChange = (status) => {
    setPaymentStatus(status);
  };

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
  const handleDelete = async (paymentId) => {
    try {
      const response = await fetch(`/api/mysqlDeleterPayments?id=${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        handleDeleteModalClose();
        functionsSP();
      } else {
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



  const handleModalClose = () => {
    setModalIsOpen(false);
  };


  const handleModalOpen = (payment, status) => {
    setModalData(payment);
    setModalStatus(status);
    setModalIsOpen(true);
  };

  const handleModalOpen2 = (payment, paymentId) => {
    
    setModalData2(payment);
    setPayment(paymentId)
    setModalIsOpen2(true);
  };

  const handleDeleteModalOpen = (payment) => {
    setDeleteModalData(payment);
    setShowDeleteModal(true);
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
    }
  };


  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = dataP?.sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const filteredData = sortedData
  ?.filter((payment) => payment.banco_destino === "transbank")
  .filter((payment) => filterId ? payment.order_id.toString().includes(filterId) : true)
  .filter((payment) => filterAmmount ? payment.payment_amount.toString().includes(filterAmmount) : true)
  .filter((payment) => filterSapId ? payment.sapId.toString().includes(filterSapId) : true)
  .filter((payment) => filterPaymentId ? payment.id.toString().includes(filterPaymentId) : true);


  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(dataP);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pagos');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'pagos.xlsx');
  };

  const handleCopyToClipboard = () => {
    const selectedPago = dataP.find((pago) => pago.id === selectedRow);
    const textToCopy = `
      ID: ${selectedPago.id}
      Order ID: ${selectedPago.order_id}
      Estado: ${selectedPago.status}
      Monto: ${selectedPago.payment_amount}
      Fecha de Pago: ${selectedPago.payment_date}
    `;
    navigator.clipboard.writeText(textToCopy);
  };

  return (
    <div className="flex flex-col px-4 py-4 mt-10 mb-24 overflow-x-auto relative shadow-md sm:rounded-lg">
      <div className="mb-8">

        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="paymentStatus">Filtrar por estado de pago:</label>
        <select
          className="block w-full p-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          id="paymentStatus"
          value={paymentStatus}
          onChange={(e) => handlePaymentStatusChange(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Validado">Validado</option>
          <option value="Doble Revisión">Doble Revisión</option>
          <option value="Rechazado">Rechazado</option>
          <option value="Borrado">Borrado</option>
        </select>
        
        <div className="flex flex-row gap-2">
        <div className="relative mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por ID de pedido:</label>
          <input
            type="text"
            value={filterId}
            onChange={(e) => setFilterId(e.target.value)}
            placeholder="Buscar por ID de Pago"
            className="block w-full p-2.5 pr-10 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          />
          {filterId && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-900 dark:text-gray-300 font-bold rounded-lg hover:text-gray-900 dark:hover:text-white transition duration-500 ease-in-out mt-8"
              onClick={() => setFilterId("")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="relative mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por ID de pedido SAP:</label>
          <input
            type="text"
            value={filterSapId}
            onChange={(e) => setFilterSapId(e.target.value)}
            placeholder="Buscar por ID de pedido SAP"
            className="block w-full p-2.5 pr-10 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          />
          {filterSapId && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-900 dark:text-gray-300 font-bold rounded-lg hover:text-gray-900 dark:hover:text-white transition duration-500 ease-in-out mt-8"
              onClick={() => setFilterSapId("")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="relative mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por Monto:</label>
          <input
            type="text"
            value={filterAmmount}
            onChange={(e) => setFilterAmmount(e.target.value)}
            placeholder="Buscar por monto"
            className="block w-full p-2.5 pr-10 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          />
          {filterAmmount && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-900 dark:text-gray-300 font-bold rounded-lg hover:text-gray-900 dark:hover:text-white transition duration-500 ease-in-out mt-8"
              onClick={() => setFilterAmmount("")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
        
      </div>
      
      </div>

      <div className="flex flex-col md:flex-row justify-end gap-2 mt-2 mb-4">
      <Link href="/pagos" passHref>
            <button
              className="px-2 py-2 mx-2 my-2 dark:text-gray-300 font-bold rounded-lg  hover:text-gray-900   border-teal-400 hover:bg-teal-600/50 text-teal-900 dark:bg-gradient-to-r dark:from-teal-400/80 dark:via-teal-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-teal-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
           mb-5 mt-5 bg-gradient-to-r from-teal-200 via-teal-100 to-green-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
            border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]"
            >
              Refrescar
            </button>
          </Link>
        {dataP?.length > 0 && (<>
          <button
            onClick={handleDownloadExcel}
            className="px-2 py-2 mx-2 my-2 dark:text-gray-300 font-bold rounded-lg  hover:text-gray-900   border-green-400 hover:bg-green-600/50 text-green-900 dark:bg-gradient-to-r dark:from-green-400/80 dark:via-green-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-green-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
           mb-5 mt-5 bg-gradient-to-r from-green-200 via-green-100 to-green-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
            border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]"
          >
            Descargar Excel
          </button>
          </>
        )}
        {selectedRow !== null && (
          <button
            onClick={handleCopyToClipboard}
            aria-label="copy"
            className="px-2 py-2 rounded-lg bg-teal-300/30 dark:bg-teal-700/30 text-teal-800 dark:text-green-100/80 font-semibold leading-none hover:text-teal-200 hover:bg-teal-300/50 drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:hover:bg-teal-400/30 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]"
          >
            Copiar Seleccionado
          </button>
        )}
      </div>

      <div style={{ maxHeight: 'full', overflowY: 'clip', marginBlock: 'auto' }}>
        <table className="min-w-full divide-y divide-gray-200 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th
                scope="col"
                onClick={() => requestSort('id')}
                className="py-2 px-2 rounded-tl-lg cursor-pointer"
              >
                ID
              </th>
              <th
                scope="col"
                onClick={() => requestSort('order_id')}
                className="py-2 px-2 cursor-pointer"
              >
                Order ID
              </th>
              <th
                scope="col"
                onClick={() => requestSort('order_id')}
                className="py-2 px-2 cursor-pointer"
              >
                SAP ID
              </th>
              <th
                scope="col"
                onClick={() => requestSort('status')}
                className="py-2 px-2 cursor-pointer"
              >
                Estado
              </th>
              <th
                scope="col"
                onClick={() => requestSort('payment_amount')}
                className="py-2 px-2 cursor-pointer"
              >
                Monto
              </th>
              <th
                scope="col"
                onClick={() => requestSort('payment_date')}
                className="py-2 px-2 cursor-pointer"
              >
                Fecha de Pago
              </th>
              <th scope="col" className="py-2 px-2 rounded-tr-lg">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData?.map((payment) => (
              <tr
                key={payment.id}
                onClick={() => setSelectedRow(payment.id)}
                className={`${selectedRow === payment.id
                  ? 'bg-gray-300 dark:bg-gray-800'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                  } bg-white border-b dark:bg-gray-900 dark:border-gray-700`}
              >
                <td className="py-4 px-2 h-24 w-4xl mx-2 my-2">{payment.id}</td>
                <td className="py-4 px-2 h-24 w-4xl mx-2 my-2">{payment.order_id}</td>
                <td className="py-4 px-2 h-24 w-4xl mx-2 my-2">{payment.sapId}</td>
                <td className="py-4 px-2 h-24 w-4xl mx-2 my-2">{payment.status}</td>
                <td className="py-4 px-2 h-24 w-4xl mx-2 my-2">{payment.payment_amount}</td>
                <td className="py-4 px-2 h-24 w-4xl mx-2 my-2">{payment.payment_date}</td>
                <td className="py-4 px-2 h-24 w-4xl mx-2 my-2">
                  <button
                    className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)] border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)] dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-semibold py-1 px-1 rounded-lg transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                    onClick={() => handleModalOpen2(payment.order_id, payment.id)}
                  >
                    Ver Pago
                  </button>
                </td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalIsOpen2 && (
        <div
          className="mt-8 mb-8 mx-4 my-4 backdrop-blur-sm bg-white/30 transition-colors duration-500 lg:z-30 lg:border-b lg:border-slate-900/10 dark:border-slate-50/[0.06] bg-white/30 supports-backdrop-blur:bg-white/30 dark:bg-transparent fixed top-0 left-0 w-full h-full z-30 flex items-center justify-center"
          id="modal"
          onClick={handleOutsideClick}
        >
          <div className="mt-8 mb-8 bg-gray-700/20 w-11/12 md:max-w-3xl mx-auto rounded shadow-lg z-30">
            <header className="mt-8 mb-8 bg-gray-300/90 flex items-center justify-between p-5 border-b border-gray-300 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-gray-600 text-xl font-semibold dark:text-gray-300">
                Validador de Pagos.
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
              </section>
              {/* <section><Posts orderId={modalData2}/></section> */}
              <section className="flex flex-col justify-center">
                <p className="mt-8 mx-4 text-2xl font-bold">Borrar Pago Id {paymentP} del pedido {modalData2}</p>
                {
                  <button
                    className="mt-8 mb-8 mx-4 w-64 bg-gradient-to-r from-red-600/40 to-red-800/40 border-2 drop-shadow-[0_9px_9px_rgba(177,0,0,0.75)]  border-red-800 hover:bg-red-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-red-500/40 dark:to-red-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(255,0,0,0.25)]  dark:border-red-200 dark:hover:bg-red-900 dark:text-gray-200 font-bold py-1 px-1 rounded-lg transform perspective-1000 transition duration-500 origin-center"
                    onClick={() => handleDeleteModalOpen(modalData2)}
                  >
                    Borrar
                  </button>
                }
              </section>
              <footer className="flex justify-end p-5 border-t border-gray-300 dark:border-gray-700 dark:bg-gray-800/80"></footer>
            </div>
          </div>
        </div>
      )}



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
                    Editar Pago
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
              <p>¿Estás seguro de que deseas eliminar este pago?</p>
              <div className="flex justify-end gap-4 mt-4">
                <button onClick={() => handleDelete(paymentP)} className="mt-2 mb-5 bg-gradient-to-r from-red-600/40 to-red-800/40 border-2 drop-shadow-[0_9px_9px_rgba(177,0,0,0.75)]  border-red-800 hover:bg-red-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-red-500/40 dark:to-red-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(255,0,0,0.25)]  dark:border-red-200 dark:hover:bg-red-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center">
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

export default PaymentsTable;
