import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function FormatContext({ context, componente }) {

  const [contexts, setContext] = useState(context);
  const [statusQ, setStatusQ] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);
  const { data: session } = useSession()
  console.log("los data values del form son:  ", JSON.stringify(contexts), "y el user es: ", null);

  function transformProductsToObjectArray(products) {
    let productArray = [];
  
    // Obtener todas las claves que comienzan con "SKU"
    const skuKeys = Object.keys(products).filter(key => key.startsWith('SKU'));
  
    // Iterar sobre las claves para construir los productos
    for (const skuKey of skuKeys) {
      const suffix = skuKey.replace('SKU', '');

      productArray.push({
          sku: products[`SKU${suffix}`],
          name: products[`Nombre_Producto${suffix}`],
          price: products[`Precio${suffix}`],
          quantity: products[`Cantidad${suffix}`],
          discount: products[`Descuento${suffix}`] || 0
      });
    }

    console.log("los data productos es", productArray)
    return productArray;
}




  
  

  const orderSender = async (event) => {
    event.preventDefault();

    const productos = transformProductsToObjectArray(contexts.products);



    const datas = {


      customer_name: contexts.contact.Nombre,
      customer_last_name: contexts.contact.Apellido,
      customer_rut: contexts.contact.Rut,
      customer_email: contexts.contact.Email,
      customer_phone: contexts.contact.Telefono,
      billing_street: contexts.billingAddress.Calle,
      billing_number: contexts.billingAddress.Número,
      billing_commune: contexts.billingAddress.Comunas,
      // billing_city: contexts.billingAddress.Ciudad,
      // billing_region: contexts.billingAddress.Región,
      billing_department: contexts.billingAddress.Departamento,
      billing_zip_code: contexts.billingAddress.Código_Postal,
      billing_company_name: contexts.billing.Razón_Social,
      billing_company_rut: contexts.billing.Rut_Empresa,
      billing_company_business: contexts.billing.Giro,
      Shipping_Tipo_de_Despacho: contexts.shipping.Tipo_de_Despacho,
      Shipping_Fecha_de_Despacho_o_Retiro: contexts.shipping.Fecha_de_Despacho_o_Retiro,
      Shipping_Rut_Retira: contexts.shipping.Rut_Retira,
      Shipping_Nombre_Retira: contexts.shipping.Nombre_Retira,
      Shipping_Observacion: contexts.shipping.Observación,
      Shipping_flete: contexts.products.Flete,
      Shipping_street: contexts.shippingAddress.Calle,
      Shipping_number: contexts.shippingAddress.Numero,
      Shipping_department: contexts.shippingAddress.Casa_o_depto,
      // Shipping_region: contexts.shippingAddress.Región,
      // Shipping_city: contexts.shippingAddress.Ciudad,
      Shipping_commune: contexts.shippingAddress.Comunas,
      Shipping_zip_code: contexts.shippingAddress.Código_Postal,
      user: session.token.email,
      team: session.token.sub,
      rut_pagador: contexts.payment.rut_pagador,
      OC: contexts.payment.orden_de_compra,
      method: contexts.payment.Metodo_de_Pago,
      type: contexts.payment.Tipo_de_Pago,
      centro: contexts.payment.centro,
      almacen: contexts.payment.almacen,
      canal: contexts.payment.canal,
      clase: contexts.payment.clase_de_pedido,
      authorization_code: contexts.payment.Código_de_Autorización,
      payment_count: contexts.payment.Cantidad_de_Pagos,
      payment_amount: contexts.payment.Monto_de_Pagos,
      payment_date: contexts.payment.Fecha_de_Pago,
      dealId: contexts.contact.DealId,
      statusSAP: "Procesando",
      ownerId: parseInt(session.token.sub),
      ownerIdM: session.token.email,//parseInt(Math.random(10,200)*10),
      order_items: productos,
    };

    console.log("la data es rey", datas);
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
      resDB[0] === "P2002" || resDB[0] === "P2009" ? setErrorStatus(true) : null;
      //resDB[0] === "P2009"  ? setErrorStatus(true) : null;
      setStatusQ(true);
    } catch (e) {

      console.log("No hay datos DB", e);
    }
  };

  return (
    <div>

      <button
        className={`${statusQ
          ? "hidden"
          : "hover:bg-blue-800/90"
          } mt-2 mb-5 text-gray-800 bg-gradient-to-r from-indigo-600/40 to-indigo-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)]  border-indigo-800 hover:bg-indigo-600/50  dark:bg-gradient-to-r dark:from-indigo-500/40 dark:to-indigo-800/60 border-4 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:border-opacity-50 dark:hover:bg-sky-600/50 dark:text-gray-200 font-bold py-2 px-4 rounded-full`}
        onClick={orderSender}>Enviar Orden a SAP</button>

      {errorStatus ? <div className="mt-5 mb-5 bg-orange-700/90 border border-gray-300 text-center text-gray-900 text-md rounded-lg hover:bg-orange-600/90 focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5 dark:bg-orange-600/20 dark:hover:bg-orange-400/20 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      >Este pedido ya fue ingresado! Intenta con otro.</div> : null}

      {statusQ && !errorStatus ? componente : null}

      {/* <button onClick={userSender}>Guarda Ownera</button> */}
    </div>
  );
}