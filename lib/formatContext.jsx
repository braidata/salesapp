//format context and prepare to send to database

import React, { useState, useEffect } from "react";
import { useDataData } from "../context/data";
import ProductTable from "../components/productTable";
//prisma
import { PrismaClient } from "@prisma/client";

export default function FormatContext({ context, componente }) {
  const { dataValues } = useDataData;
  //context = JSON.stringify(context)
  const [contexts, setContext] = useState(context);
  const [statusQ, setStatusQ] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);
  const [errorStatus2, setErrorStatus2] = useState(null);

  console.log("los data values son:  ", JSON.stringify(contexts));

  // console.log("la data es", datas)

  //create entries in database
  const userSender = async (event) => {
    //event.preventDefault();
    try {
      const data = {
        name: contexts.owners.success[1],
        email: contexts.owners.success[0],
        ownerId: contexts.owners.success[3],
      };
      const JSONdata = JSON.stringify(data);
      const endpoint = "/api/mysqlConnector";
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
      console.log("base", resDB);
    } catch {
      console.log("No hay datos DB");
    }
  };

  const orderSender = async (event) => {
    event.preventDefault();

    const datas = {

      id: contexts.deale[0].id,
      customer_name: contexts.contacts[0].properties.firstname,
      customer_last_name: contexts.contacts[0].properties.lastname,
      customer_rut: contexts.contacts[0].properties.rut,
      customer_email: contexts.contacts[0].properties.email,
      customer_phone: contexts.contacts[0].properties.mobilephone,
      billing_street: contexts.billing[0].properties.calle,
      billing_number: contexts.billing[0].properties.numero_direccion,
      billing_commune: contexts.billing[0].properties.comuna_facturacion,
      billing_city: contexts.billing[0].properties.ciudad_facturacion,
      billing_region: contexts.billing[0].properties.region_facturacion,
      billing_department: contexts.billing[0].properties.casa_depto,
      billing_zip_code: contexts.billing[0].properties.zip,
      billing_company_name: contexts.billing[0].properties.razon_social,
      billing_company_rut: contexts.billing[0].properties.rut_de_empresa,
      billing_company_business: contexts.billing[0].properties.giro_empresa,
      Shipping_Tipo_de_Despacho: contexts.deale[0].tipo_de_despacho,
      Shipping_Fecha_de_Despacho_o_Retiro: contexts.deale[0].fecha_despacho_retiro,
      Shipping_Rut_Retira: contexts.deale[0].rut_de_retiro,
      Shipping_Nombre_Retira: contexts.deale[0].nombre_retira,
      Shipping_Observacion: contexts.deale[0].observacion,
      Shipping_flete: contexts.deale[0].flete,
      Shipping_street: contexts.deale[0].calle_envio,
      Shipping_number: contexts.deale[0].numero_envio,
      Shipping_department: contexts.deale[0].casa_o_depto_de_envio,
      Shipping_region: contexts.deale[0].region_envio,
      Shipping_city: contexts.deale[0].ciudad_envio,
      Shipping_commune: contexts.deale[0].comuna_envio,
      Shipping_zip_code: contexts.deale[0].codigo_postal_de_envio,
      user: contexts.user,
      team: contexts.team,
      method: contexts.deale[0].metodo_pago,
      oc: contexts.deale[0].orden_de_compra,
      rut_pagador: contexts.deale[0].rut_pagador,
      authorization_code: contexts.deale[0].codigos_de_autorizacion,
      payment_count: contexts.deale[0].cantidad_de_pagos,
      payment_amount: contexts.deale[0].amount,
      payment_date: contexts.deale[0].fecha_de_validacion_de_pagos,
      dealId: contexts.deale[0].hs_object_id,
      ownerId: contexts.owners.success[3],
      ownerIdM: contexts.owners.success[0],
      order_items: [],
    };

  
     

    contexts.products.map((product, index) => {
      console.log(
        "el producto es",
        index < product.length
          ? product[index].properties.name
          : product[0].properties.name,
        datas.order_items
      ),
        datas.order_items.push({
          name:
            index < product.length
              ? product[index].properties.name
              : product[0].properties.name,
          price:
            index < product.length
              ? product[index].properties.price
              : product[0].properties.amount,
          quantity:
            index < product.length
              ? product[index].properties.quantity
              : product[0].properties.quantity,
          sku:
            index < product.length
              ? product[index].properties.sku
              : product[0].properties.hs_sku,
        });
    });

    console.log("la data es", datas);
    try {
      const JSONdata = JSON.stringify(datas);
      const endpoint = "/api/mysqlWriter";
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
      console.log("base", resDB[0], datas);
      resDB[0] === "P2002"  ? setErrorStatus(true) : null;
      resDB[0] === "P2009"  ? setErrorStatus2(true) : null;
      setStatusQ(true);
    } catch (e) {
      
      console.log("No hay datos DB", e);
    }
  };

  return (
    <div>
     
      <button
      className={`bg-blue-900/90  text-gray-800 font-bold py-2 px-2 mt-12 rounded-sm w-1 h-14 dark:bg-blue-600/20 dark:hover:bg-blue-400/20 dark:text-gray-800 ${
        statusQ
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-blue-800/90"
      }`}
       onClick={orderSender}>Enviar Orden a SAP</button>

{errorStatus ? <div className="mt-5 mb-5 bg-orange-700/90 border border-gray-300 text-center text-gray-900 text-md rounded-lg hover:bg-orange-600/90 focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5 dark:bg-orange-600/20 dark:hover:bg-orange-400/20 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
 >Este pedido ya fue ingresado! Intenta con otro.</div> : null}

{errorStatus2 ? <div className="mt-5 mb-5 bg-orange-700/90 border border-gray-300 text-center text-gray-900 text-md rounded-lg hover:bg-orange-600/90 focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5 dark:bg-orange-600/20 dark:hover:bg-orange-400/20 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
 >Este negocio está incompleto y no pudo ser cargado, revisa los datos obligatorios e intenta nuevamente.</div> : null}

{statusQ && !errorStatus && !errorStatus2  ? componente : null}

      {/* <button onClick={userSender}>Guarda Ownera</button> */}
    </div>
  );
}
