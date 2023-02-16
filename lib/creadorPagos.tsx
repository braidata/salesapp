//server component to call the mysqlPayments api
import React, { useState, useEffect } from "react";

const CreadorPagos = () => {



    const [data, setData] = useState([]);
    //console.log()
    // useEffect(() => {
    //     fetch("/api/mysqlPayments")
    //     .then((res) => res.json())
    //     .then((data) => setData(data));
    // }, []);

    //evita esto, usa el form de abajo con una funcion que haga el fetch
    const handleSubmit = (e: any) => {
        e.preventDefault();
        const data = {
            order_id: e.target.order_id.value,
            rut_pagador: e.target.rut_pagador.value,
            payment_date: e.target.payment_date.value,
            payment_amount: e.target.payment_amount.value,
            method: e.target.method.value,
            payment_count: e.target.payment_count.value,
            authorization_code: e.target.authorization_code.value,
        };
        const JSONdata = JSON.stringify(data);
        fetch("/api/mysqlPaymentsCreator", {
            method: "POST",
            body: JSONdata,
        })
            .then((res) => res.json())
            .then((data) => setData(data));
    };



    return (
        <div>
            <h1>Pagos</h1>
            {/*  modifica <form action="/api/mysqlPayments" method="post"> para usar handlesubmit */}
            <form onSubmit={handleSubmit}>
                {/* <input type="text" name="fecha_pago" placeholder="fecha_pago" />
                <input type="text" name="rut_pagador" placeholder="rut_pagador" /> */}
                <input className="bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="order_id" placeholder="order_id" />
                <input className="bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="rut_pagador" placeholder="rut_pagador" />
                <input className="bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="method" placeholder="method" />
                <input className="bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="payment_date" placeholder="payment_date" />
                <input className="bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="payment_amount" placeholder="payment_amount" />
                <input className="bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="payment_count" placeholder="payment_count" />
                <input className="bg-gray-300 dark:bg-gray-800 text-gray-900 dark:text-gray-200" type="text" name="authorization_code" placeholder="authorization_code" />
                <button type="submit">Crear Pago</button>
            </form>
            {/* <h2>Resultados</h2>
            < table >
                <thead>
                    <tr>
                        <th>Número de Pedido</th>
                        <th>Rut del Pagador</th>
                        <th>Fecha de Pago</th>
                        <th>Monto Total</th>
                        <th>Tipo de Pago</th>
                        <th>Cantidad de Pagos</th> 
                        <th>Código de Autorización</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(data).map((item: any) => (
                        console.log("pagotes", item),
                        item[1].map((itemsub: any, index: React.Key | null | undefined) => (
                            <tr key={itemsub.order_id}>
                                <td>{itemsub.order_id}</td>
                                <td>{itemsub.rut_pagador}</td>
                                <td>{itemsub.payment_date}</td>
                                <td>{itemsub.payment_amount}</td>
                                <td>{itemsub.method}</td>
                                <td>{itemsub.payment_count}</td>
                                <td>{itemsub.authorization_code}</td>
                            </tr>
                        ))
                    ))}
                </tbody>
            </table> */}
        </div>
    );
};

export default CreadorPagos;