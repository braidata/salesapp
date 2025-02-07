import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface DteInfoProps {
  febosId: string;
}

const DteInfo: React.FC<DteInfoProps> = ({ febosId }) => {
  const [dteInfo, setDteInfo] = useState<any>(null);

  useEffect(() => {
    const fetchDteInfo = async () => {
      try {
        const response = await axios.get(`https://ventus-sales.ventuscorp.cl/api/febos?id=${febosId}`);
        setDteInfo(response.data);
      } catch (error) {
        console.error('Error fetching DTE info:', error);
      }
    };

    if (febosId) {
      fetchDteInfo();
    }
  }, [febosId]);

  if (!dteInfo) {
    return <div>Cargando información DTE...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2 dark:text-gray-200">Información DTE</h3>
      <table className="w-full">
        <tbody>
          <tr>
            <td className="font-semibold pr-2 dark:text-gray-300">Emisor:</td>
            <td className="dark:text-gray-400">{dteInfo.razonSocialEmisor} ({dteInfo.rutEmisor})</td>
          </tr>
          <tr>
            <td className="font-semibold pr-2 dark:text-gray-300">Receptor:</td>
            <td className="dark:text-gray-400">{dteInfo.razonSocialReceptor} ({dteInfo.rutReceptor})</td>
          </tr>
          <tr>
            <td className="font-semibold pr-2 dark:text-gray-300">Fecha Emisión:</td>
            <td className="dark:text-gray-400">{dteInfo.fechaEmision}</td>
          </tr>
          <tr>
            <td className="font-semibold pr-2 dark:text-gray-300">Folio:</td>
            <td className="dark:text-gray-400">{dteInfo.folio}</td>
          </tr>
          <tr>
            <td className="font-semibold pr-2 dark:text-gray-300">Tipo:</td>
            <td className="dark:text-gray-400">{dteInfo.tipo}</td>
          </tr>
        </tbody>
      </table>
      <button
        onClick={() => window.open(dteInfo.imagenLink, '_blank')}
        className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Ver PDF
      </button>
    </div>
  );
};

export default DteInfo;

