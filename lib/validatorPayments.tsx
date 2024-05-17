import React, { useEffect, useState } from 'react';
import axios from 'axios';
import VisualizatorPayments from "../lib/visualizatorPayments";
import { useSession } from "next-auth/react";
import { saveAs } from 'file-saver';
import { FaCopy } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const ValidatorPayments = ({ orderId }: { orderId: string }) => {
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [modalIsOpen2, setModalIsOpen2] = useState(false);
  const [modalData2, setModalData2] = useState<any>({});
  const [modalDate2, setModalDate2] = useState<any>({});
  const [modalRut2, setModalRut2] = useState<any>({});
  const [modalStatus2, setModalStatus2] = useState<string>("Procesando");
  const [idPago, setIdPago] = useState<string>('');
  const [sessionInfo, setSessionInfo] = useState<string | undefined>();
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string | null, direction: string | null }>({ key: null, direction: null });
  const [observationModal, setObservationModal] = useState(false);
  const [observation, setObservation] = useState<string>('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string | null>('');
  const [totalPedido, setTotalPedido] = useState<number | undefined>();
  const [totalPagado, setTotalPagado] = useState<number | undefined>();
  const [totalValidado, setTotalValidado] = useState<number>(0);
  const [totalPendiente, setTotalPendiente] = useState<number>(0);
  const { data: session } = useSession();
  const [userId, setUserId] = useState<string | null>();
  const [authCode, setAuthCode] = useState<string>('');


  useEffect(() => {
    if (session) {
      setUserId(session ? session.session.user.name : null);
      const loggedInUserEmail = session ? session.session.user.name : null
      console.log("editador", loggedInUserEmail)
    }
  }, [session]);

  useEffect(() => {
    const fetchPagos = async () => {
      try {
        const response = await axios.get(`/api/mysqlPaymentsValidator?id=${orderId}`);
        setPagos(response.data);
        setLoading(false);
      } catch (error) {
        setError('Error al obtener los pagos pendientes');
        setLoading(false);
      }
    };

    fetchPagos();
    permisos();
    fetchEstadoPago(orderId);
  }, [orderId]);

  const permisos = async () => {
    const res = await fetch("/api/mysqlPerm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session ? session?.session?.user.email : null,
      }),
    });
    const data = await res.json();
    const userRol = data ? data.user[0].permissions : "No conectado";
    setSessionInfo(userRol);
    return sessionInfo;
  };
  const fetchEstadoPago = async (orderId: string) => {
    try {
      const responseTotalPedido = await axios.post(`/api/mysqlOrderAmount`, { order_id: orderId });
      const responseTotalPagado = await axios.post(`/api/mysqlPaymentsAmount`, { order_id: orderId });
      const responseTotalValidado = await axios.post(`/api/mysqlPaymentsValidatedAmount`, { order_id: orderId });
      const responseTotalPendiente = await axios.post(`/api/mysqlPaymentsPendingAmount`, { order_id: orderId });

      const totalPedido = responseTotalPedido.data.total_pedido;
      const totalPagado = responseTotalPagado.data.total_pagado;
      const totalValidado = responseTotalValidado.data.total_validado;
      const totalPendiente = responseTotalPendiente.data.total_pendiente;

      setTotalPedido(totalPedido);
      setTotalPagado(totalPagado);
      setTotalValidado(totalValidado);
      setTotalPendiente(totalPendiente);
    } catch (error) {
      console.error('Error al obtener el estado de pago:', error);
    }
  };

  const handleValidate = (pagoId: string, paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setSelectedPaymentStatus('Validado');
    setObservationModal(true);
  };

  const handleReject = (pagoId: string, paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setSelectedPaymentStatus('Rechazado');
    setObservationModal(true);
  };

  const handleConfirmValidation = async () => {
    try {
      const formattedDate = new Date().toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(',', '');

      

      await axios.post('/api/mysqlPaymentsValidator', {
        id: selectedPaymentId,
        status: selectedPaymentStatus,
        observation: observation,
        validation_date: formattedDate,
        validatedBy: userId,
        authorization_code: authCode,
      });
      setPagos((prevPagos) =>
        prevPagos.map((pago) =>
          pago.id === selectedPaymentId
            ? {
              ...pago,
              status: selectedPaymentStatus,
              validation_date: formattedDate,
              observation: observation,
              validatedBy: userId,
              authorization_code: authCode,
            }
            : pago
        )
      );
      setObservationModal(false);
      setObservation('');
      setAuthCode('');
      fetchEstadoPago(orderId); // Refresh the payment status
    } catch (error) {
      console.error('Error al validar el pago:', error);
    }
  };

  const handleModalOpen2 = (data: string, id: React.SetStateAction<string>) => {
    setModalData2(data);
    setIdPago(id);
    setModalIsOpen2(true);
  };

  const handleModalClose2 = () => {
    setModalIsOpen2(false);
  };

  const handleOutsideClick = (event: { target: { id: string; }; }) => {
    if (event.target.id === "modal") {
      handleModalClose2();
    }
  };

  const requestSort = (key: string | null) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = pagos.sort((a, b) => {
    if (!sortConfig.key) return 0; // Add this check
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(pagos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pagos');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'pagos.xlsx');
  };

  const handleCopyToClipboard = () => {
    const selectedPago = pagos.find((pago) => pago.id === selectedRow);
    const textToCopy = `
          ID de Pago: ${selectedPago.id}
          Monto: ${selectedPago.payment_amount}
          Fecha de Pago: ${selectedPago.payment_date}
          Estado: ${selectedPago.status}
        `;
    navigator.clipboard.writeText(textToCopy);
  };

  return (
    <div className="space-y-4">
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-200">Estado de Pago del Pedido</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Total del Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Total Pagado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Total Validado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Total Pendiente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-200">
                    $ {totalPedido}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-200">
                    $ {totalPagado}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-200">
                    $ {totalValidado}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-200">
                    $ {totalPendiente}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {totalValidado >= (totalPedido ?? 0) ? (
                    <div
                      className={`px-2 py-2 inline-flex text-xs leading-5 font-semibold rounded-full ${totalValidado > (totalPedido ?? 0)
                        ? 'bg-green-200 text-green-800'
                        : 'bg-gradient-to-r from-yellow-600 to-yellow-800 border-2 drop-shadow-[0_9px_9px_rgba(177,177,0,0.75)]  border-yellow-800 hover:bg-yellow-600 text-gray-800 dark:bg-gradient-to-r dark:from-yellow-500 dark:to-yellow-800 border-2 dark:drop-shadow-[0_9px_9px_rgba(255,255,0,0.25)]  dark:border-yellow-200 dark:hover:bg-yellow-900 dark:text-gray-200 font-semibold py-1 px-1 my-2 mx-2 rounded-lg transform perspective-1000 transition duration-500 origin-center mx-2'
                        }`}
                    >
                      {totalValidado > (totalPedido ?? 0)
                        ? `Saldo a favor: $ ${totalValidado - (totalPedido ?? 0)}`
                        : 'Pagado completo'}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-red-600/40 to-red-800/40 border-2 drop-shadow-[0_9px_9px_rgba(177,0,0,0.75)]  border-red-800 hover:bg-red-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-red-500/40 dark:to-red-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(255,0,0,0.25)]  dark:border-red-200 dark:hover:bg-red-900 dark:text-gray-200 font-semibold py-1 px-1 my-2 mx-2 rounded-lg transform perspective-1000 transition duration-500 origin-center mx-2">
                      Pendiente: $ {(totalPedido ?? 0) - totalValidado}
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Pagos del Pedido</h2>
      {loading ? (
        <p className="text-gray-600 dark:text-gray-200">Cargando pagos...</p>
      ) : error ? (
        <p className="text-red-500 dark:text-red-400">{error}</p>
      ) : pagos.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-200">No hay pagos pendientes.</p>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-end gap-2 mt-2 mb-4">
            {pagos.length > 0 && (
              <button
                onClick={handleDownloadExcel}
                className="px-2 py-2 rounded-lg bg-green-300/30 dark:bg-green-700/30 text-green-800 dark:text-green-100/80 font-semibold leading-none hover:text-green-200 hover:bg-green-300/50 drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:hover:bg-green-400/30 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]"
              >
                Descargar Excel
              </button>
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
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table className="min-w-full divide-y divide-gray-200 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md">
              <thead>
                <tr>
                  <th
                    onClick={() => requestSort('id')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer rounded-tl-md"
                  >
                    ID de Pago
                  </th>
                  <th
                    onClick={() => requestSort('payment_amount')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  >
                    Monto
                  </th>
                  <th
                    onClick={() => requestSort('payment_date')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  >
                    Fecha de Pago
                  </th>
                  <th
                    onClick={() => requestSort('status')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  >
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tr-md">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                {sortedData.map((pago) => (
                  <tr
                    key={pago.id}
                    onClick={() => setSelectedRow(pago.id)}
                    className={selectedRow === pago.id ? 'bg-gray-300 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-600'}
                  >
                    <td className="px-6 py-4">{pago.id}</td>
                    <td className="px-6 py-4">{pago.payment_amount}</td>
                    <td className="px-6 py-4">{pago.payment_date}</td>
                    <td className="px-6 py-4">{pago.status}</td>
                    <td className="px-6 py-4">
                      <button
                        className="bg-gradient-to-r from-blue-600/40 to-blue-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,0,177,0.75)]  border-blue-800 hover:bg-blue-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-blue-500/40 dark:to-blue-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,0,255,0.25)]  dark:border-blue-200 dark:hover:bg-blue-900 dark:text-gray-200 font-semibold py-1 px-1 my-2 mx-2 rounded-lg transform perspective-1000 transition duration-500 origin-center mx-2"
                        onClick={() => handleModalOpen2(orderId, pago.id)}
                      >
                        Revisar
                      </button>
                      {sessionInfo === "payments" || sessionInfo === "all" ? (
                        <>
                          {pago.status !== 'Validado' && pago.status !== 'Borrado' && (
                            <button
                              className="bg-gradient-to-r from-green-600/40 to-green-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,177,0,0.75)]  border-green-800 hover:bg-green-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-green-500/40 dark:to-green-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,0,0.25)]  dark:border-green-200 dark:hover:bg-green-900 dark:text-gray-200 font-semibold py-1 px-1 my-2 mx-2 rounded-lg transform perspective-1000 transition duration-500 origin-center mx-2"
                              onClick={() => handleValidate(orderId, pago.id)}
                            >
                              Validar
                            </button>
                          )}
                          {pago.status !== 'Rechazado' && pago.status !== 'Borrado' && pago.status !== 'Doble Revisión' && (
                            <button
                              className="bg-gradient-to-r from-red-600/40 to-red-800/40 border-2 drop-shadow-[0_9px_9px_rgba(177,0,0,0.75)]  border-red-800 hover:bg-red-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-red-500/40 dark:to-red-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(255,0,0,0.25)]  dark:border-red-200 dark:hover:bg-red-900 dark:text-gray-200 font-semibold py-1 px-1 my-2 mx-2 rounded-lg transform perspective-1000 transition duration-500 origin-center mx-2"
                              onClick={() => handleReject(orderId, pago.id)}
                            >
                              Rechazar
                            </button>
                          )}
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
                Visualizador de Pagos.
              </p>
              <button
                title="Cerrar"
                className="rounded-full p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-blue-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)] transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center mx-2"
                aria-label="close"
                onClick={handleModalClose2}
              >
                X
              </button>
            </header>
            <div className="max-h-[80vh] overflow-y-auto">
              <section className="p-2 dark:text-gray-300 mt-2 rounded-lg">
                <VisualizatorPayments orderId={''} paymentId={idPago} />
              </section>
              <footer className="flex justify-end p-5 border-t border-gray-300 dark:border-gray-700 dark:bg-gray-800/80"></footer>
            </div>
          </div>
        </div>
      )}
      {observationModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle">
              <div className="bg-gray-200 w-full dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start w-full">
                  <div className="w-full mt-3 text-center sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                      {selectedPaymentStatus === 'Validado' ? 'Validar Pago' : 'Rechazar Pago'}
                    </h3>
                    <div className="mt-2 flex flex-col w-full">
                      <label htmlFor="observation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 mt-4">
                        Observación:
                      </label>
                      <textarea
                        id="observation"
                        name="observation"
                        rows={3}
                        className="mt-1 px-2 py-2 block w-4xl rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-300"
                        value={observation}
                        onChange={(e) => setObservation(e.target.value)}
                      ></textarea>

                      <label htmlFor="selectedPaymentStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 mt-4">
                        Filtrar por estado de pago:
                      </label>
                      <select
                        id="selectedPaymentStatus"
                        className="mt-1 px-2 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-300"
                        value={selectedPaymentStatus}
                        onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                      >
                        <option value="">Todos</option>
                        <option value="Doble Revisión">Doble Revisión</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Validado">Validado</option>
                        <option value="Rechazado">Rechazado</option>
                        <option value="Borrado">Borrado</option>
                      </select>

                      <label htmlFor="authCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 mt-4">
                        Código de Autorización:
                      </label>
                      <input
                        id="authCode"
                        name="authCode"
                        className="mt-1 px-2 py-2 block w-4xl rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-300"
                        value={authCode}
                        onChange={(e) => setAuthCode(e.target.value)}
                      ></input>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedPaymentStatus === 'Validado' || selectedPaymentStatus === 'Doble Revisión' ? (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-green-600/40 to-green-800/40 drop-shadow-[0_9px_9px_rgba(0,177,0,0.75)]  border-green-800 hover:bg-green-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-green-500/40 dark:to-green-800/60 dark:drop-shadow-[0_9px_9px_rgba(0,255,0,0.25)]  dark:border-green-200 dark:hover:bg-green-900 dark:text-gray-200  my-2 mx-2  transform perspective-1000 transition duration-500 origin-center"
                    onClick={handleConfirmValidation}
                  >
                    Validar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-red-600/40 to-red-800/40 drop-shadow-[0_9px_9px_rgba(177,0,0,0.75)]  border-red-800 hover:bg-red-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-red-500/40 dark:to-red-800/60 dark:drop-shadow-[0_9px_9px_rgba(255,0,0,0.25)]  dark:border-red-200 dark:hover:bg-red-900 dark:text-gray-200  my-2 mx-2  transform perspective-1000 transition duration-500 origin-center"
                    onClick={handleConfirmValidation}
                  >
                    Rechazar
                  </button>
                )}
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-gray-600/40 to-gray-800/40 drop-shadow-[0_9px_9px_rgba(177,177,177,0.75)]  border-gray-800 hover:bg-gray-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-gray-500/40 dark:to-gray-800/60 dark:drop-shadow-[0_9px_9px_rgba(200,200,200,0.25)]  dark:border-gray-200 dark:hover:bg-gray-900 dark:text-gray-200  my-2 mx-2  transform perspective-1000 transition duration-500 origin-center"
                  onClick={() => setObservationModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidatorPayments;