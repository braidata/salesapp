import { useState, useEffect } from 'react';
import axios from 'axios';

const VisualizadorPagos = ({ orderId }: any) => {
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
      isPdf?setIsPDF(isPdf):null;
      console.log("ispdf",isPdf,key, isPDF)
      
    }

    
  
    return key;
  }

  useEffect(() => {
    const fetchPagos = async () => {
      try {
        const response = await axios.post('/api/mysqlPayments', { order_id: orderId });
        const pagosData = response.data.payment;

        // Obtener la URL de cada imagen utilizando la API readerS
        const pagosWithImageUrls: any = await Promise.all(
          pagosData.map(async (pago: {
              [x: string]: any; imagenKey: any; 
}) => {
            if (pago.imagenUrl) {
              try {
                const readerResponse = await axios.get(`/api/readerS?key=${getKeyFromUrl(pago.imagenUrl)}`);
                return { ...pago, imagenUrl: readerResponse.data.url };
              } catch (error) {
                console.error('Error al obtener la URL de la imagen:', error);
                return pago;
              }
            }
            return pago;
          })
        );

        setPagos(pagosWithImageUrls);
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
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Pagos asociados a la orden {orderId}</h2>
      {loading ? (
        <p className="text-gray-600 dark:text-gray-400">Cargando pagos...</p>
      ) : error ? (
        <p className="text-red-500 dark:text-red-400">{error}</p>
      ) : pagos.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No se encontraron pagos para esta orden.</p>
      ) : (
        <div>
          {pagos.map((pago: any) => (
            <div key={pago.id} className="mb-8">
              <div className="overflow-x-auto">
                <table className="table-auto w-full">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">ID de Pago</th>
                      <th className="py-3 px-6 text-left">Fecha de Pago</th>
                      <th className="py-3 px-6 text-left">Rut Pagador</th>
                      <th className="py-3 px-6 text-left">Banco Destino</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 dark:text-gray-400 text-sm font-light">
                    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
                      <td className="py-3 px-6 text-left whitespace-nowrap">{pago.id}</td>
                      <td className="py-3 px-6 text-left">{pago.payment_date}</td>
                      <td className="py-3 px-6 text-left">{pago.rut_pagador}</td>
                      <td className="py-3 px-6 text-left">{pago.banco_destino}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {pago.imagenUrl && (
                <div className="mt-4">
                  <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Imagen del Pago</h3>
                  {isPDF ? (
                    <iframe src={pago.imagenUrl} width="100%" height="500px" />
                  ) : (
                    <img src={pago.imagenUrl} alt="Imagen del Pago" className="w-full h-auto rounded" />
                  )}
                </div>
              )}
              {pago.textoImg && (
                <div className="mt-4">
                  <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Texto de la Imagen</h3>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{pago.textoImg}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VisualizadorPagos;