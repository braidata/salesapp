// components/SAPSalesDetails.tsx
import React, { useState, useEffect, ReactNode } from 'react';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

interface SAPSalesDataResult {
  BillingQuantityUnit: string;
  TOTAL: ReactNode;
  ItemNetAmountOfBillingDoc: ReactNode;
  BillingQuantity: string;
  __metadata: {
    id: string;
    uri: string;
    type: string;
  };
  SalesOrder: string;
  BillingDocument: string;
  BillingDocumentItem: string;
  deliverydate: string;
  Material: string;
  SalesOrderItemText: string;
  OrderQuantity: number;
  OrderQuantityUnit: string;
  NetPriceAmount: number;
  CustomerPaymentTerms: string;
  CustomerPaymentTerms_TEXT: string;
  Route: string;
  route_txt: string;
  BLART_TEXT: string;
  DocumentReferenceID: string;
  SDProcessStatus: string;
  SDPROCESSSTATUS_TEXT: string;
  TVLST_TEXT: string;
}

interface SAPSalesData {
  data: {
    results: SAPSalesDataResult[];
  };
}

interface SAPSalesDetailsProps {
  salesOrder: string;
}

const SAPSalesDetails: React.FC<SAPSalesDetailsProps> = ({ salesOrder }) => {
  const [salesData, setSalesData] = useState<SAPSalesDataResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const totalNeto = salesData.reduce((sum, item) => sum + parseFloat(item.ItemNetAmountOfBillingDoc as string), 0);
  const totalBruto = salesData.reduce((sum, item) => sum + parseFloat(item.TOTAL as string), 0);


  useEffect(() => {
    const fetchSAPSalesData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/apiSAPSales?salesOrder=${salesOrder}`);
        const data: SAPSalesData = await response.json();
        setSalesData(data.data.results);
      } catch (error) {
        setError('Error al obtener los datos de SAP');
      } finally {
        setLoading(false);
      }
    };

    fetchSAPSalesData();
  }, [salesOrder]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (salesData.length === 0) {
    return <div>No se encontraron datos</div>;
  }

  const globalData = salesData[0]; // Asumimos que los datos globales son los mismos para todos los materiales

  return (
    <div className="max-w-4xl mx-auto bg-white text-gray-900 dark:bg-gray-900 dark:text-white p-6">
      <h2 className="text-2xl font-bold mb-4">Detalles del Pedido en SAP</h2>

      <div className="bg-gray-100 dark:bg-gray-800 shadow-md rounded-lg p-4 mb-6">
        <div className="mb-2">
          <span className="font-bold">Pedido de Venta:</span> {globalData.SalesOrder}
        </div>
        <div className="mb-2">
          <span className="font-bold">{globalData.BLART_TEXT || "DTE"}:</span> {globalData.DocumentReferenceID}
        </div>
        <div className="mb-2">
          <span className="font-bold">Forma de Pago:</span> {globalData.CustomerPaymentTerms} - {globalData.CustomerPaymentTerms_TEXT}
        </div>
        <div className="mb-2">
          <span className="font-bold">Ruta:</span> {globalData.Route} - {globalData.route_txt}
        </div>
        <div className="mb-2 flex items-center">
          <span className="font-bold">Estado del Pedido:</span>
          {/* {globalData.SDProcessStatus === 'C' ? (
            <FaCheckCircle className="text-green-500 ml-2" />
          ) : ( TVLST_TEXT
            <FaExclamationCircle className="text-yellow-500 ml-2" />
          )} */}
          <span className="ml-1">{globalData.SDPROCESSSTATUS_TEXT}</span>
        </div>
        <div className="mb-2 flex items-center">
          <span className="font-bold">Bloqueos:</span>
          <span className="ml-1">{globalData.TVLST_TEXT || "Sin Bloqueos"}</span>
        </div>
      </div>

      {/* <div className=" overflow-hidden"> */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-auto max-h-[50vh]">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/6">
                  Material
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-2/5">
                  Descripción
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/6">
                  Cant. Solicitada
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/6">
                  Cant. Procesada
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/6">
                  Precio Neto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/6">
                  Totales
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {salesData.map((item, index) => (
                <tr key={index} className="bg-white dark:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{item.Material}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{item.SalesOrderItemText || ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {item.OrderQuantity || ''} {item.BillingQuantityUnit || ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {item.BillingQuantity || ''} {item.BillingQuantityUnit || ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{item.NetPriceAmount || ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    Neto: {item.ItemNetAmountOfBillingDoc} Bruto: {item.TOTAL}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-right font-bold">
                  Totales:
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-bold">
                  Neto: {totalNeto.toFixed(0)} Bruto: {totalBruto.toFixed(0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    // </div>
  );
};

export default SAPSalesDetails;