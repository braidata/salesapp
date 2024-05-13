import { useState, useEffect } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { FaCopy } from 'react-icons/fa'
import * as XLSX from 'xlsx';
const VisualizadorPagos = ({ orderId, paymentId }: { orderId: string; paymentId: string }) => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  let [isPDF, setIsPDF] = useState<boolean>();
  const [selectedRow, setSelectedRow] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [showModal, setShowModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  function getKeyFromUrl(url: string) {
    const bucketPattern = /^https?:\/\/([^/]+)\/(.+?)\?/;
    const match = url.match(bucketPattern);
    let key = null;
    let isPdf = null;

    if (match) {
      key = match[2];
      isPdf = key.endsWith('.pdf');
      isPdf ? setIsPDF(isPdf) : null;
      console.log("ispdf", isPdf, key, isPDF);
    }

    return key;
  }

  useEffect(() => {
    const fetchPagos = async () => {
      try {
        const response = await axios.get(`/api/mysqlPaymentsOne?payment_id=${paymentId}`);
        const pagoData = response.data;

        let pagoWithImageUrl = pagoData;
        if (pagoData.imagenUrl) {
          try {
            const readerResponse = await axios.get(`/api/readerS?key=${getKeyFromUrl(pagoData.imagenUrl)}`);
            pagoWithImageUrl = { ...pagoData, imagenUrl: readerResponse.data.url };
          } catch (error) {
            console.error('Error al obtener la URL de la imagen:', error);
          }
        }

        setPagos([pagoWithImageUrl]);
        setLoading(false);
      } catch (error) {
        setError('Error al obtener los pagos');
        setLoading(false);
      }
    };

    fetchPagos();
  }, [orderId]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  }

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
      Método de pago: ${selectedPago.payment_method}
      Código de autorización: ${selectedPago.authorization_code}
      Monto: ${selectedPago.payment_amount}
      Fecha de pago: ${selectedPago.payment_date}
      RUT pagador: ${selectedPago.rut_pagador}
      Observación: ${selectedPago.observation}
      Fecha de orden: ${selectedPago.order_date}
      Fecha de validación: ${selectedPago.validation_date}
      Equipo: ${selectedPago.team}
      Banco destino: ${selectedPago.banco_destino}
      RUT cliente: ${selectedPago.rut_cliente}
      Estado: ${selectedPago.status}
    `;
    navigator.clipboard.writeText(textToCopy);
  };

  const handleImageClick = () => {
    setShowModal(true);
    navigator.clipboard.writeText(pagos[0].textoImg);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
        Pago asociado a la orden {orderId}
      </h2>
      {loading ? (
        <p className="text-gray-600 dark:text-gray-400">Cargando pago...</p>
      ) : error ? (
        <p className="text-red-500 dark:text-red-400">{error}</p>
      ) : pagos.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No se encontró el pago para esta orden.</p>
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
                    onClick={() => requestSort('payment_method')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer rounded-tl-md"
                  >
                    Método de pago
                  </th>
                  <th
                    onClick={() => requestSort('authorization_code')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  >
                    Código de autorización
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
                    Fecha de pago
                  </th>
                  <th
                    onClick={() => requestSort('rut_pagador')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  >
                    RUT pagador
                  </th>
                  <th
                    onClick={() => requestSort('observation')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  >
                    Observación
                  </th>
                  <th
                    onClick={() => requestSort('order_date')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  >
                    Fecha de orden
                  </th>
                  <th
                    onClick={() => requestSort('validation_date')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  >
                    Fecha de validación
                  </th>
                  <th
                    onClick={() => requestSort('team')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  >
                    Equipo
                  </th>
                  <th
                    onClick={() => requestSort('banco_destino')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  >
                    Banco destino
                  </th>
                  <th
                    onClick={() => requestSort('rut_cliente')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  >
                    RUT cliente
                  </th>
                  <th
                    onClick={() => requestSort('status')}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer rounded-tr-md"
                  >
                    Estado
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
                    <td className="px-6 py-4">{pago.payment_method}</td>
                    <td className="px-6 py-4">{pago.authorization_code}</td>
                    <td className="px-6 py-4">{pago.payment_amount}</td>
                    <td className="px-6 py-4">{pago.payment_date}</td>
                    <td className="px-6 py-4">{pago.rut_pagador}</td>
                    <td className="px-6 py-4">{pago.observation}</td>
                    <td className="px-6 py-4">{pago.order_date}</td>
                    <td className="px-6 py-4">{pago.validation_date}</td>
                    <td className="px-6 py-4">{pago.team}</td>
                    <td className="px-6 py-4">{pago.banco_destino}</td>
                    <td className="px-6 py-4">{pago.rut_cliente}</td>
                    <td className="px-6 py-4">{pago.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>{pagos[0].imagenUrl && (
            <div className="mt-4 relative">
              {isPDF ? (
                <iframe src={pagos[0].imagenUrl} width="100%" height="500px" />
              ) : (
                <img
                  src={pagos[0].imagenUrl}
                  alt={pagos[0].textoImg}
                  className="w-full h-auto rounded dark:brightness-75 cursor-pointer"
                  onClick={handleImageClick}
                />
              )}
              <div
                className="absolute top-0 right-0 p-2 bg-gray-800 bg-opacity-50 rounded-bl-md text-white cursor-pointer"
                onClick={handleImageClick}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <FaCopy />
              </div>
              {showTooltip && (
                <div className="absolute top-10 right-0 bg-gray-800 text-white px-2 py-1 rounded text-sm">
                  Copiado
                </div>
              )}
            </div>
          )}
          {showModal && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                  &#8203;
                </span>
                <div
                  className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="modal-headline"
                >
                  <div className="bg-gray-300 dark:bg-gray-700 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left ">
                        <h3 className="text-lg leading-6 font-medium dark:text-gray-200 text-gray-900" id="modal-headline">
                          Texto extraído
                        </h3>
                        <div className="mt-2 bg-gray-300 dark:bg-gray-700">
                          <p className="text-sm text-gray-500 dark:text-gray-200 bg-gray-300 dark:bg-gray-700 whitespace-pre-wrap">{pagos[0].textoImg}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-300 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md sm:ml-3 sm:w-auto sm:text-sm mt-2 mb-5 bg-gradient-to-r from-gray-600/40 to-gray-800/40 border-2 drop-shadow-[0_9px_9px_rgba(35,35,35,0.75)]  border-gray-800 hover:bg-gray-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-gray-500/40 dark:to-gray-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(190,190,190,0.25)]  dark:border-gray-200 dark:hover:bg-gray-900 dark:text-gray-200 transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center px-2 py-2"
                      onClick={() => setShowModal(false)}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}</>)}




    </div>
  )
}



export default VisualizadorPagos;