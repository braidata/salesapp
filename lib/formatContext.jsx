//format context and prepare to send to database
// import yup
import * as yup from "yup";
//import rut validator
//import { validateRUT, getCheckDigit, generateRandomRUT } from "validar-rut";
import React, { useState, useEffect, useRef } from "react";
import { useDataData } from "../context/data";
import ProductTable from "../components/productTable";
//prisma
import { PrismaClient } from "@prisma/client";
import data from "./data";
import styles from "../styles/styles.module.scss";
import { isLabeledStatement } from "typescript";
import Link from "next/link";




export default function FormatContext({ context, componente }) {
  const divRef = useRef();
  const { dataValues } = useDataData;

  //context = JSON.stringify(context)
  const [contexts, setContext] = useState(context);
  const [statusQ, setStatusQ] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);
  const [errorStatus2, setErrorStatus2] = useState(null);
  const [errorH, setHStatus] = useState(null);
  const [datos, setDatos] = useState(null);

  console.log("los data values son:  ", JSON.stringify(contexts));

  const validateRUT = async (rut) => {
    try {
      const response = await fetch(`https://api.libreapi.cl/rut/validate?rut=${rut}`);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      return data.data.valid; // Devolviendo directamente la propiedad "valid".

    } catch (error) {
      console.error('Error fetching and parsing data:', error);
      throw error;
    }
  }


  async function checkStockAvailable(sku, quantityRequested, werks, lgort) {
    console.log('Verificando SKU:', sku);
  
    // Inicializar un objeto de resultado con todas las propiedades necesarias
    const result = {
      sku: sku,
      checkSkipped: false,
      stockAvailable: null,
      message: ''
    };
  
    // Verificar si el SKU es "600003" o "600001" y saltar la verificación de stock si es necesario
    if (sku === "600003" || sku === "600001") {
      console.log(`SKU ${sku} contiene "60000", saltando la verificación de stock.`);
      result.checkSkipped = true;
      result.message = `No stock check required for SKU: ${sku}.`;
      return result;
    }
  
    try {
      const response = await fetch(`/api/apiSAPStock?Material=${sku}&werks=${werks}&lgort=${lgort}`);
      if (response.ok) {
        const data = await response.json();
        result.stockAvailable = data.stock_disp;
        //console.log("dispo", result.stockAvailable, data.stock_disp)
        
        if (data.stock_disp < quantityRequested) {
          console.log('Stock insuficiente para el SKU:', sku);
          result.message = 'Stock insuficiente';
        } else {
          console.log('Stock suficiente para el SKU:', sku);
          return true; // Aquí podríamos simplemente devolver result si queremos mantener la estructura consistente
        }
      } else {
        console.log('Respuesta no OK para el SKU:', sku);
        result.message = 'Respuesta no OK al verificar stock';
      }
    } catch (error) {
      console.error("Error al comprobar stock para el SKU:", sku, error);
      result.message = 'Error al verificar stock';
    }
    return result;
  }
  
  
  
  
  yup.addMethod(yup.object, "checkStock", function (werks, lgort) {
    return this.test('check-stock', '', async function (value) {
      const { sku, quantity } = value;
      const result = await checkStockAvailable(sku, quantity, werks, lgort);
  
      // Verifica si la comprobación se ha saltado primero.
      if (result.checkSkipped) {
        console.log(`Stock check skipped for SKU: ${sku}.`);
        return true; // No hay necesidad de comprobar el stock, devolver true inmediatamente.
      }
  
      // Si el resultado es true, hay suficiente stock.
      if (result === true) {
        return true;
      }
  
      // Si el resultado tiene una propiedad stockAvailable que es null o undefined, asumir que hubo un error.
      if (result.stockAvailable == null) {
        return this.createError({
          message: result.message // Usa el mensaje de error del resultado
        });
      }
  
      // Si el resultado es un objeto con la propiedad stockAvailable, significa que no hay suficiente stock.
      if (typeof result.stockAvailable === 'number') {
        const stockAvailable = Math.floor(result.stockAvailable);
        return this.createError({
          message: `No hay suficiente stock para el producto con SKU: ${sku}. Stock disponible: ${stockAvailable}`
        });
      }
    });
  });
  
  



  







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
      centro: contexts.deale[0].centro,
      almacen: contexts.deale[0].almacen,
      canal: contexts.deale[0].canal,
      clase: contexts.deale[0].clase,
      method: contexts.deale[0].metodo_de_pago,
      type: contexts.deale[0].tipo_pago_sap,
      OC: contexts.deale[0].orden_de_compra,
      rut_pagador: contexts.deale[0].rut_pagador,
      authorization_code: contexts.deale[0].codigos_de_autorizacion,
      payment_count: contexts.deale[0].cantidad_de_pagos,
      payment_amount: contexts.deale[0].amount,
      payment_date: contexts.deale[0].fecha_de_validacion_de_pagos,
      dealId: contexts.deale[0].hs_object_id,
      statusSAP: "Procesando",
      ownerId: contexts.owners.success[3],
      ownerIdM: contexts.owners.success[0],
      order_items: [],
    };

    function esProductoUnico(producto, array) {
      return !array.some(item => item.name === producto.name);
    }


    contexts.products.map((product, index) => {
      const producto = {
        name: product[index]?.properties.name || product[0]?.properties.name,
        price: product[index]?.properties.price || product[0]?.properties.amount,
        quantity: product[index]?.properties.quantity || product[0]?.properties.quantity,
        sku: product[index]?.properties.sku || product[0]?.properties.hs_sku,
        discount: product[index]?.properties.discount || product[0]?.properties.hs_discount_percentage,
      };
      
    
      if (esProductoUnico(producto, datas.order_items)) {
        datas.order_items.push(producto);
        console.log("el producto es", producto.name, datas.order_items);
      }
    });
    setDatos(contexts.deale[0].hs_object_id);
    console.log("la dato es", datos);

    //validate datas with yup
    const schema = yup.object().shape({

      customer_email: yup.string().nullable(
        "Email es requerido"
      ).test({
        name: "Email",
        message: "Ingresa un Email en HubSpot",
        test: (value) => {

          if (value === null) {
            return false;
          } else {
            return true;
          }
        }
      }),

      billing_street: yup.string().nullable(
        "Calle es requerido"
      ).test({
        name: "Calle",
        message: "Ingresa una Calle en HubSpot",
        test: (value) => {

          if (value === null) {
            return false;
          } else {
            return true;
          }
        }
      }),
      billing_number: yup.string().nullable(
        "Número de Calle es requerido"
      ).test({
        name: "Número de Calle",
        message: "Ingresa un Número de Calle en HubSpot",
        test: (value) => {

          if (value === null) {
            return false;
          } else {
            return true;
          }
        }
      }),
      billing_commune: yup.string().nullable(
        "Comuna es requerido"
      ).test({
        name: "Comuna",
        message: "Ingresa una Comuna en HubSpot",
        test: (value) => {

          if (value === null) {
            return false;
          } else {
            return true;
          }
        }
      }),
      billing_city: yup.string().nullable(
        "Ciudad es requerido"
      ).test({
        name: "Ciudad",
        message: "Ingresa una Ciudad en HubSpot",
        test: (value) => {

          if (value === null) {
            return false;
          } else {
            return true;
          }
        }
      }),
      billing_region: yup.string().nullable(
        "Región es requerido"
      ).test({
        name: "Región",
        message: "Ingresa una Región en HubSpot",
        test: (value) => {

          if (value === null) {
            return false;
          } else {
            return true;
          }
        }
      }),

      billing_company_name: yup.string().nullable(
        "Razón Social es requerido"
      ).test({
        name: "Razón Social",
        message: "Ingresa una Razón Social en HubSpot",
        test: (value) => {

          if (value === null) {
            return false;
          } else {
            return true;
          }
        }
      }),

      billing_company_rut: yup.string().test({
        name: "Rut Empresa",
        message: "Ingresa un Rut Empresa válido en HubSpot",
        test: async function (value) {
          if (value) {
            try {
              return await validateRUT(value);
            } catch (error) {
              // Aquí puedes decidir qué hacer si hay un error. 
              // Puedes retornar false o configurar un mensaje de error personalizado.
              this.createError({
                path: this.path,
                message: 'Error al validar el RUT. Por favor, inténtalo de nuevo.'
              });
            }
          }
          // Si value no está presente o es falsy (por ejemplo, una cadena vacía), puedes decidir si eso es válido o no.
          // Si decides que no es válido cuando no hay valor, simplemente retornar false.
          return false;
        }
      }),

      billing_company_business: yup.string().nullable(
        "Giro es requerido"
      ).test({
        name: "Giro",
        message: "Ingresa un Giro en HubSpot",
        test: (value) => {

          if (value === null) {
            return false;
          } else {
            return true;
          }
        }
      }),

      //valida que el array productos tenga al menos un producto

      order_items: yup
        .array()
        .of(
          yup.object().shape({
            product_id: yup
              .string()
              .nullable("Producto es requerido")
              .test({
                name: "Producto",
                message: "Ingresa un Producto en HubSpot",
                test: (value) => {
                  if (value === null) {
                    return false;
                  } else {
                    return true;
                  }
                },
              }),
            quantity: yup
              .number()
              .nullable()
              .required("Cantidad es requerida")
              .test(
                "check-stock",
                "No hay suficiente stock para el producto seleccionado",
                async function (value) {
                  const parentData = this.parent;
                  const sku = parentData.sku || parentData.product_id;
                  console.log("DATAZOS",this.parent,"sku", sku, "value", value, "centro", contexts.deale[0].centro, "almacen", contexts.deale[0].almacen)
                  if (sku === "600003" || sku === "600001") {
                    console.log(`SKU ${sku} es un flete, saltando la verificación de stock.`);
                    return true;
                  }
                  const result = await checkStockAvailable(
                    sku,
                    value,
                    contexts.deale[0].centro,
                    contexts.deale[0].almacen
                  );
                  if (result !== true) {
                    // Crear un error con un mensaje personalizado
                    return this.createError({
                      message: `No hay suficiente stock para el producto con SKU: ${sku}. Stock disponible: ${Math.floor(result.stockAvailable)}`,
                      path: this.path, // 'quantity'
                    });
                  }
                  return true;
                }
              ),
            // ...otras validaciones para los campos del producto...
          })
        )
        .min(1, "Debes agregar al menos un producto")
        .test({
          name: "Productos",
          message: "Ingresa al menos un Producto en HubSpot",
          test: (value) => {
            if (value.length === 0) {
              return false;
            } else {
              return true;
            }
          },
        }),
    });

    try {

      //use schema to validate datas
      await schema.validate(datas, { abortEarly: false });
      //if validation is ok, send datas to mysql
      orderA(datas);

    } catch (err) {

      const errors = {};
      const messages = {};
      // Validation failed - do show error
      if (err) {
        const errors = {};
        // Validation failed - do show error
        if (err instanceof yup.ValidationError) {
          console.log(err.inner);
          // Validation failed - do show error
          err.inner.forEach((error) => {
            errors[error.path] = error.message;
          });
          setHStatus(errors);
        }
        ;
        //divRef.current.setErrors(errors);
        // setHStatus("gato23");

      }
    }
  };

  const stateChanger = async (id) => {

    try {
      const data = {
        id: id,
      };
      const JSONdata = JSON.stringify(data);
      const endpoint = "/api/dealStage";
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSONdata,
      };
      let response = await fetch(endpoint, options);
      let result = await response.json();

      console.log("estados", result);
    } catch {
      console.log("No cambio de estado");
    }
  };

  const orderA = async (datas) => {
    setDatos(contexts.deale[0].hs_object_id);
    console.log("la dato es", datos, contexts.deale[0].hs_object_id);

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
    console.log("base", resDB[0], "datos", datas);
    // si la respuesta no es error cambiar estado en hubspot  

    resDB[0] === "P2002" ? setErrorStatus(true) : null;
    resDB[0] === "P2009" ? setErrorStatus2(true) : null;
    setStatusQ(true);
    stateChanger(contexts.deale[0].hs_object_id);
  }

  return (
    <>
      <div >
        <button
          className={` ${statusQ
            ? "hidden"
            : "hover:bg-blue-800/90"
            } mt-2 mb-5 text-gray-800 bg-gradient-to-r from-indigo-600/40 to-indigo-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)]  border-indigo-800 hover:bg-indigo-600/50  dark:bg-gradient-to-r dark:from-indigo-500/40 dark:to-indigo-800/60 border-4 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:border-opacity-50 dark:hover:bg-sky-600/50 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-0 hover:skew-x-0 hover:skew-y-0 hover:scale-105 focus:-rotate-0 focus:-skew-x-0 focus:-skew-y-0 focus:scale-90 transition duration-500 origin-center `}
          onClick={orderSender}>Enviar Orden a SAP</button>

        {errorStatus ? <div className="mt-5 mb-5 bg-orange-700/90 border border-gray-300 text-center text-gray-900 text-md rounded-lg hover:bg-orange-600/90 focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5 dark:bg-orange-600/20 dark:hover:bg-orange-400/20 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        >Este pedido ya fue ingresado! Intenta con otro.</div> : null}

        {errorStatus2 ? <div className="mt-5 mb-5 bg-orange-700/90 border border-gray-300 text-center text-gray-900 text-md rounded-lg hover:bg-orange-600/90 focus:ring-blue-500 focus:border-blue-500 block w-96 p-2.5 dark:bg-orange-600/20 dark:hover:bg-orange-400/20 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        >Este negocio está incompleto y no pudo ser cargado, revisa los datos obligatorios e intenta nuevamente.</div> : null}

        {statusQ && !errorStatus && !errorStatus2 ? componente : null}

      </div>
      {
        errorH && <table className="flex flex-col items-center justify-center w-full bg-transparent border-collapse table-auto">

          <thead>
            <tr>
              {/* <th className="px-2 py-2">Campo</th> */}
              <th className="px-2 py-2">Datos Faltantes En HubSpot:</th>
              {/* <th className="px-2 py-2">Acción</th> */}
            </tr>
          </thead>
          <tbody>
            {Object.entries(errorH).map((error) => (
              <tr className="
              ">
                {/* <td className="border px-2 py-2">{error[0]}</td> */}
                <td className="border px-2 py-2 flex flex-col items-center justify-center w-full bg-transparent border-collapse table-auto">{error[1]}
                </td>

                <td className="border px-2 py-2 flex flex-col items-center justify-center w-full bg-transparent border-collapse table-auto">
                  {datos && <Link href={`https://app.hubspot.com/contacts/7811012/deal/${datos}`} target="_blank" rel="noreferrer" className="w-48 mt-2 mb-2 text-center  text-gray-800 bg-gradient-to-r from-yellow-600/60 to-orange-800/80 border-2 drop-shadow-[0_5px_5px_rgba(177,155,0,0.75)]  border-orange-800 hover:bg-yellow-600/50  dark:bg-gradient-to-r dark:from-yellow-500/40 dark:to-orange-800/60 border-4 dark:drop-shadow-[0_9px_9px_rgba(255,255,0,0.25)]  dark:border-orange-200  dark:hover:bg-orange-600/50 dark:text-gray-200 font-bold py-2 px-2 rounded-full transform perspective-1000 hover:rotate-0 hover:skew-x-0 hover:skew-y-0 hover:scale-105 focus:-rotate-0 focus:-skew-x-0 focus:-skew-y-0 focus:scale-90 transition duration-500 origin-center"
                  >Ir a HubSpot</Link>}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      }
    </>
  );
}
