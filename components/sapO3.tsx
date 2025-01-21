import React, { useState } from 'react';
import axios from 'axios';
import _ from 'lodash';
import SpinnerButton from './spinnerButton';

interface Pedido {
  CodigoExterno: string;
  respuesta_sap: string;
  sku_sap?: string;
  ts: string;
}

const PedidosExitososUnitario: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [codigoExterno, setCodigoExterno] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [searchStatus, setSearchStatus] = useState<'initial' | 'searching' | 'completed'>('initial');
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);

  const prettifyText = (raw: string): string => {
    return raw
      .replace(/\\n/g, ' ')
      .replace(/\\"/g, '"')
      .replace(/\\\//g, '/');
  };

  const extractSapInfo = (respuesta_sap: string) => {
    try {
      const parsed = JSON.parse(respuesta_sap);
      if (parsed && Array.isArray(parsed.RESP)) {
        const respArray = parsed.RESP;
        const febosItem = respArray.find((item: any) =>
          item.TEXT.includes('febosid=')
        );
        let febosId: string | null = null;

        if (febosItem) {
          const match = febosItem.TEXT.match(/febosid=([^&]+)/);
          febosId = match ? match[1] : null;
        }

        const code = respArray[0]?.CODE ?? null;
        const codSapConcatenado = respArray
          .map((item: any) => String(item.COD_SAP || ''))
          .join(' / ');
        const textoCompleto = respArray
          .map((item: any) => prettifyText(item.TEXT))
          .join(' | ');

        return {
          CODE: code,
          COD_SAP: codSapConcatenado,
          TEXT: textoCompleto,
          febosId,
        };
      }
      
      const parts = respuesta_sap.split('|');
      const lastPart = parts[parts.length - 1];
      const jsonPart = JSON.parse(lastPart);

      return {
        CODE: jsonPart.RESP.CODE,
        COD_SAP: jsonPart.RESP.COD_SAP,
        TEXT: prettifyText(jsonPart.RESP.TEXT || ''),
        febosId: null,
      };
    } catch (error) {
      return {
        CODE: null,
        COD_SAP: null,
        TEXT: prettifyText(respuesta_sap),
        febosId: null,
      };
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoExterno.trim() || searchStatus === 'searching') return;

    setError(null);
    setSearchStatus('searching');

    try {
      const { data } = await axios.get('/api/sqlSAPOrdersUnitario', {
        params: { codigoExterno: codigoExterno.trim() }
      });

      const pedidosExitosos = _(data)
        .filter((pedido: any) => {
          const info = extractSapInfo(pedido.respuesta_sap);
          return info.CODE === 0;
        })
        .groupBy('CodigoExterno')
        .map((group) => _.maxBy(group, 'ts'))
        .value();

      setPedidos(pedidosExitosos as Pedido[]);
      setSearchStatus('completed');
    } catch (err) {
      console.error('Error al obtener pedidos:', err);
      setError('Hubo un problema al obtener el pedido. Intenta de nuevo.');
      setSearchStatus('completed');
    }
  };

  const handleVerFactura = async (febosId: string) => {
    if (!febosId || pdfStatus) return;
    
    setPdfStatus(febosId);
    try {
      const { data } = await axios.get(
        `https://ventus-sales.ventuscorp.cl/api/febos?id=${febosId}`
      );
      if (data?.imagenLink) {
        window.open(data.imagenLink, '_blank');
      } else {
        alert('No se encontró "imagenLink" en la respuesta de Febos.');
      }
    } catch (err) {
      console.error('Error al abrir PDF de Febos:', err);
      alert('Error al obtener el PDF desde Febos');
    } finally {
      setPdfStatus(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="dark:text-gray-300 font-bold py-2 px-4 rounded-lg text-gray-900 border-2 text-center mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30">
        Pedidos Exitosos (por Código Externo)
      </h1>

      {error && (
        <p className="text-red-500 mb-4 text-center font-semibold">{error}</p>
      )}

      <div className="flex mb-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-4 w-full">
          <input
            type="text"
            value={codigoExterno}
            onChange={(e) => setCodigoExterno(e.target.value)}
            placeholder="Ingresa el Código Externo..."
            className="flex-1 p-2 border rounded dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
          />
          {searchStatus === 'searching' ? (
            <SpinnerButton texto="Buscando..." />
          ) : (
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out font-semibold"
            >
              Buscar
            </button>
          )}
        </form>
      </div>

      {searchStatus !== 'initial' && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-200 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-300">Código Externo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-300">SKU SAP</th>
                <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-300">Código SAP</th>
                <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-300">Respuesta</th>
                <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-300">Timestamp</th>
                <th className="px-4 py-3 text-left text-sm font-semibold dark:text-gray-300">Factura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {pedidos.map((pedido, index) => {
                const { TEXT, COD_SAP, febosId } = extractSapInfo(pedido.respuesta_sap);
                return (
                  <tr key={index} className="hover:bg-green-50 dark:hover:bg-green-900 transition duration-150">
                    <td className="px-4 py-3 dark:text-gray-300">{pedido.CodigoExterno}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{pedido.sku_sap || ''}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{COD_SAP}</td>
                    <td className="px-4 py-3 dark:text-gray-300 text-green-700 font-medium" style={{ whiteSpace: 'pre-wrap' }}>{TEXT}</td>
                    <td className="px-4 py-3 text-sm dark:text-gray-300">
                      {new Date(pedido.ts).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 dark:text-gray-300">
                      {febosId && (
                        <>
                          {pdfStatus === febosId ? (
                            <SpinnerButton texto="Cargando PDF..." />
                          ) : (
                            <button
                              onClick={() => handleVerFactura(febosId)}
                              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                            >
                              Ver Factura
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {searchStatus === 'completed' && pedidos.length === 0 && !error && (
        <p className="text-center dark:text-gray-300 mt-4">
          No se encontraron pedidos exitosos para ese Código Externo.
        </p>
      )}
    </div>
  );
};

export default PedidosExitososUnitario;