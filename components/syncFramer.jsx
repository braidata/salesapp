import React, { useState } from 'react';

const channels = [
    { name: 'Mercado Libre Ventus', url: 'https://novahucp.ventuscorp.cl/integracion-nova/sync-orders-ml.php' },
    { name: 'Mercado Libre Blanik', url: 'https://novahucp.ventuscorp.cl/integracion-nova/sync-orders-ml-blanik.php' },
    { name: 'Mercado Libre BBQ', url: 'https://novahucp.ventuscorp.cl/integracion-nova/sync-orders-ml-bbq.php' },
    { name: 'Blanik', url: 'https://novahucp.ventuscorp.cl/integracion-nova/sync-orders-blanik.php' },
    { name: 'BBQ', url: 'https://novahucp.ventuscorp.cl/integracion-nova/sync-orders-bbq.php' },
    { name: 'Ventus', url: 'https://novahucp.ventuscorp.cl/integracion-nova/sync-orders.php' },
];

function App() {
    const [selectedChannel, setSelectedChannel] = useState(channels[0].url);
    const [logData, setLogData] = useState([]);

    const handleSelectChange = (event) => {
        setSelectedChannel(event.target.value);
    };

    const fetchLogData = async () => {
        const response = await fetch(selectedChannel);
        let data = await response.text();
        data = data.replace('<pre>', '').replace('</pre>', '');  // Remove <pre> tags
        setLogData(data.split('\n'));
    };


    return (
        <div className="p-4 mt-8">
            <h1 className="font-bold py-2 px-4 rounded-lg text-center mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-gray-900 dark:text-gray-300 border-2 border-gray-400 hover:bg-gray-600/50 hover:text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 dark:border-sky-200 dark:hover:bg-sky-900 hover:animate-pulse transform hover:-translate-y-1 hover:scale-110 transition duration-500 ease-in-out">
                Sincronizador de Pedidos
            </h1>
            <select value={selectedChannel} onChange={handleSelectChange} className="border p-2 mr-2">
                {channels.map((channel) => (
                    <option key={channel.url} value={channel.url}>
                        {channel.name}
                    </option>
                ))}
            </select>

            <button onClick={fetchLogData} className="bg-blue-500 text-white px-4 py-2 rounded-md">
                Sincronizar
            </button>

            <div className="mt-4">
                <table className="table-auto w-full">
                    <thead>
                        <tr>
                            <th className="border px-4 py-2">Tiempo</th>
                            <th className="border px-4 py-2">Canal</th>
                            <th className="border px-4 py-2">Nivel</th>
                            <th className="border px-4 py-2">Mensaje</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logData.map((line, index) => {
                            const fields = line.split(' ');  // Dividir cada línea en campos
                            return (
                                <tr key={index}>
                                    <td className="border px-4 py-2">{fields[0]}</td>
                                    <td className="border px-4 py-2">{fields[1]}</td>
                                    <td className="border px-4 py-2">{fields[2]}</td>
                                    <td className="border px-4 py-2">{fields.slice(3).join(' ')}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

        </div>
    );
}

export default App;
