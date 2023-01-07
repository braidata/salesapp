import React, { useState, useEffect } from "react";
import { useDataData } from "../context/data";

export default function FormatContext({ context, componente }) {
    //const { dataValues } = useDataData;
    //context = JSON.stringify(context)
    const [contexts, setContext] = useState(context);
    const [statusQ, setStatusQ] = useState(false);
    const [errorStatus, setErrorStatus] = useState(null);
  
    console.log("los data values del form son:  ", JSON.stringify(contexts));
  
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
  
        id: contexts.g,
        customer_name: contexts.contact.Nombre,
        customer_last_name: contexts.contact.Apellido,
        customer_rut: contexts.contact.Rut,
        customer_email: contexts.contact.Email,
        customer_phone: contexts.contact.Telefono,
        billing_street: contexts.billingAddress.Calle,
        billing_number: contexts.billingAddress.Número,
        billing_commune: contexts.billingAddress.Comuna,
        billing_city: contexts.billingAddress.Ciudad,
        billing_region: contexts.billingAddress.Región,
        billing_department: contexts.billingAddress.Departamento,
        billing_zip_code: contexts.billingAddress.Código_Postal,
        billing_company_name: contexts.billing.Razón_Social,
        billing_company_rut: contexts.billing.Rut_Empresa,
        billing_company_business: contexts.billing.Giro,
        Shipping_Tipo_de_Despacho: contexts.shipping.Tipo_de_Despacho,
        Shipping_Fecha_de_Despacho_o_Retiro:contexts.shipping.Fecha_de_Despacho_o_Retiro,
        Shipping_Rut_Retira: contexts.shipping.Rut_Retira,
        Shipping_Nombre_Retira: contexts.shipping.Nombre_Retira,
        Shipping_Observacion: contexts.shipping.Observación,
        Shipping_flete: contexts.products.Flete,
        Shipping_street: contexts.shippingAddress.Calle,
        Shipping_number: contexts.shippingAddress.Numero,
        Shipping_department: contexts.shippingAddress.Casa_o_depto,
        Shipping_region: contexts.shippingAddress.Región,
        Shipping_city: contexts.shippingAddress.Ciudad,
        Shipping_commune: contexts.shippingAddress.Comuna,
        Shipping_zip_code: contexts.shippingAddress.Código_Postal,
        user: "ibraidab@gmail.com",
        method: contexts.payment.Metodo_de_Pago,
        authorization_code: contexts.payment.Código_de_Autorización,
        payment_count: contexts.payment.Cantidad_de_Pagos,
        payment_amount: contexts.payment.Monto_de_Pagos,
        payment_date: contexts.payment.Fecha_de_Pago,
        dealId: Math.random().toString(36),
        ownerId: Math.random().toString(36),
        order_items: [],
      };
  
    //   contexts.products.map((product, index) => {
    //     console.log(
    //       "el producto es",
    //       index < product.length
    //         ? product[index].properties.name
    //         : product[0].properties.name,
    //       datas.order_items
    //     ),
    //       datas.order_items.push({
    //         name:
    //           index < product.length
    //             ? product[index].properties.name
    //             : product[0].properties.name,
    //         price:
    //           index < product.length
    //             ? product[index].properties.price
    //             : product[0].properties.amount,
    //         quantity:
    //           index < product.length
    //             ? product[index].properties.quantity
    //             : product[0].properties.quantity,
    //         sku:
    //           index < product.length
    //             ? product[index].properties.sku
    //             : product[0].properties.hs_sku,
    //       });
    //   });
  
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
  
  {statusQ && !errorStatus  ? componente : null}
  
        {/* <button onClick={userSender}>Guarda Ownera</button> */}
      </div>
    );
  }