import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactSelect from 'react-select';
import { useTheme } from 'next-themes';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const options = [
  { value: 'VENTUS', label: 'VENTUS' },
  { value: 'BBQ GRILL', label: 'BBQ GRILL' },
  { value: 'Blanik', label: 'Blanik' },
  { value: 'Falabella PN', label: 'Falabella PN' },
  { value: 'Falabella VV', label: 'Falabella VV' },
  { value: 'KC', label: 'KC' },
  { value: 'MELI_BBQ', label: 'MELI_BBQ' },
  { value: 'Mercado Libre', label: 'Mercado Libre' },
  { value: 'RIPLEY PN', label: 'RIPLEY PN' },
  { value: 'RIPLEY VV', label: 'RIPLEY VV' },
  { value: 'Sodimac PN', label: 'Sodimac PN' },
  { value: 'Sodimac VV', label: 'Sodimac VV' },
  { value: 'VENTAWEB-ECOMMERCE', label: 'VENTAWEB-ECOMMERCE' },
  { value: 'VENTAWEB-VENTA DIRECTA', label: 'VENTAWEB-VENTA DIRECTA' },
];

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

interface SelectOption {
  value: string;
  label: string;
}

const Pedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [ecommerce, setEcommerce] = useState<string>('VENTUS');
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { theme } = useTheme();

  const isUnique = (pedido: Pedido, index: number, pedidos: Pedido[]): boolean => {
    const uniquePair = `${pedido.idsap}-${pedido.CodigoExterno}`;
    const foundIndex = pedidos.findIndex(
      (p) => `${p.idsap}-${p.CodigoExterno}` === uniquePair
    );
    return foundIndex === index;
  };

  const handleSelectChange = (selectedOption: SelectOption | null) => {
    if (selectedOption) {
      setEcommerce(selectedOption.value);
    }
  };

  const extractSapInfo = (resp: any) => {
    let TEXT, COD_SAP;

    if (Array.isArray(resp)) {
      if (resp[0]) {
        TEXT = resp[0].TEXT;
        COD_SAP = resp[0].COD_SAP;
      }
    } else if (resp) {
      TEXT = resp.TEXT;
      COD_SAP = resp.COD_SAP;
    }

    if (!TEXT && !COD_SAP) {
      TEXT = COD_SAP = 'No se encontró el pedido ni su respuesta ni el código SAP';
    }

    return {
      TEXT,
      COD_SAP,
    };
  };

  const excludeVtaResponses = (respArray: any[]): boolean => {
    // Revisar cada objeto en RESP y excluir si alguno comienza con "Vta."
    return respArray.every((resp) => !resp.TEXT.trim().startsWith('Vta.'));
  };

  const fetchPedidos = async () => {
    try {
      const response = await axios.get<Pedido[]>('/api/sqlSAPOrders2', {
        params: {
          ecommerce: ecommerce,
          startDate: startDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
          endDate: endDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
        },
      });

      const pedidosActualizados: Pedido[] = response.data
        .map((pedido: Pedido) => {
          const respuesta_sap =
            typeof pedido.respuesta_sap === 'string' && pedido.respuesta_sap !== ''
              ? JSON.parse(pedido.respuesta_sap)
              : pedido.respuesta_sap;
          return {
            ...pedido,
            respuesta_sap,
          };
        })
        .filter(isUnique)
        .filter((pedido) => {
          const resp = pedido.respuesta_sap?.RESP;
          // Verificar que RESP sea un array válido y excluir si contiene "Vta." al inicio
          return Array.isArray(resp) && excludeVtaResponses(resp);
        });

      setPedidos(pedidosActualizados);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-4 mt-8">
      <h1 className="dark:text-gray-300 font-bold py-2 px-4 rounded-lg hover:text-gray-900 border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2 dark:border-sky-200 dark:hover:bg-sky-900 hover:animate-pulse transform hover:-translate-y-1 hover:scale-110 mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out">
        Pedidos con error en SAP
      </h1>
      <div className="flex mb-4">
        <ReactSelect
          options={options}
          value={options.find((option) => option.value === ecommerce)}
          onChange={handleSelectChange}
          className="w-1/2 mr-2 border p-2 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
        />
        <div className="flex items-center">
          <span>Fecha desde:</span>
          <DatePicker
            selected={startDate}
            onChange={(date: Date) => setStartDate(date)}
            dateFormat="yyyy-MM-dd"
            className="ml-2 p-2 border"
          />
        </div>
        <div className="flex items-center ml-4">
          <span>Fecha hasta:</span>
          <DatePicker
            selected={endDate}
            onChange={(date: Date) => setEndDate(date)}
            dateFormat="yyyy-MM-dd"
            className="ml-2 p-2 border"
          />
        </div>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md ml-4"
          onClick={fetchPedidos}
        >
          Buscar
        </button>
      </div>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th className="border px-4 py-2">CodigoExterno</th>
            <th className="border px-4 py-2">RUTA</th>
            <th className="border px-4 py-2">Respuesta SAP</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido, index) => {
            const { TEXT } = extractSapInfo(pedido.respuesta_sap.RESP);
            return (
              <tr key={index}>
                <td className="border px-4 py-2">{pedido.CodigoExterno}</td>
                <td className="border px-4 py-2">{pedido.RUTA}</td>
                <td className="border px-4 py-2">{TEXT}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Pedidos;
