import { useState, useEffect } from "react";
import OCRForm from "../components/ocr"
import { useSession } from 'next-auth/react';

const PaymentForm: React.FC = (orderId: {}, orderDate,) => {
  const { data: session } = useSession();
  const [userId, setUserId] = useState<string | null>();
  const idOrder = orderId ? Object.entries(orderId).map((i: any) => { return i[1] }) : ""
  const date = new Date(idOrder[1])
  const fechaFormateada = date.getFullYear() + "-" +
  ("0" + (date.getMonth() + 1)).slice(-2) + "-" +
  ("0" + date.getDate()).slice(-2) + " " +
  ("0" + date.getHours()).slice(-2) + ":" +
  ("0" + date.getMinutes()).slice(-2);

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.getFullYear() + "-" +
      ("0" + (now.getMonth() + 1)).slice(-2) + "-" +
      ("0" + now.getDate()).slice(-2) + " " + // Reemplazar "T" con un espacio
      ("0" + now.getHours()).slice(-2) + ":" +
      ("0" + now.getMinutes()).slice(-2);
  };

  const [paymentData, setPaymentData] = useState({
    order_id: idOrder[0],
    order_date: fechaFormateada,
    payment_date: getCurrentDateTime(),
    rut_cliente: idOrder[2],
    rut_pagador: idOrder[2],
    banco_destino: "",
    imagenUrl: "",
    textoImg: "",
    team: "",
    payment_amount: "",
    observation: "",
    status: "Pendiente",
    createdBy: userId
  });

  useEffect(() => {
    if (session) {
      setUserId(session ? session.session.user.name : null);
      const loggedInUserEmail = session ? session.session.user.name : null
      console.log("editador", loggedInUserEmail)
    }
  }, [session]);


  const handleOCRResult = (ocrResult: string | null, uploadedImageUrl: string | null) => {
    setPaymentData((prevData) => ({
      ...prevData,
      imagenUrl: uploadedImageUrl || '',
      textoImg: ocrResult || '',
    }));
  };

  const handleSubmit = async (event: { preventDefault: () => void; }) => {
    event.preventDefault();
    const formattedPaymentDate = paymentData.payment_date.replace("T", " ");
    const formattedOrderDate = paymentData.order_date.replace("T", " ");
    const res = await fetch("/api/mysqlPaymentsCreatorModule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...paymentData,payment_date: formattedPaymentDate,order_date: formattedOrderDate, createdBy: userId }),
    });
    if (res.status === 201) {
      setPaymentData({
        order_id: idOrder[0],
        order_date: formattedOrderDate,
        payment_date: formattedPaymentDate,
        rut_cliente: idOrder[2],
        rut_pagador: "",
        banco_destino: "",
        imagenUrl: "",
        textoImg: "",
        team: "",
        payment_amount: "",
        observation: "",
        status: "Pendiente",
        createdBy: userId
      });
      alert("El Pago fue creado con éxito");
    } else {
      alert("Error al crear el Pago");
    }
  };

  // const handleResetForm = () => {
  //   setPaymentData({
  //     order_id: '',
  //     order_date: '',
  //     payment_date: '',
  //     rut_cliente: '',
  //     rut_pagador: '',
  //     banco_destino: '',
  //     imagenUrl: '',
  //     textoImg: '',
  //     team: '',
  //     payment_amount: '',
  //     observation: '',
  //     status: 'Pendiente',
  //   });
  // };

  const handleChange = (event: { target: { name: any; value: any; }; }) => {
    const { name, value } = event.target;
    setPaymentData({ ...paymentData, [name]: value });
  };

  return (
    <>
      <h1 className="w-full text-4xl sm:text-6xl font-bold text-center mt-24 mb-12 py-4 px-4 rounded-lg transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-gray-900 border-2 border-gray-400 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 dark:text-gray-300 dark:border-sky-200 dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)] hover:text-gray-900 hover:bg-gray-600/50 dark:hover:bg-sky-900 hover:animate-pulse">
        INGRESA EL PAGO DE TU PEDIDO
      </h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">

        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="order_id">
            ID:
          </label>
          <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-50" type="text" name="order_id" value={paymentData.order_id} readOnly disabled required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="order_date">
            Fecha del Pedido:
          </label>
          <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 leading-tight focus:outline-none cursor-not-allowed focus:shadow-outline bg-white dark:bg-gray-700" type="date-local" name="order_date" value={paymentData.order_date} readOnly disabled onChange={handleChange} required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="payment_date">
            Fecha del Pago:
          </label>
          <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 leading-tight focus:outline-none cursor-not-allowed focus:shadow-outline bg-white dark:bg-gray-700" type="date-local" name="payment_date" value={paymentData.payment_date} onChange={handleChange} required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="rut_cliente">
            Rut del Cliente:
          </label>
          <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-50" type="text" name="rut_cliente" value={paymentData.rut_cliente} onChange={handleChange} readOnly disabled required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="rut_pagador">
            Rut del Pagador:
          </label>
          <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 leading-tight focus:outline-none focus:shadow-outline bg-white dark:bg-gray-700" type="text" name="rut_pagador" value={paymentData.rut_pagador} onChange={handleChange} />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="banco_destino">
            Banco de Destino:
          </label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 leading-tight focus:outline-none focus:shadow-outline bg-white dark:bg-gray-700"
            name="banco_destino"
            value={paymentData.banco_destino}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un banco</option>
            <option value="Itaú">ITAU</option>
            <option value="BCI">BCI</option>
            <option value="BICE">BICE</option>
            <option value="Banco Chile">Banco Chile</option>
            <option value="Santander">Santander</option>
            <option value="Scotiabank">Scotiabank</option>
            <option value="Banco Estado">Banco Estado</option>
            <option value="transbank">transbank</option>
            <option value="webpay">webpay</option>
            <option value="Factura Anticipada">Factura Anticipada</option>
            <option value="Saldo a favor">Saldo a Favor</option>
            <option value="Guia de Despacho">Guia de Despacho</option>
            <option value="Abono a Rut">Abono a Rut</option>
            <option value="Banco Internacional">Banco Internacional</option>
            
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="team">
            Equipo:
          </label>
          <select
    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 leading-tight focus:outline-none focus:shadow-outline bg-white dark:bg-gray-700"
    name="team"
    value={paymentData.team}
    onChange={handleChange}
    required
  >
    <option value="">Selecciona tu Equipo</option>
    <option value="Venta Directa">Venta Directa</option>
    <option value="Imega">Imega</option>
    <option value="Ecommerce">Ecommerce</option>
    <option value="Repuestos">Repuestos</option>
    <option value="Distribución">Distribución</option>
  </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="payment_amount">
            Monto:
          </label>
          <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 leading-tight focus:outline-none focus:shadow-outline bg-white dark:bg-gray-700" type="text" name="payment_amount" value={paymentData.payment_amount} onChange={handleChange} required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="observation">
            Observación:
          </label>
          <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 leading-tight focus:outline-none focus:shadow-outline bg-white dark:bg-gray-700" type="text" name="observation" value={paymentData.observation} onChange={handleChange} required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2" htmlFor="image">
            Imagen:
          </label>
          <OCRForm onOCRResult={handleOCRResult} />
        </div>
        <div className="flex flex-col items-center justify-center">
        {/* <button
        type="button"
        onClick={handleResetForm}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-110"
      >
        Reiniciar Formulario
      </button> */}
          <button className="mt-2 mb-5 py-2 px-4 rounded-full font-bold text-gray-800 dark:text-gray-200 transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-105 bg-gradient-to-r from-green-600/40 to-green-800/40 border-2 border-green-800 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)] hover:bg-green-600/50 dark:bg-gradient-to-r dark:from-green-500/40 dark:to-green-800/60 dark:border-green-200 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)] dark:hover:bg-green-900" type="submit">
            Crear Pago
          </button>
        </div>
      </form>
    </>

  );
}

export default PaymentForm
