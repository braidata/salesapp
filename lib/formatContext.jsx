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
    const result =  response
    const resDB = await result.json()
    console.log("base", resDB
    );
   

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
    Shipping_Fecha_de_Despacho_o_Retiro: contexts.deale[0].fecha_despacho_retiro,
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
    order_items: []
    }

    contexts.products.map((product, index) => {
      console.log("el producto es", index < product.length ? product[index].properties.name : product[0].properties.name , datas.order_items),
      datas.order_items.push({
        name: index < product.length ? product[index].properties.name : product[0].properties.name,
        price: index < product.length ? product[index].properties.price : product[0].properties.amount,
        quantity: index < product.length ? product[index].properties.quantity : product[0].properties.quantity,
        sku: index < product.length ? product[index].properties.sku : product[0].properties.hs_sku
      })})

      


    

 

  console.log("la data es", datas)
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
    const result =  response
    const resDB = await result.json()
    console.log("base", resDB, datas
    );
   

  } catch(e) {
    console.log("No hay datos DB", e);
  }
};

return(

    <div>

        <button onClick={orderSender}>Enviar Orden</button>

        <button onClick={userSender}>Guarda Ownera</button>
    </div>






)








//   return (
//     <div>
//       <h2>Datos del Negocio Enviado</h2>
//       {/* show context data on table */}

//       {contexts
//         ? contexts.deale.map((deale, index) => (
//             <p className="text-gray-700 dark:text-gray-300" key={index}>
//               {`${deale.dealname} $ ${deale.amount}`}
//             </p>
//           ))
//         : null}

//       {contexts
//         ? contexts.contacts.map((deale, index) => (
//             <div>
//               <p className="text-gray-700 dark:text-gray-300" key={index}>
//                 {`${deale.properties.firstname} ${deale.properties.lastname}`}
//               </p>
//             </div>
//           ))
//         : null}

//       {contexts
//         ? contexts.contacts.map((deale) => (
//             <div>
//               <p className="text-gray-700 dark:text-gray-300">
//                 {Object.entries(deale.properties).map((key, value) => (
//                 //   <p className="text-gray-700 dark:text-gray-300">
//                 //     {`${key[0]} ${key[1]}`}
//                 //   </p>,
//                           <ProductTable
//                           keyN={key[0]}
//                           //value={Object.keys(key)}
//                           value2={Object.values(key)}
//                         />
//                 ))}
//               </p>
//             </div>
//           ))
//         : null}


// {contexts
//         ? contexts.products.map((deale) => (
//             <div>
//               <p className="text-gray-700 dark:text-gray-300">
//                 {deale.map((key) => (
//                 //   <p className="text-gray-700 dark:text-gray-300">
//                 //     {`${key[0]} ${key[1]}`}
//                 //   </p>,
//                           <ProductTable
//                           keyN={key.id}
//                           value={Object.keys(key.properties)}
//                           value2={Object.values(key.properties)}
//                         />
//                 ))}
//               </p>
//             </div>
//           ))
//         : null}

//       {/* <button onClick={sendData}>Send Data</button> */}
//     </div>
//   );
}

// const [context, setContext] = useState({
//     contacts: dataValues.contacts,
//     companies: dataValues.companies,
//     billing: dataValues.billing,
//     deals: dataValues.deals,
//     deale: dataValues.deale,
//     lines: dataValues.lines,
//     products: dataValues.products,
//     user: dataValues.user,
//     id: dataValues.id,
// });

// //set context for objects
// useEffect(() => {
//     setContext({
//     contacts: dataValues.contacts,
//     companies: dataValues.companies,
//     billing: dataValues.billing,
//     deals: dataValues.deals,
//     deale: dataValues.deale,
//     lines: dataValues.lines,
//     products: dataValues.products,
//     id: dataValues.id,
//     });
// }, [dataValues]);

// //format context
// useEffect(() => {
//     console.log(context)
// }, [context]);

// return (
//     <div>
//         <h1>Format Context</h1>
//         {/* show context data on table */}
//         <table>
//             <thead>
//                 <tr>
//                     <th>Contacts</th>
//                     <th>Companies</th>
//                     <th>Billing</th>
//                     <th>Deals</th>
//                     <th>Deale</th>
//                     <th>Lines</th>
//                     <th>Products</th>
//                     <th>User</th>
//                     <th>Id</th>
//                 </tr>
//             </thead>
//             <tbody>
//                 <tr>
//                     <td>{context.contacts}</td>
//                     <td>{context.companies}</td>
//                     <td>{context.billing}</td>
//                     <td>{context.deals}</td>
//                     <td>{context.deale}</td>
//                     <td>{context.lines}</td>
//                     <td>{context.products}</td>
//                     <td>{context.user}</td>
//                     <td>{context.id}</td>
//                 </tr>
//             </tbody>
//         </table>

//     </div>
// )
//}

// Path: lib\formatContext.jsx
