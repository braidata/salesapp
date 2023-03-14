import { useState } from 'react';
import axios from 'axios';

interface Pedido {
  idsap: string;
  logsap: object;
  logcliente: string;
  CodigoExterno: string;
  respuesta_sap: {
    RESP: {
      CODE: number;
      TEXT: string;
      COD_SAP: string;
    }[];
  };
  RESULTADO_SAP: string;
  RUTA: string;
}

const Pedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [idPedido, setIdPedido] = useState<string>('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIdPedido(event.target.value);
  };

  const fetchPedidos = async () => {
    try {
      const response = await axios.get<Pedido[]>('/api/sqlSAPOrders', {
        params: {
          id: idPedido,
          alm: 'VENTUS',
        },
      });
      const pedidosActualizados = response.data.map((pedido) => {
        const respuesta_sap =
          typeof pedido.respuesta_sap === 'string'
            ? JSON.parse(pedido.respuesta_sap)
            : pedido.respuesta_sap;
        return {
          ...pedido,
          respuesta_sap,
        };
      });
      setPedidos(pedidosActualizados);
    } catch (error) {
      console.error(error);
    }
  };

  // const extractSapInfo = (resp: any) => {
  //   if (Array.isArray(resp)) {
  //     return {
  //       TEXT: resp[0]?.TEXT,
  //       COD_SAP: resp[0]?.COD_SAP,
  //     };
  //   } else {
  //     return {
  //       TEXT: resp?.TEXT,
  //       COD_SAP: resp?.COD_SAP,
  //     };
  //   }
  // };

  const extractSapInfo = (resp: any) => {
    let TEXT, COD_SAP;
  
    if (Array.isArray(resp)) {
      TEXT = resp[0]?.TEXT || 'No se encontró la respuesta del pedido';
      COD_SAP = resp[0]?.COD_SAP || 'No se encontró el código SAP del pedido';
    } else {
      TEXT = resp?.TEXT || 'No se encontró la respuesta del pedido';
      COD_SAP = resp?.COD_SAP || 'No se encontró el código SAP del pedido';
    }
  
    return {
      TEXT,
      COD_SAP,
    };
  };

  return (
    <div className="p-4 mt-8">
                <h1 className="dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
      mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
      border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]">
            Busca tu Pedido en el SAP Orders
          </h1>
      <div className="flex mb-4">
        <input
          className="border p-2 mr-2"
          type="text"
          placeholder="ID de Pedido"
          value={idPedido}
          onChange={handleInputChange}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
          onClick={fetchPedidos}
        >
          Buscar
        </button>
      </div>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th className="border px-4 py-2">Respuesta SAP</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido, index) => {
            const { TEXT, COD_SAP } = extractSapInfo(pedido.respuesta_sap.RESP);
            return (
              <tr key={index}>
                <td className="border px-4 py-2">
                  <div className="flex flex-col">
                    <div className="flex">
                      <th className="font-bold">ID SAP: </th>
                      <td>{COD_SAP}</td>
                    </div>
                    <div className="flex">
                      <th className="font-bold">Respuesta: </th>
                      <td>{TEXT}</td>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Pedidos;





