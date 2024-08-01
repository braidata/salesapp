import React, { useState, useEffect } from "react";
import Link from "next/link";
import Text from "./text";
import * as XLSX from 'xlsx';

const ShippingOrderTable = () => {
    const [dataS, setData] = useState([]);
    const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
    const [selectedDate, setSelectedDate] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [activeFilter, setActiveFilter] = useState(null);

    // Estado para manejar los filtros
    const [filteredOrders, setFilteredOrders] = useState({});
    const [filter, setFilter] = useState({ orderId: null, status: null, tipoDespacho: null, sap: null, orderClass: null });

    const statusOptions = ["Agendado", "Procesado"];
    const tipoDespachoOptions = ["retira_local", "envio_starken_regiones", "envio_gratis_santiago"];
    const orderClassOptions = ["ZVFA", "ZVDI"];

    useEffect(() => {
        if (dataS && dataS.orders) {
            let orders = Array.isArray(dataS.orders) ? dataS.orders : Object.values(dataS.orders);
            let filtered = orders;

            if (filter.orderId) {
                filtered = filtered.filter(order => order.id.toString().includes(filter.orderId));
            }

            if (filter.status) {
                filtered = filtered.filter(order => order.statusSAP.toString().includes(filter.status));
            }
            //billing_company_name
            if (filter.tipoDespacho) {
                filtered = filtered.filter(order => order.Shipping_Tipo_de_Despacho.toString().includes(filter.tipoDespacho));
            }

            if (filter.sap) {
                filtered = filtered.filter(order => order.respuestaSAP?.toString().includes(filter.sap));
            }

            if (filter.orderClass) {
                filtered = filtered.filter(order => order.order_class?.toString().includes(filter.orderClass));
            }

            setFilteredOrders({ orders: filtered });
        } else {
            setFilteredOrders({ orders: [] });
        }
    }, [filter, dataS]);

    const handleFilterChange = (newFilter) => {
        setFilter({ ...filter, ...newFilter });
    };

    const handleOutsideClick = (event) => {
        if (event.target.id === "modal") {
            toggleModal();

        }
    };

    const clearFilter = (filterName) => {
        setFilter(prevFilters => ({
            ...prevFilters,
            [filterName]: ''
        }));
    };

    const toggleModal = () => {
        setShowModal(!showModal);
        setActiveFilter(null); // Close any active filter input when closing modal
    };

    const filterLabels = {
        orderId: 'ID',
        sap: 'ID SAP',
        status: 'Estado',
        tipoDespacho: 'Despacho',
        orderClass: 'Clase'
    };

    useEffect(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Los meses son 0-indexed, así que se añade 1
        const day = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        setSelectedDate(formattedDate);
    }, []);

    const handleDateChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
        setSelectedDate(event.target.value);
    };

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

    const handleColumnClick = async () => {
        // Cambiar el estado a procesado
        const updatedData = await Promise.all(
            dataS.orders.map(async (order) => {
                await handleStatusP(order.id);
                return { ...order, statusSAP: 'Procesado' };
            })
        );
        setData({ ...dataS, orders: updatedData });
    
        // Copiar los IDs al portapapeles
        const idsToCopy = dataS.orders.map(order => getValidCOD_SAP(order.respuestaSAP)).join('\n');
        try {
            await navigator.clipboard.writeText(idsToCopy);
            alert('IDs copiados al portapapeles');
        } catch (error) {
            console.error('Error al copiar los IDs al portapapeles:', error);
        }
    };
    

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
                        onChange={handleDateChange}
                        value={selectedDate}
                    />
                </form>
                <button className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center" onClick={exportTableToExcel}>Descargar como Excel</button>
                <div className="flex flex-row items-center justify-center px-2"
                ><Link href="/proceso" passHref>
                        <button
                            className="px-4 py-2 mx-2 my-2 dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-teal-400 hover:bg-teal-600/50 text-teal-900 dark:bg-gradient-to-r dark:from-teal-400/80 dark:via-teal-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-teal-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
        mt-48 mt-2 mb-5 bg-gradient-to-r from-teal-200 via-teal-100 to-green-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
        border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]"
                        >
                            Refrescar
                        </button>
                    </Link>
                    <button
                        onClick={toggleModal}
                        className="px-4 py-2 mx-2 my-2 dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
        mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
        border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]">
                        Filtros
                    </button></div>




                {showModal && (
                    <div
                        className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg z-30 mb-4"
                        id="modal"
                        onClick={handleOutsideClick}
                    >
                        <div className="flex items-center justify-center overflow-auto  top-0 left-0 w-full h-full z-30 bg-white/30 dark:bg-transparent">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-full">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Filtros</h2>
                                    <button
                                        onClick={toggleModal}
                                        className="text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-6 w-6"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-center w-full overflow-auto mt-4 gap-2">
                                    {['orderId','status', 'tipoDespacho', 'sap', 'orderClass'].map(filter => (
                                        <div key={filter} className="mb-2">
                                            <button
                                                onClick={() => setActiveFilter(filter)}
                                                className={`block w-48 text-left px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg ${activeFilter === filter ? 'font-bold' : ''}`}>
                                                {`Filtrar por ${filterLabels[filter]}`}
                                            </button>
                                            {activeFilter === filter && (
                                                <div className="relative mt-2">
                                                    {filter === 'status' || filter === 'tipoDespacho' || filter === 'orderClass' ? (
                                                        <select
                                                            value={filter[filter] || ''}
                                                            onChange={(e) => handleFilterChange({ [filter]: e.target.value })}
                                                            className="block w-full p-2.5 pr-10 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                        >
                                                            <option value="">{`Selecciona ${filterLabels[filter]}`}</option>
                                                            {(filter === 'status' ? statusOptions :
                                                                filter === 'tipoDespacho' ? tipoDespachoOptions : orderClassOptions).map(option => (
                                                                    <option key={option} value={option}>
                                                                        {option}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            placeholder={`Filtrar por ${filterLabels[filter]}`}
                                                            value={filter[filter]}
                                                            onChange={(e) => handleFilterChange({ [filter]: e.target.value })}
                                                            className="block w-full p-2.5 pr-10 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                        />
                                                    )}
                                                    <button
                                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-900 dark:text-gray-300 font-bold rounded-lg hover:text-gray-900 dark:hover:text-white transition duration-500 ease-in-out"
                                                        onClick={() => clearFilter(filter)}
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-5 w-5"
                                                            viewBox="0 0 24 24"
                                                            fill="currentColor"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M12 4V1L8 5l4 4V6a8 8 0 11-7.53 11.36l-1.42-1.42A10 10 0 1012 4z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <table id="excel" className="min-w-full divide-y divide-gray-200 mt-8 mb-4 text-sm text-left text-gray-500 dark:text-gray-200 rounded-t-lg">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left text-xs font-semibold uppercase tracking-wider rounded-tl-lg">
                                ID
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-4 whitespace-nowrap bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)] border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)] dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                                onClick={handleColumnClick}
                            >
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
                        {filteredOrders ? Object.entries(filteredOrders).map((items, i) => (
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
                                        
                                        {item[1].statusSAP !== "Procesado" && (<button className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)] border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)] dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                                            onClick={() => handleStatusP(item[1].id)}>
                                            Procesar
                                        </button>)}
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
