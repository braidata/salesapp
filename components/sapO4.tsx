import React, { useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ReactSelect from 'react-select';
import _ from 'lodash';
import SpinnerButton from './spinnerButton';

const ecommerceOptions = [
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

// Estilos para ReactSelect en modo dark
const selectStyles = {
  control: (base: any) => ({
    ...base,
    background: 'rgb(31, 41, 55)',
    borderColor: '#4B5563',
    '&:hover': {
      borderColor: '#6B7280'
    },
    boxShadow: 'none',
  }),
  menu: (base: any) => ({
    ...base,
    background: 'rgb(31, 41, 55)',
    border: '1px solid #4B5563',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? '#374151' : 'transparent',
    '&:hover': {
      backgroundColor: '#374151'
    },
    color: '#E5E7EB',
  }),
  singleValue: (base: any) => ({
    ...base,
    color: '#E5E7EB',
  }),
  input: (base: any) => ({
    ...base,
    color: '#E5E7EB',
  }),
};

interface Pedido {
  CodigoInterno: string | null;
  CodigoExterno: string;
  respuesta_sap: string;
  RESULTADO_SAP: string;
  RUTA: string;
  ts: string;
  ecommerce: string;
}

const PedidosConError: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [ecommerce, setEcommerce] = useState<string>('VENTUS');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const parseRespuestaSAP = (respuesta: string) => {
    try {
      const data = JSON.parse(respuesta);
      if (data?.RESP) {
        if (Array.isArray(data.RESP)) {
          return {
            code: data.RESP[0]?.CODE || null,
            text: data.RESP.map((r: any) => r.TEXT).join(' | '),
          };
        }
        return {
          code: data.RESP.CODE || null,
          text: data.RESP.TEXT || '',
        };
      }
      return { code: null, text: respuesta };
    } catch (e) {
      try {
        const jsonPart = respuesta.split('|').pop() || '';
        const data = JSON.parse(jsonPart);
        return {
          code: data?.RESP?.CODE || null,
          text: data?.RESP?.TEXT || respuesta,
        };
      } catch {
        return { code: null, text: respuesta };
      }
    }
  };

  const formatDateToISO = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const formatDateTime = (dateStr: string): string => {
    try {
      // Crear una fecha UTC desde el string (que termina en Z)
      const date = new Date(dateStr);
      
      // Convertir a la zona horaria local pero mantener los valores originales
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('Error al formatear fecha:', dateStr, error);
      return dateStr;
    }
  };

  const handleEcommerceChange = (selectedOption: any) => {
    if (selectedOption) {
      setEcommerce(selectedOption.value);
    }
  };

  const buscarPedidos = async () => {
    if (!startDate || !endDate) {
      setError('Por favor selecciona fechas de inicio y fin');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = {
        startDate: formatDateToISO(startDate),
        endDate: formatDateToISO(endDate),
        ecommerce,
      };

      const response = await axios.get('/api/sqlSAPOrders2', { params });
      console.log('Ejemplo de fecha recibida:', response.data[0]?.ts);
      let pedidosFiltrados = response.data;

      if (!mostrarTodos) {
        pedidosFiltrados = pedidosFiltrados.filter((pedido: Pedido) => {
          const respuesta = parseRespuestaSAP(pedido.respuesta_sap);
          return respuesta.code === 1 || respuesta.code === 2;
        });
      }

      // Agrupar por CodigoExterno y tomar el más reciente de cada grupo
      const pedidosAgrupados = _(pedidosFiltrados)
        .groupBy('CodigoExterno')
        .map(group => _.maxBy(group, 'ts'))
        .value();

      setPedidos(pedidosAgrupados);

    } catch (err: any) {
      console.error('Error en la consulta:', err);
      setError(err.response?.data?.message || err.message || 'Error al consultar los pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 mt-8">
      <h1 className="dark:text-gray-300 font-bold py-2 px-4 rounded-lg hover:text-gray-900 border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2 dark:border-sky-200 dark:hover:bg-sky-900 hover:animate-pulse transform hover:-translate-y-1 hover:scale-110 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out">
        Pedidos con Error No Integrados
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}



      <div className="flex flex-col md:flex-row mb-4 gap-2 items-center">
        <div className="flex items-center">
          <span className="mr-2 dark:text-gray-300">Ecommerce:</span>
          <div className="w-52">
            <ReactSelect
              options={ecommerceOptions}
              value={ecommerceOptions.find(o => o.value === ecommerce)}
              onChange={handleEcommerceChange}
              styles={selectStyles}
            />
          </div>
        </div>

        <div className="flex items-center">
          <span className="mr-2 dark:text-gray-300">Fecha desde:</span>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            dateFormat="yyyy-MM-dd"
            className="p-2 border rounded text-sm"
          />
        </div>

        <div className="flex items-center">
          <span className="mr-2 dark:text-gray-300">Fecha hasta:</span>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            dateFormat="yyyy-MM-dd"
            className="p-2 border rounded text-sm"
          />
        </div>

        <div className="flex items-center">
          {/* <input
            type="checkbox"
            id="mostrarTodos"
            checked={mostrarTodos}
            onChange={(e) => setMostrarTodos(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="mostrarTodos" className="dark:text-gray-300">
            Todos
          </label> */}
        </div>

        {isLoading ? (
          <SpinnerButton texto="Buscando..." />
        ) : (
          <button
            onClick={buscarPedidos}
            disabled={isLoading}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300 ease-in-out disabled:opacity-50"
          >
            Buscar Errores
          </button>
        )}
      </div>

      <div className="text-center mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total de pedidos con error: <span className="font-bold">{pedidos.length}</span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          (Encuentra el motivo de error del pedido)
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase dark:text-gray-300">
                Código Externo
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase dark:text-gray-300">
                Respuesta SAP
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase dark:text-gray-300">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {pedidos.map((pedido, index) => {
              const respuestaSAP = parseRespuestaSAP(pedido.respuesta_sap);
              return (
                <tr
                  key={`${pedido.CodigoExterno}-${index}`}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-150 ease-in-out"
                >
                  <td className="px-4 py-3 dark:text-gray-300">
                    {pedido.CodigoExterno}
                  </td>
                  <td className="px-4 py-3 dark:text-gray-300">
                    <span className="font-medium">CODE={respuestaSAP.code}:</span>{' '}
                    <span className="text-orange-500">
                      {respuestaSAP.text}
                    </span>
                  </td>
                  <td className="px-4 py-3 dark:text-gray-300">
                    {formatDateTime(pedido.ts)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isLoading && pedidos.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
          No se encontraron pedidos para los criterios seleccionados.
        </p>
      )}
    </div>
  );
};

export default PedidosConError;