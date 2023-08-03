import { useState } from 'react';
import axios from 'axios';

interface Pedido {
  idsap: string;
  logsap: string;
  logcliente: string;
  CodigoExterno: string;
  respuesta_sap: string;
  RESULTADO_SAP: string;
  RUTA: string;
}

const Pedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const fetchPedidos = async () => {
    try {
      const response = await axios.get('/api/sqlSAPOrders', {
        params: {
          id: '173554',
          alm: 'VENTUS'
        }
      });
      setPedidos(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Pedidos</h1>
      <button className="bg-blue-500 text-white px-4 py-2 rounded-md mb-4" onClick={fetchPedidos}>Cargar pedidos</button>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th className="border px-4 py-2">ID SAP</th>
            <th className="border px-4 py-2">Log SAP</th>
            <th className="border px-4 py-2">Log cliente</th>
            <th className="border px-4 py-2">Código externo</th>
            <th className="border px-4 py-2">Respuesta SAP</th>
            <th className="border px-4 py-2">Resultado SAP</th>
            <th className="border px-4 py-2">Ruta</th>
          </tr>
        </thead>

        <tbody>
            {pedidos.map((pedido) => (
                <tr key={pedido.idsap}>
                    <td className="border px-4 py-2">{pedido.idsap}</td>
                    <td className="border px-4 py-2">{pedido.logsap}</td>
                    <td className="border px-4 py-2">{pedido.logcliente}</td>
                    <td className="border px-4 py-2">{pedido.CodigoExterno}</td>
                    <td className="border px-4 py-2">{pedido.respuesta_sap}</td>
                    <td className="border px-4 py-2">{pedido.RESULTADO_SAP}</td>
                    <td className="border px-4 py-2">{pedido.RUTA}</td>
                </tr>
            ))}
        </tbody>
        </table>
    </div>
    );
};



export default Pedidos;