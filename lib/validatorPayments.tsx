import React, { useEffect, useState } from 'react';
import axios from 'axios';
import VisualizatorPayments from "../lib/visualizatorPayments";
import { useSession } from "next-auth/react";
import { saveAs } from 'file-saver';
import { FaCopy } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const ValidatorPayments = ({ orderId }) => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalIsOpen2, setModalIsOpen2] = useState(false);
  const [modalData2, setModalData2] = useState({});
  const [modalDate2, setModalDate2] = useState({});
  const [modalRut2, setModalRut2] = useState({});
  const [modalStatus2, setModalStatus2] = useState("Procesando");
  const [idPago, setIdPago] = useState('');
  const [sessionInfo, setSessionInfo] = useState();
  const { data: session } = useSession();
  const [selectedRow, setSelectedRow] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

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
  }, [orderId]);


  const permisos = async () => {
    const res = await fetch("/api/mysqlPerm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session ? session.session.user.email : null,
      }),
    });
    const data = await res.json();
    console.log("el permisos: ", data.user[0].rol);
    const userRol = data ? data.user[0].permissions : "No conectado";
    console.log("el permisos2: ", data.user[0].permissions);
    //const userPerm = data ? data.user[0].permissions : "No conectado";
    setSessionInfo(userRol)

    return sessionInfo
  };

  const handleValidate = async (pagoId: any,paymentId: string, status: string, validation_date: any, observation: string) => {
    try {
      await axios.post('/api/mysqlPaymentsValidator', {
        id: paymentId,
        status: status,
        observation: "Pago gestionado con éxito",
        validation_date: new Date()
      });
      setPagos((prevPagos: any) =>
        prevPagos.map((pago: any) =>
          pago.id === paymentId ? { ...pago, status: status, validation_date: validation_date, observation: observation  } : pago
        )
      );
    } catch (error) {
      console.error('Error al validar el pago:', error);
    }
  };

  const handleModalOpen2 = (data: React.SetStateAction<{}>,id: React.SetStateAction<string>) => {

    setModalData2(data);
    setIdPago(id)
    setModalIsOpen2(true);
  };

  const handleModalClose2 = () => {
    setModalIsOpen2(false);
  };

    // Función para cerrar el modal al hacer clic fuera de él
    const handleOutsideClick = (event: { target: { id: string; }; }) => {
        if (event.target.id === "modal") {
         
          handleModalClose2();
        
        }
      };

      const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
          direction = 'descending';
        }
        setSortConfig({ key, direction });
      };
    
      const sortedData = pagos.sort((a, b) => {
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
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Pagos del Pedido</h2>
          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">Cargando pagos...</p>
          ) : error ? (
            <p className="text-red-500 dark:text-red-400">{error}</p>
          ) : pagos.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No hay pagos pendientes.</p>
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
                    {sortedData.map((pago: any) => (
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
                              <button
                                className="bg-gradient-to-r from-green-600/40 to-green-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,177,0,0.75)]  border-green-800 hover:bg-green-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-green-500/40 dark:to-green-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,0,0.25)]  dark:border-green-200 dark:hover:bg-green-900 dark:text-gray-200 font-semibold py-1 px-1 my-2 mx-2 rounded-lg transform perspective-1000 transition duration-500 origin-center mx-2"
                                onClick={() => handleValidate(orderId, pago.id, 'Validado', new Date(), 'Pago gestionado con éxito')}
                              >
                                Validar
                              </button>
                              <button
                                className="bg-gradient-to-r from-red-600/40 to-red-800/40 border-2 drop-shadow-[0_9px_9px_rgba(177,0,0,0.75)]  border-red-800 hover:bg-red-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-red-500/40 dark:to-red-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(255,0,0,0.25)]  dark:border-red-200 dark:hover:bg-red-900 dark:text-gray-200 font-semibold py-1 px-1 my-2 mx-2 rounded-lg transform perspective-1000 transition duration-500 origin-center mx-2"
                                onClick={() => handleValidate(orderId, pago.id, 'Rechazado', new Date(), 'Pago gestionado con éxito')}
                              >
                                Rechazar
                              </button>
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
                    Validación de Pagos.
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
        </div>
      );
    };
    
    export default ValidatorPayments;