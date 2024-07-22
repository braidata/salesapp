// components/OrderStatus.js

import React, { useState } from 'react';
import axios from 'axios';

const OrderStatus = () => {
  const [orderId, setOrderId] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorMessageOrder, setErrorMessageOrder] = useState('');

  // Función para convertir la lista de órdenes en un mensaje de error
  const formatOrderErrorMessage = (orders) => {
    if (orders.length === 0) {
      return "No hay órdenes disponibles.";
    }
    return `Los siguientes pedidos tienen problemas: ${orders.map(order => order.id).join(', ')}`;
  };

  const handleChange = (event) => {
    setOrderId(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setErrorMessage('');
      const response = await axios.get(`/api/meliApi?orderId=${orderId}`);
      const data = response.data;

      // Check if the response contains an error message
      if (data.code === 'OK') {
        setErrorMessage(data.message);
        setErrorMessageOrder(`El número de Orden Id es: ${(data.orders).map(order => order.id).join(', ')}`);
        setOrderData(null);
      } else {
        // Extract the required fields
        const { id, orderId, orderErp, response, date_register, status } = data[0];

        // Set the extracted data in the state
        setOrderData({ id, orderId, orderErp, response, date_register, status });
      }
    } catch (error) {
      console.error('Error fetching order data:', error);
      setErrorMessage('Error fetching order data. Please try again.');
      setOrderData(null);
    }
  };

  return (
    <div className="p-4 mt-8">
      <h1 className="font-bold py-2 px-4 rounded-lg text-center mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-gray-900 dark:text-gray-300 border-2 border-gray-400 hover:bg-gray-600/50 hover:text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 dark:border-sky-200 dark:hover:bg-sky-900 hover:animate-pulse transform hover:-translate-y-1 hover:scale-110 transition duration-500 ease-in-out">
        Busca tu Pedido en MeLi
      </h1>
      <form onSubmit={handleSubmit} className="flex mb-4">
        <input
          type="text"
          value={orderId}
          onChange={handleChange}
          className="border p-2 mr-2"
          placeholder="ID de Pedido"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">
          Buscar
        </button>
      </form>

      {errorMessage && <p>{errorMessage}</p>}
      {errorMessageOrder && <p>{errorMessageOrder}</p>}

      {orderData && (
        <div>
          <h2 className="font-bold mt-4 mb-2">Order Status:</h2>
          <table className="table-auto w-full">
            <thead>
              <tr>
                <th className="border px-4 py-2">ID</th>
                <th className="border px-4 py-2">Order ID</th>
                <th className="border px-4 py-2">Order ERP</th>
                <th className="border px-4 py-2">Response</th>
                <th className="border px-4 py-2">Date Register</th>
                <th className="border px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-4 py-2">{orderData.id}</td>
                <td className="border px-4 py-2">{orderData.orderId}</td>
                <td className="border px-4 py-2">{orderData.orderErp}</td>
                <td className="border px-4 py-2">{orderData.response}</td>
                <td className="border px-4 py-2">{orderData.date_register}</td>
                <td className="border px-4 py-2">{orderData.status}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderStatus;



