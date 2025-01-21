import React, { useState } from 'react';
import axios from 'axios';
import ReactSelect from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const options = [
  { value: 'VENTUS', label: 'VENTUS' },
  { value: 'VENTUS_B2B', label: 'VENTUS_B2B' },
  { value: 'VENTUS_REPUESTOS', label: 'VENTUS_REPUESTOS' },
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
  respuesta_sap: string;
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
  const [startDate, setStartDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const handleSelectChange = (selectedOption: SelectOption | null) => {
    if (selectedOption) {
      setEcommerce(selectedOption.value);
    }
  };

  const filterUniqueByCodigoExterno = (pedidos: Pedido[]): Pedido[] => {
    const seen = new Set();
    return pedidos.filter(pedido => {
      const duplicate = seen.has(pedido.CodigoExterno);
      seen.add(pedido.CodigoExterno);
      return !duplicate;
    });
  };

  const fetchPedidos = async () => {
    try {
      if (!ecommerce || !startDate || !endDate) {
        setError('Por favor, selecciona un ecommerce y un rango de fechas válido.');
        return;
      }

      const response = await axios.get<Pedido[]>('/api/sqlSAPOrders2', {
        params: {
          ecommerce,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      });

      setPedidos(filterUniqueByCodigoExterno(response.data || []));
      setError(null);
    } catch (err) {
      console.error('Error al obtener pedidos:', err);
      setError('Hubo un problema al obtener los pedidos. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 dark:text-gray-300 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 p-4 rounded-lg shadow-md">
        Pedidos SAP
      </h1>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 items-end">
        <div className="w-full lg:w-2/5">
          <ReactSelect
            options={options}
            value={options.find((option) => option.value === ecommerce)}
            onChange={handleSelectChange}
            className="w-full relative z-50"
            classNamePrefix="react-select"
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: 'rgb(17 24 39)',
                borderColor: 'rgb(75 85 99)',
                '&:hover': {
                  borderColor: 'rgb(107 114 128)'
                }
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: 'rgb(31 41 55)',
                zIndex: 50
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused 
                  ? 'rgb(55 65 81)' 
                  : state.isSelected 
                    ? 'rgb(37 99 235)' 
                    : 'transparent',
                color: 'rgb(229 231 235)',
                padding: '8px 12px',
                '&:active': {
                  backgroundColor: 'rgb(37 99 235)'
                }
              }),
              singleValue: (base) => ({
                ...base,
                color: 'rgb(229 231 235)'
              }),
              input: (base) => ({
                ...base,
                color: 'rgb(229 231 235)'
              })
            }}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 lg:flex-1">
          <div className="flex-1">
            <span className="block mb-1 dark:text-gray-300">Fecha desde:</span>
            <DatePicker
              selected={startDate}
              onChange={(date: Date) => setStartDate(date)}
              dateFormat="yyyy-MM-dd"
              className="w-full p-2 border rounded dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
            />
          </div>
          <div className="flex-1">
            <span className="block mb-1 dark:text-gray-300">Fecha hasta:</span>
            <DatePicker
              selected={endDate}
              onChange={(date: Date) => setEndDate(date)}
              dateFormat="yyyy-MM-dd"
              className="w-full p-2 border rounded dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
            />
          </div>
        </div>
        <div className="w-full lg:w-auto">
          <button
            className="w-full lg:w-auto bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition duration-300 ease-in-out"
            onClick={fetchPedidos}
          >
            Buscar
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase dark:text-gray-300">CodigoExterno</th>
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase dark:text-gray-300">RUTA</th>
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase dark:text-gray-300">Respuesta SAP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {Array.isArray(pedidos) && pedidos.map((pedido, index) => (
              <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                <td className="px-4 py-3 dark:text-gray-300">{String(pedido.CodigoExterno || '')}</td>
                <td className="px-4 py-3 dark:text-gray-300">{String(pedido.RUTA || '')}</td>
                <td className="px-4 py-3 dark:text-gray-300">{String(pedido.respuesta_sap || '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {Array.isArray(pedidos) && pedidos.length === 0 && (
        <p className="text-center dark:text-gray-300 mt-4">No se encontraron pedidos.</p>
      )}
    </div>
  );
};

export default Pedidos;

