import React, { useState, useEffect } from "react";
import {useSession} from "next-auth/react";
import { useDataData } from "../context/data";



export default function FormatContext({ context, componente }) {
    //const { dataValues } = useDataData;
    //context = JSON.stringify(context)
    const [contexts, setContext] = useState(context);
    const [statusQ, setStatusQ] = useState(false);
    const [errorStatus, setErrorStatus] = useState(null);
    const {data: session} = useSession()
    console.log("los data values del form son:  ", JSON.stringify(contexts), "y el user es: ", null);
  
    // console.log("la data es", datas)
  
    //create entries in database
    const userSender = async (event) => {
      //event.preventDefault();
      try {
        const data = {
          name: session.token.name,//contexts.owners.success[1] ,
          email: session.token.email,//contexts.owners.success[0],
          id: parseInt(session.token.sub)
        };
        const JSONdata = JSON.stringify(data);
        const endpoint = "/api/mysqlConsulta";
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

    const chunkSize = 5;
      const product  = []
      const size = contexts.products.length
  
    const orderSender = async (event) => {
      event.preventDefault();
      
      console.log("Providers", session)
  
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
        Shipping_Fecha_de_Despacho_o_Retiro:contexts.shipping.Fecha_de_Despacho_o_Retiro,
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
        method: contexts.payment.Metodo_de_Pago,
        authorization_code: contexts.payment.Código_de_Autorización,
        payment_count: contexts.payment.Cantidad_de_Pagos,
        payment_amount: contexts.payment.Monto_de_Pagos,
        payment_date: contexts.payment.Fecha_de_Pago,
        dealId: contexts.contact.DealId,
        ownerId: parseInt(session.token.sub),
        ownerIdM: session.token.email,//parseInt(Math.random(10,200)*10),
        order_items: [],
      };

      
//const chunkSize = 5;
let counter = 0;

const product = Object.entries(contexts.products).map(function(element) {
  counter += 1;
  if (counter % chunkSize === 1) {
    // es el primer elemento de un nuevo pedazo, así que corta el array
    return Object.entries(contexts.products).slice(counter - 1, counter + chunkSize - 1);
  } else {
    // es un elemento más de un pedazo existente, así que regresa undefined
    // para que no se incluya en el nuevo array
    return undefined;
  }
});
//imprime product filtrado sin los undefined
console.log("rey", product.filter(function(element) {
    return element !== undefined;
    }));


      
      

        // Object.entries(contexts.products).map(
        //     (item, i) => {
        //     console.log("rey", i)
        //     const chunk =  Object.entries(contexts.products).slice(i, i + chunkSize);
        //     product.push(chunk);
            
        // })

        product.filter(function(element) {
            return element !== undefined;
            }).map((item,i) => {
            datas.order_items.push({
                
                name: item[1][1],
                price: item[2][1],
                quantity: item[3][1],
                sku: item[0][1],
               
            }),
            console.log("reyx", item, i)

            
            

        });

       

        


  
      
  
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
        className={`bg-blue-900/90  text-gray-800 font-bold py-2 px-2 mt-12 rounded-sm w-1 h-14 dark:bg-blue-600/20 dark:hover:bg-blue-400/20 dark:text-gray-800 ${
          statusQ
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-blue-800/90"
        }`}
         onClick={orderSender}>Enviar Orden a SAP</button>
  
  {errorStatus ? <div className="mt-5 mb-5 bg-orange-700/90 border border-gray-300 text-center text-gray-900 text-md rounded-lg hover:bg-orange-600/90 focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5 dark:bg-orange-600/20 dark:hover:bg-orange-400/20 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
   >Este pedido ya fue ingresado! Intenta con otro.</div> : null}
  
  {statusQ && !errorStatus  ? componente : null}
  
        <button onClick={userSender}>Guarda Ownera</button>
      </div>
    );
  }