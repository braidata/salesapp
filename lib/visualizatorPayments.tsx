import { useState, useEffect } from 'react';
import axios from 'axios';

const VisualizadorPagos = ({ orderId, paymentId }: { orderId: string; paymentId: string }) => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  let [isPDF, setIsPDF] = useState<boolean>();

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
        <div className="space-y-8">
          <div key={pagos[0].id} className="bg-white dark:bg-gray-700 rounded-md shadow p-6">
            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300 dark:bg-gray-900 bg-gray-200">Estado: {pagos[0].status}</p>
              <p className="text-gray-700 dark:text-gray-300">Método de pago: {pagos[0].payment_method}</p>
              <p className="text-gray-700 dark:text-gray-300">Código de autorización: {pagos[0].authorization_code}</p>
              <p className="text-gray-700 dark:text-gray-300">Monto: {pagos[0].payment_amount}</p>
              <p className="text-gray-700 dark:text-gray-300">Fecha de pago: {pagos[0].payment_date}</p>
              <p className="text-gray-700 dark:text-gray-300">RUT pagador: {pagos[0].rut_pagador}</p>
              <p className="text-gray-700 dark:text-gray-300">Observación: {pagos[0].observation}</p>
              <p className="text-gray-700 dark:text-gray-300">Fecha de orden: {pagos[0].order_date}</p>
              <p className="text-gray-700 dark:text-gray-300">Fecha de validación: {pagos[0].validation_date}</p>
              <p className="text-gray-700 dark:text-gray-300">Equipo: {pagos[0].team}</p>
              <p className="text-gray-700 dark:text-gray-300">Banco destino: {pagos[0].banco_destino}</p>
              <p className="text-gray-700 dark:text-gray-300">RUT cliente: {pagos[0].rut_cliente}</p>
            </div>
            {pagos[0].imagenUrl && (
              <div className="mt-4">
                {isPDF ? (
                  <iframe src={pagos[0].imagenUrl} width="100%" height="500px" />
                ) : (
                  <img src={pagos[0].imagenUrl} alt={pagos[0].textoImg} className="w-full h-auto rounded dark:brightness-75" />
                )}
              </div>
            )}
            {pagos[0].textoImg && (
              <div className="mt-4">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{pagos[0].textoImg}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualizadorPagos;