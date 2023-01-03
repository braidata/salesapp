//format context and prepare to send to database

import React, { useState, useEffect } from "react";
import { useDataData } from "../context/data";
import ProductTable from "../components/productTable";

export default function FormatContext({ context }) {
  const { dataValues } = useDataData;
  //context = JSON.stringify(context)
  const [contexts, setContext] = useState(context);

  console.log("los datavalues son:  ", JSON.stringify(contexts));

  //sen context data to database mysql
  const sendData = async () => {
    const response = await fetch("/api/sendData", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(context),
    });
    const result = await response.json();
    console.log(result);
  };

  return (
    <div>
      <h2>Datos del Negocio Enviado</h2>
      {/* show context data on table */}

      {contexts
        ? contexts.deale.map((deale, index) => (
            <p className="text-gray-700 dark:text-gray-300" key={index}>
              {`${deale.dealname} $ ${deale.amount}`}
            </p>
          ))
        : null}

      {contexts
        ? contexts.contacts.map((deale, index) => (
            <div>
              <p className="text-gray-700 dark:text-gray-300" key={index}>
                {`${deale.properties.firstname} ${deale.properties.lastname}`}
              </p>
            </div>
          ))
        : null}

      {contexts
        ? contexts.contacts.map((deale) => (
            <div>
              <p className="text-gray-700 dark:text-gray-300">
                {Object.entries(deale.properties).map((key, value) => (
                //   <p className="text-gray-700 dark:text-gray-300">
                //     {`${key[0]} ${key[1]}`}
                //   </p>,
                          <ProductTable
                          keyN={key[0]}
                          //value={Object.keys(key)}
                          value2={Object.values(key)}
                        />
                ))}
              </p>
            </div>
          ))
        : null}


{contexts
        ? contexts.products.map((deale) => (
            <div>
              <p className="text-gray-700 dark:text-gray-300">
                {deale.map((key) => (
                //   <p className="text-gray-700 dark:text-gray-300">
                //     {`${key[0]} ${key[1]}`}
                //   </p>,
                          <ProductTable
                          keyN={key.id}
                          value={Object.keys(key.properties)}
                          value2={Object.values(key.properties)}
                        />
                ))}
              </p>
            </div>
          ))
        : null}

      {/* <button onClick={sendData}>Send Data</button> */}
    </div>
  );
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
