import React, { useState } from 'react';

const OrderDetails = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState(null);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch('/api/meliTable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order: orderNumber }),
      });

      if (!response.ok) {
        throw new Error('Algo salió mal');
      }

      const data = await response.json();

      setOrderDetails(data);
    } catch (err) {
      setError("Pedido no sincronizado en Tabla");
    }
  };

  return (
<div className="p-4 mt-8">
  <h1 className="font-bold py-2 px-4 rounded-lg text-center mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-gray-900 dark:text-gray-300 border-2 border-gray-400 hover:bg-gray-600/50 hover:text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 dark:border-sky-200 dark:hover:bg-sky-900 hover:animate-pulse transform hover:-translate-y-1 hover:scale-110 transition duration-500 ease-in-out">
    Busca tu Pedido en Tabla
  </h1>
  <input
    type="text"
    value={orderNumber}
    onChange={e => setOrderNumber(e.target.value)}
    className="border p-2 mr-2"
    placeholder="Ingrese el número de pedido"
  />

  <button onClick={fetchOrderDetails} className="bg-blue-500 text-white px-4 py-2 rounded-md">
    Buscar
  </button>

  {error ? <p>{error}</p> : null}

  {orderDetails && (
    <div>
      <h2 className="font-bold mt-4 mb-2">Detalles del pedido</h2>
      {/* Muestra los detalles del pedido aquí. Asegúrate de ajustar estos campos según corresponda. */}
      {orderDetails.map((order, index) => (
        <p key={index} className="border px-4 py-2">Código Externo en Tabla: {order.CodigoExterno}</p>
      ))}
    </div>
  )}
</div>
  );
};

export default OrderDetails;