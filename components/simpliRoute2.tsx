import React, { useState, useEffect } from "react";
import Text from "./text";
import * as XLSX from 'xlsx';

const ShippingOrderTable = () => {
    const [dataS, setData] = useState([]);
    const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
    const [selectedDate, setSelectedDate] = useState()

    useEffect(() => {
        if (selectedDate) {
            const fetchData = async () => {
                try {
                    const response = await fetch(`/api/mysqlShippingP?date=${selectedDate}`);
                    const data = await response.json();
                    setData(data);
                    loadUserNames(data);
                } catch (error) {
                    console.error('Error fetching orders:', error);
                }
            };
            fetchData();
        }
    }, [selectedDate]);

    const getOrders = async (event: { target: { value: any; }; }) => {
        try {
            let data = {
                date: event.target.value,
            };
            setSelectedDate(data.date)
            const JSONdata = JSON.stringify(data);
            const endpoint = "/api/mysqlShippingP";
            const options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSONdata,
            };
            const response = await fetch(endpoint, options);
            const resDB = await response.json();
            setData(resDB);
            console.log("base", resDB);
        } catch {
            console.log("No hay datos DB");
        }
    };

    const handleStatusP = async (id: string): Promise<boolean> => {
        try {
            const currentStatus = await fetch(`/api/mysqlGetOrderStatus?id=${id}`).then(res => res.json());
            if (currentStatus.status !== 'Agendado') {
                return false; // El pedido ya está marcado como pagado, no necesitamos hacer nada
            }
            const response = await fetch(`/api/mysqlStatusProcesado?id=${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return response.ok;
        } catch (error) {
            console.error('Hubo un error', error);
            return false;
        }
    };

    const handleStatusF = async (id: string): Promise<boolean> => {
        try {
            const currentStatus = await fetch(`/api/mysqlGetOrderStatus?id=${id}`).then(res => res.json());
            if (currentStatus.status !== 'Facturar') {
                return false; // El pedido ya está marcado como pagado, no necesitamos hacer nada
            }
            const response = await fetch(`/api/mysqlStatusFacturado?id=${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return response.ok;
        } catch (error) {
            console.error('Hubo un error', error);
            return false;
        }
    };

    const getName = async (email: string): Promise<string | false> => {
        try {
            const response = await fetch(`/api/mysqlUserName?userEmail=${email}`);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const currentStatus = await response.json();
            return currentStatus.name;
        } catch (error) {
            console.error('Hubo un error', error);
            return false;
        }
    };

    const loadUserNames = async (data) => {
        const names = {};
        const promises = [];

        for (const items of Object.values(data)) {
            for (const item of items) {
                const email = item.user;
                console.log("nomete", email)
                promises.push(
                    getName(email).then((name) => {
                        if (name) {
                            names[email] = name;
                        }
                    })
                );
            }
        }

        await Promise.all(promises);
        setUserNames(names);
    };


    useEffect(() => {
        if (dataS.length > 0) {
            loadUserNames(dataS);
        }
    }, [dataS]);

    const exportTableToExcel = () => {
        const table = document.getElementById('excel');
        const workbook = XLSX.utils.table_to_book(table);
        XLSX.writeFile(workbook, 'CortePlanificacion.xlsx');
    };

    function checkStartsWith(shippingField: string): boolean {
        return Boolean(shippingField && shippingField.trim() !== '');
    }

    function getValidCOD_SAP(respuestaSAP: string) {
        try {
            const parts = respuestaSAP.split('|');
            const respPart = JSON.parse(parts[0]);
            let validCOD_SAP;
            if (Array.isArray(respPart.RESP)) {
                const validResp = respPart.RESP.find((r: { COD_SAP: { toString: () => string; }; }) => r.COD_SAP && !r.COD_SAP.toString().startsWith('000'));
                validCOD_SAP = validResp ? validResp.COD_SAP : null;
            } else {
                validCOD_SAP = respPart.RESP.COD_SAP && !respPart.RESP.COD_SAP.toString().startsWith('000') ? respPart.RESP.COD_SAP : null;
            }
            return validCOD_SAP;
        } catch (error) {
            console.error("Error al procesar los datos:", error);
            return null;
        }
    }

    function adjustDateForTimezone(dateString: any): string {
        const date = new Date(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        return adjustedDate.toLocaleDateString('es-CL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: 'numeric',
            minute: 'numeric'
        });
    }

    return (
        <>
            <div className="w-full sm:w-full items-center justify-center flex flex-col mt-10 shadow-md sm:rounded-lg py-4 px-4">
                <Text
                    title="Logística"
                    classe="dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
        mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
        border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]"
                    description="En esta sección podrás ver las órdenes listas para despachar según la fecha."
                />
                <form className="mt-4 mb-4 flex flex-col items-center justify-center">
                    <label className="text-gray-700 dark:text-gray-200 text-sm font-bold mb-2 mt-5">
                        Selecciona una fecha
                    </label>
                    <input
                        className="shadow appearance-none border mt-4 mb-4 rounded w-80 py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:shadow-outline"
                        type="date"
                        name="date"
                        id="date"
                        onChange={getOrders}
                    />
                </form>
                <button className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center" onClick={exportTableToExcel}>Descargar como Excel</button>
                <table id="excel" className="min-w-full divide-y divide-gray-200 mt-8 mb-4 text-sm text-left text-gray-500 dark:text-gray-200 rounded-t-lg">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left text-xs font-semibold uppercase tracking-wider rounded-tl-lg">
                                ID
                            </th>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left text-xs font-semibold uppercase tracking-wider">
                                ID SAP
                            </th>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left text-xs font-semibold uppercase tracking-wider">
                                Fecha de Creación
                            </th>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left text-xs font-semibold uppercase tracking-wider">
                                Fecha de Despacho
                            </th>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left text-xs font-semibold uppercase tracking-wider">
                                Estado
                            </th>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left text-xs font-semibold uppercase tracking-wider">
                                Tipo de Despacho
                            </th>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left text-xs font-semibold uppercase tracking-wider">
                                Observación
                            </th>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left text-xs font-semibold uppercase tracking-wider">
                                Clase de Pedido
                            </th>
                            <th scope="col" className="px-6 py-4 whitespace-pre-line text-sm text-gray-500 dark:text-gray-200">
                                Ejecutivo
                            </th>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left text-xs font-semibold uppercase tracking-wider rounded-tr-lg">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="rounded-b-lg">
                        {dataS ? Object.entries(dataS).map((items, i) => (
                            Object.entries(items[1]).map((item, j) => (
                                <tr key={i + '-' + j} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
                                    <td scope="row" className="text-center py-4 px-2 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out">
                                        {item[1].id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-200">
                                        {getValidCOD_SAP(item[1].respuestaSAP)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-200">
                                        {adjustDateForTimezone(item[1].order_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-200">
                                        {adjustDateForTimezone(item[1].Shipping_Fecha_de_Despacho_o_Retiro).toString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-200">
                                        {item[1].statusSAP}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-200">
                                        {item[1].Shipping_Tipo_de_Despacho}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-200">
                                        {item[1].Shipping_Observacion}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-200">
                                        {item[1].order_class}
                                    </td>
                                    <td className="px-6 py-4 whitespace-pre-line text-sm text-gray-500 dark:text-gray-200">
                                        {userNames[item[1].user]}
                                    </td>
                                    <td className="w-full sm:w-24 px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex flex-col gap-2">
                                        
                                        {item[1].order_class==="ZVFA"?<button className="mt-2 mb-5 bg-gradient-to-r from-orange-600/40 to-orange-800/40 border-2 drop-shadow-[0_9px_9px_rgba(177,155,0,0.75)] border-orange-800 hover:bg-orange-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-orange-500/40 dark:to-orange-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(255,255,0,0.25)] dark:border-orange-200 dark:hover:bg-orange-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                                            onClick={() => handleStatusF(item[1].id)}>
                                            Facturar
                                        </button>:<button className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)] border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)] dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                                            onClick={() => handleStatusP(item[1].id)}>
                                            Procesar
                                        </button>}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )) : (
                            <div className="flex flex-col justify-center items-center mt-4">
                                <div className="flex flex-col justify-center items-center animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
                            </div>
                        )}
                    </tbody>
                </table>

            </div>
        </>
    );
};

export default ShippingOrderTable;