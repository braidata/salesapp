import React, { useEffect, useState } from 'react';
import axios from 'axios';
import VisualizatorPayments from "../lib/visualizatorPayments";

const ValidatorPayments = ({ orderId }) => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalIsOpen2, setModalIsOpen2] = useState(false);
  const [modalData2, setModalData2] = useState({});
  const [modalDate2, setModalDate2] = useState({});
  const [modalRut2, setModalRut2] = useState({});
  const [modalStatus2, setModalStatus2] = useState("Procesando");
  const [idPago, setIdPago] = useState('')

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
  }, [orderId]);

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

  return (
    <div className="space-y-4">
        
      <h2 className="text-2xl font-bold">Validación de Pagos</h2>
      {loading ? (
        <p>Cargando pagos...</p>
      ) : error ? (
        <p>{error}</p>
      ) : pagos.length === 0 ? (
        <p>No hay pagos pendientes.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              <th className="py-2 px-4">ID de Pago</th>
              <th className="py-2 px-4">Monto</th>
              <th className="py-2 px-4">Fecha de Pago</th>
              <th className="py-2 px-4">Estado</th>
              <th className="py-2 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((pago: any) => (
              <tr key={pago.id}>
                <td className="py-2 px-4">{pago.id}</td>
                <td className="py-2 px-4">{pago.payment_amount}</td>
                <td className="py-2 px-4">{pago.payment_date}</td>
                <td className="py-2 px-4">{pago.status}</td>
                <td className="py-2 px-4">
                <button
                    className="py-1 px-2 bg-blue-500 text-white rounded mr-2"
                    onClick={() => handleModalOpen2(orderId,pago.id)}
                  >
                    Revisar
                  </button>
                  <button
                    className="py-1 px-2 bg-blue-600 text-white rounded mr-2"
                    onClick={() => handleValidate(orderId,pago.id, 'Validado')}
                  >
                    Validar
                  </button>
                  <button
                    className="py-1 px-2 bg-blue-800 text-white rounded"
                    onClick={() => handleValidate(orderId,pago.id, 'Rechazado')}
                  >
                    Rechazar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          className="rounded-full p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-blue-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)] transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
          aria-label="close"
          onClick={handleModalClose2}
        >
          X
        </button>
      </header>
      <div className="max-h-[80vh] overflow-y-auto">
        <section className="p-2 dark:text-gray-300 mt-2 rounded-lg">
          <><VisualizatorPayments orderId={''} paymentId={idPago} /></>
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