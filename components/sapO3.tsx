import React, { useState } from 'react';
import axios from 'axios';
import ReactSelect from 'react-select';
import { useTheme } from 'next-themes';



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



const customStyles = {
  control: (provided: any) => ({
    ...provided,
    borderRadius: '0.375rem',
    borderColor: '#E5E7EB',
    borderWidth: '1px',
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem',
    minHeight: '2.5rem',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#9CA3AF',
    },
  }),
  option: (provided: any, state: { isSelected: any; isFocused: any; }) => ({
    ...provided,
    padding: '0.5rem 1rem',
    backgroundColor: state.isSelected
      ? 'rgba(59, 130, 246, 1)'
      : state.isFocused
      ? 'rgba(209, 213, 219, 1)'
      : 'white',
    color: state.isSelected ? 'white' : 'black',
  }),
};

//dark mode
const customStylesDark = {
  control: (provided: any, state: { isSelected: any; isFocused: any; }) => ({
    ...provided,
    borderRadius: '0.375rem',
    borderColor: '#4B5563',
    borderWidth: '1px',
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem',
    minHeight: '2.5rem',
    backgroundColor: '#1F2937', // Fondo oscuro para el control del select
    //color: 'white !important', // Texto blanco
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#9CA3AF',
    },
    class: 'dark:text-red',
    style: 'color: white !important'

  }),
  option: (provided: any, state: { isSelected: any; isFocused: any; }) => ({
    ...provided,
    padding: '0.5rem 1rem',
    backgroundColor: state.isSelected
      ? 'rgba(59, 130, 246, 1)' // Fondo azul para la opción seleccionada
      : state.isFocused
      ? 'rgba(99, 102, 110, 1)' // Fondo gris oscuro para la opción enfocada
      : '#1F2937', // Fondo oscuro para las opciones no enfocadas
      color: state.isSelected ? 'black' : 'white',  // Texto blanco para todas las opciones
  }),
};



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
  const [idPedido, setIdPedido] = useState<string>('');
  const [ecommerce, setEcommerce] = useState<string>('VENTUS');

  const { theme } = useTheme();

  const isUnique = (pedido: Pedido, index: number, pedidos: Pedido[]): boolean => {
    const uniquePair = `${pedido.idsap}-${pedido.CodigoExterno}`;
    const foundIndex = pedidos.findIndex(
      (p) => `${p.idsap}-${p.CodigoExterno}` === uniquePair
    );
    return foundIndex === index;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEcommerce(event.target.value);
  };

  const handleSelectChange = (selectedOption: SelectOption | null) => {
    if (selectedOption) {
      setEcommerce(selectedOption.value);
    }
  };

  const fetchPedidos = async () => {
    try {
      const response = await axios.get<Pedido[]>('/api/sqlSAPOrders2', {
        params: {

          ecommerce: ecommerce,

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
        }).filter(isUnique);
        
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
      if (resp[0]) {
        TEXT = resp[0].TEXT;
        COD_SAP = resp[0].COD_SAP;
      }
    } else if (resp) { // Verifica si el objeto 'resp' no es undefined
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

  return (
    <div className="p-4 mt-8">
      <h1 className="dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
      mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
      border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]">
        Pedidos con error en SAP
      </h1>
      <div className="flex mb-4">
        {/* <input
          className="border p-2 mr-2"
          type="text"
          placeholder="Ecommerce"
          value={ecommerce}
          onChange={handleInputChange}
        /> */}

<ReactSelect
        options={options}
        value={options.find((option) => option.value === ecommerce)}
        onChange={handleSelectChange}
        //styles={tema}
        className="w-1/2 mr-2 border p-2
        dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600
        dark:hover:bg-gray-600 dark:hover:text-gray-400
        dark:focus:bg-gray-600 dark:focus:text-gray-400
        dark:active:bg-gray-600 dark:active:text-gray-400
        dark:placeholder-gray-400
        dark:focus:ring-gray-400 dark:focus:ring-opacity-50
        dark:focus:ring-2
        dark:ring-gray-400 dark:ring-opacity-50 dark:ring-2
        dark:ring-offset-gray-700 dark:ring-offset-2
        dark:placeholder-gray-400
        dark:placeholder-opacity-50
        dark:placeholder-2
        dark:placeholder-offset-gray-700 dark:placeholder-offset-2"
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
            {/* <th className="border px-4 py-2">ID SAP</th> */}
            <th className="border px-4 py-2">CodigoExterno</th>
            <th className="border px-4 py-2">RUTA</th>
            <th className="border px-4 py-2">Respuesta SAP</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido, index) => {
            const { TEXT, COD_SAP } = extractSapInfo(pedido.respuesta_sap.RESP);
            return (
              <tr key={index}>
                {/* <td className="border px-4 py-2">{COD_SAP}</td> */}
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