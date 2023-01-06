//format context and prepare to send to database

import React, { useState, useEffect } from "react";
import { useDataData } from "../context/data";
import ProductTable from "../components/productTable";
//prisma
import { PrismaClient } from "@prisma/client";

export default function FormatContext({ context }) {
  const { dataValues } = useDataData;
  //context = JSON.stringify(context)
  const [contexts, setContext] = useState(context);
  const [statusQ, setStatusQ] = useState(false);

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
      billing_commune: contexts.billing[0].properties.comuna,
      billing_city: contexts.billing[0].properties.city,
      billing_region: contexts.billing[0].properties.state,
      billing_department: contexts.billing[0].properties.casa_depto,
      billing_zip_code: contexts.billing[0].properties.zip,
      billing_company_name: contexts.billing[0].properties.razon_social,
      billing_company_rut: contexts.billing[0].properties.rut_de_empresa,
      billing_company_business: contexts.billing[0].properties.giro_empresa,
      Shipping_Tipo_de_Despacho: contexts.deale[0].tipo_de_despacho,
      Shipping_Fecha_de_Despacho_o_Retiro:
        contexts.deale[0].fecha_despacho_retiro,
      Shipping_Rut_Retira: contexts.deale[0].rut_de_retiro,
      Shipping_Nombre_Retira: contexts.deale[0].nombre_retira,
      Shipping_Observacion: contexts.deale[0].observacion,
      Shipping_flete: contexts.deale[0].flete,
      user: contexts.user,
      method: contexts.deale[0].metodo_pago,
      authorization_code: contexts.deale[0].codigos_de_autorizacion,
      payment_count: contexts.deale[0].cantidad_de_pagos,
      payment_amount: contexts.deale[0].amount,
      payment_date: contexts.deale[0].fecha_de_validacion_de_pagos,
      dealId: contexts.deale[0].hs_object_id,
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
      console.log("base", resDB, datas);
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

      {/* <button onClick={userSender}>Guarda Ownera</button> */}
    </div>
  );
}
