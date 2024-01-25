//
//nextjs tailwind order table component

import { add } from "lodash";
import React from "react";
import { useState } from "react";
import Text from "./text";
import * as XLSX from 'xlsx';


const ShippingOrderTable = () => {

    function checkStartsWith(shippingField: string): boolean {
        return Boolean(shippingField && shippingField.trim() !== '');
    };

    function getValidCOD_SAP(respuestaSAP: string) {
        // Intenta parsear la respuesta
        try {
            // Separa las respuestas y toma la primera parte que contiene el objeto o array de RESP
            const parts = respuestaSAP.split('|');
            const respPart = JSON.parse(parts[0]);

            // Verifica si RESP es un array o un objeto y obtiene el COD_SAP válido
            let validCOD_SAP;
            if (Array.isArray(respPart.RESP)) {
                // Encuentra el primer objeto RESP que no tenga un COD_SAP que comienza con '000'
                const validResp = respPart.RESP.find((r: { COD_SAP: { toString: () => string; }; }) => r.COD_SAP && !r.COD_SAP.toString().startsWith('000'));
                validCOD_SAP = validResp ? validResp.COD_SAP : null;
            } else {
                // Si no es un array, verifica si el COD_SAP es válido y no comienza con '000'
                validCOD_SAP = respPart.RESP.COD_SAP && !respPart.RESP.COD_SAP.toString().startsWith('000') ? respPart.RESP.COD_SAP : null;
            }
            return validCOD_SAP;
        } catch (error) {
            console.error("Error al procesar los datos:", error);
            return null; // Retorna null si hay un error al procesar una entrada
        }
    }

    const exportTableToExcel = () => {
        // Obtener la tabla por su id o clase
        const table = document.getElementById('excel'); // Asegúrate de asignar un ID a tu tabla
        const workbook = XLSX.utils.table_to_book(table);

        // Escribe el archivo
        XLSX.writeFile(workbook, 'CortePlanificacion.xlsx');
    };


    const [dataS, setData] = useState();
    const getOrders = async (event: { target: { value: any; }; }) => {
        //event.preventDefault();
        try {
            let data = {
                date: event.target.value,
            };
            const JSONdata = JSON.stringify(data);
            const endpoint = "/api/mysqlShipping";
            const options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSONdata,
            };
            const response = await fetch(endpoint, options);
            const result = response;
            const resDB = await result.json();
            setData(resDB);
            console.log("base", resDB);
        } catch {
            console.log("No hay datos DB");
        }
    };


    const addVisit = async (info: {
        Shipping_Fecha_de_Despacho_o_Retiro: any;
        id: any;
        Shipping_Observacion: string;
        customer_email: string;
        customer_phone: string;
        customer_last_name: string;
        customer_name: string;
        billing_commune: any;
        Shipping_commune: string;
        billing_street: any;
        Shipping_street: string;
        billing_number: any;
        Shipping_number: string;
        billing_company_name: any;
        respuestaSAP: string;
    }) => {
        const response = await fetch('/api/simpliRouteConnectorPost', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: info.billing_company_name,
                numberAdd: checkStartsWith(info.Shipping_number) ? info.billing_number : info.Shipping_number,
                street: checkStartsWith(info.Shipping_street) ? info.billing_street : info.Shipping_street,
                comuna: checkStartsWith(info.Shipping_commune) ? info.billing_commune : info.Shipping_commune,
                names: checkStartsWith(info.customer_name) ? info.billing_company_name : info.customer_name,
                lastnames: checkStartsWith(info.customer_last_name) ? "sin" : info.customer_last_name,
                phone: checkStartsWith(info.customer_phone) ? "sin" : info.customer_phone,
                email: checkStartsWith(info.customer_email) ? "sin" : info.customer_email,
                referenceID: info.id,
                notes: checkStartsWith(info.Shipping_Observacion) ? "sin" : info.Shipping_Observacion,
                date: info.Shipping_Fecha_de_Despacho_o_Retiro,
            }),
        });

        const data = await response.json();

        console.log("un exito", data);
        return data;
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
                    {/* date picker */}
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
                    {/* submit button */}
                    {/* <button className="bmt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                    >Ver Pedidos</button> */}
                </form>
                <button className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center" onClick={exportTableToExcel}>Descargar como Excel</button>
                <table id="excel" className="min-w-full divide-y divide-gray-200 mt-8 mb-4 text-sm text-left text-gray-500 dark:text-gray-200 rounded-t-lg">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 rounded-t-lg">
                        <tr>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left text-xs font-semibold  uppercase tracking-wider rounded-tl-lg">
                                ID SAP
                            </th>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left text-xs font-semibold  uppercase tracking-wider">
                                Nombre Empresa
                            </th>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left text-xs font-semibold  uppercase tracking-wider">
                                Tipo de Despacho
                            </th>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left text-xs font-semibold  uppercase tracking-wider">
                                Dirección
                            </th>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left text-xs font-semibold  uppercase tracking-wider">
                                Teléfono
                            </th>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left text-xs font-semibold  uppercase tracking-wider">
                                Observación
                            </th>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left text-xs font-semibold  uppercase tracking-wider">
                                Fecha de Creación
                            </th>
                            <th scope="col" className="px-6 py-4 whitespace-nowrap bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-left text-xs font-semibold  uppercase tracking-wider rounded-tr-lg">
                                Fecha de Despacho
                            </th>
                        </tr>
                    </thead>
                    <tbody className="rounded-b-lg">
                        {dataS ? Object.entries(dataS).map((items: any, i: any) => (
                            console.log("gato", items),
                            Object.entries(items[1]).map((item: any, i: any) => (
                                console.log("gatox", item[1]),

                                <tr key={i} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-200">
                                        {getValidCOD_SAP(item[1].respuestaSAP)}
                                    </td>

                                    {/* <td

                                        scope="row"
                                        className="text-center py-4 px-2 font-medium text-gray-900 whitespace-nowrap dark:text-white dark:hover:text-gray-300 hover:text-gray-700 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out"
                                    >
                                        {item[1].customer_name} <br /> {checkStartsWith(item[1].customer_last_name) ? null : item[1].customer_last_name}
                                    </td> */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-200">
                                        {item[1].billing_company_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-200">
                                        {item[1].Shipping_Tipo_de_Despacho}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-200">

                                        {checkStartsWith(item[1].Shipping_street) === false ? `Dirección de Facturación:  ${item[1].billing_number} ${item[1].billing_street} ${item[1].billing_commune} Depto: ${item[1].billing_department}` :
                                            `Dirección de Despacho: ${item[1].Shipping_street} ${item[1].Shipping_number}, ${item[1].Shipping_commune} Depto: ${item[1].Shipping_department}`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-200">
                                        {item[1].Shipping_Observacion}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-200">
                                        {item[1].customer_phone}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-200">
                                        {item[1].order_date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-200">
                                        {item[1].Shipping_Fecha_de_Despacho_o_Retiro}
                                    </td>
                                    {/* <td className="w-full sm:w-24 px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
                                            onClick={() => addVisit(item[1])}>
                                            Enviar
                                        </button>
                                    </td> */}
                                </tr>
                            )
                            ))

                        ) : (
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