import { useState } from 'react';
import axios from 'axios';

interface Order {
  id: number;
  meta_data: string;
  phone: string;
  city: string;
  meta_data2: string;
  method: string;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderIds, setOrderIds] = useState<string>('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOrderIds(event.target.value);
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.post<Order[]>('/api/orders', {
        order_ids: orderIds.split(',').map((id) => parseInt(id.trim())),
      });
      setOrders(response.data);

    } catch (error) {
      console.error(error);
    }
  };

  function formatPhoneNumber(phoneNumber: string) {
    const formattedNumber = phoneNumber.startsWith("+") ? phoneNumber.slice(1) : phoneNumber;
  
    if (formattedNumber.startsWith("56")) {
      if (formattedNumber.length === 8) {
        return "+569" + formattedNumber.slice(2);
      } else {
        return "+" + formattedNumber;
      }
    } else {
      return "+56" + phoneNumber;
    }
  }

  return (
    <div className="p-4 mt-8">
      <h1 className="dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
      mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
      border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]">
        Envía tus órdenes a FedEx
      </h1>
      <div className="flex mb-4">
        <input
          className="border p-2 mr-2"
          type="text"
          placeholder="IDs de órdenes separados por comas"
          value={orderIds}
          onChange={handleInputChange}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
          onClick={fetchOrders}
        >
          Enviar
        </button>
      </div>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th className="border px-4 py-2">ID de orden</th>
            <th className="border px-4 py-2">OT Fedex</th>
            <th className="border px-4 py-2">Celular</th>
            <th className="border px-4 py-2">Tipo de Envío</th>
            <th className="border px-4 py-2">Ciudad</th>
            {/* <th className="border px-4 py-2">Comuna</th> */}
          </tr>
        </thead>
        <tbody>
          
          {orders.map((order, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">{order.id}</td>
              <td className="border px-4 py-2">{order.meta_data}</td>
              <td className="border px-4 py-2">{formatPhoneNumber(order.phone)}</td>
              <td className="border px-4 py-2">{order.method}</td>
              <td className="border px-4 py-2">{order.city}</td>
              {/* <td className="border px-4 py-2">{order.meta_data2}</td> */}
            </tr>
          ))}
        </tbody>
      </table>
      
    </div>
  );
};

export default Orders;