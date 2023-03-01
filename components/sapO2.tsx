import { JSXElementConstructor, Key, ReactElement, ReactFragment, useState } from 'react';
import axios from 'axios';

interface Pedido {
  idsap: string;
  logsap: object;
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

    //haz una tabla para los json que te regresa el api
    //y haz un boton para que se ejecute la funcion fetchPedidos
    //y que se muestren los datos en la tabla


    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Pedidos</h1>
      <button className="bg-blue-500 text-white px-4 py-2 rounded-md mb-4" onClick={fetchPedidos}>Cargar pedidos</button>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th className="border px-4 py-2">Log SAP</th>
          </tr>
        </thead>
        <tbody>
            {pedidos.map((pedido) => (
                
                   
                    
                    <td className="border px-4 py-2">{pedido.logsap}</td>

            ))}

        


        </tbody>
        </table>
    </div>
    );
};



export default Pedidos;
