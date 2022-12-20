// //nextjs tailwind unform hubspot component

// import React from "react";
// import {Form} from "@unform/web";
// import Input from "../Input Fields/Input";

// import { useRef } from "react";

// import axios from "axios";
// import { useRouter } from "next/router";

// export default function UnformHubspot({  }) {
//   const formRef = useRef(null);
//   const router = useRouter();

//   const handleSubmit = (data) => {
//     // console.log(data);
//     axios
//       .post("/api/apihubspotdeals", {
//         data,
//       })
//       .then((response) => {
//         console.log(response);
//         router.push("/success");
//       })
//       .catch((error) => {
//         console.log(error);
//       });
//   };

//   return (
//     <Form ref={formRef} onSubmit={handleSubmit}>
//       <Input mail="true" name="email" type="email" placeholder="Email" />

//       <button type="submit">Enviar</button>
//     </Form>
//   );
// }
import { useRouter } from "next/router";
import { Form, Scope, Input } from "@unform/web";
import { useRef, useState, useEffect, createContext } from "react";
import axios from "axios";
import { useDataData } from "../../context/data";


let negocios = [];

export default function PageWithJSbasedForm2() {
  const formRef = useRef(null);
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [billing, setBilling] = useState([]);
  const [deals, setDeals] = useState([]);
  const [deale, setDeal] = useState([]);
  const [lines, setLine] = useState([]);
  const [products, setProducts] = useState([]);
  const [id, setId] = useState([]);
  const   {setDataValues } = useDataData();

  //crete context for objects
  const [context, setContext] = useState({
    contacts: contacts,
    companies: companies,
    billing: billing,
    deals: deals,
    deale: deale,
    lines: lines,
    products: products,
    id: id,
  });

  //set context for objects
  useEffect(() => {
    setContext({
      contacts: contacts,
      companies: companies,
      billing: billing,
      deals: deals,
      lines: lines,
      products: products,
    });
  }, [contacts, companies, billing , deals, deale, lines, products, id]);


  


  //indica el id del contacto 
  const contactoAsociado = async (event) => {
    event.preventDefault();
    const data = {
      email: event.target.email.value,
    };
    const JSONdata = JSON.stringify(data);
    const endpoint = "/api/apihubspotdeals";
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSONdata,
    };
    const response = await fetch(endpoint, options);
    let result = await response.json();
    try{
    const ids = result.data[0].id;
    idNegocio(event, ids);
    
    idCompanies(event, ids);
    console.log("Empresa asociada: ", companies);}
    catch{console.log("No se encontró el contacto")}
    setContacts(result.data);
    
  };

  const idCompanies = async (event, id) => {
    event.preventDefault();
    const data = {
      id: id,
    };
    const JSONdata = JSON.stringify(data);
    const endpoint = "/api/apiBillingIDS";
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSONdata,
    };
    const response = await fetch(endpoint, options);
    let result = await response.json();
    try{
      console.log("Empresa asociada: ", result.data[0].toObjectId);
    const ids = result.data[0].toObjectId;
    idEmpresa(event, ids);
    setCompanies(ids);
    console.log("Empresa asociada: ",ids, companies);}
    catch{console.log("No se encontró La Empresa")}
    
  };

  //indica los números de negocios asociados al contacto
  const idNegocio = async (event, id) => {
    event.preventDefault();
    const data = {
      id: id,
    };
    const JSONdata = JSON.stringify(data);
    const endpoint = "/api/apiHubspot";
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSONdata,
    };
    const response = await fetch(endpoint, options);
    let result = await response.json();
    
    const idT = result.data.map((deal) => deal);
    let DealNS = []
    setDeals(DealNS);
    let idL = result.data.map((deal) => DealNS.push(deal.toObjectId));
    
    DealNS.map((deal) => (idDeals(event, deal), idLinea(event, deal)));
    //console.log("Lineas: " ,idL, idT, DealNS, lines)
  };

  //id line items hubspot
  const idLinea = async (event, id) => {
    const data = {
      id: id,
    };
    const JSONdata = JSON.stringify(data);
    const endpoint = "/api/apihubspotline";
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSONdata,
    };
    const response = await fetch(endpoint, options);
    let result = await response.json();
    try {
      //const idP = result.data[0].toObjectId;
      let LineNS = []
      setLine(LineNS);
      let idP = result.data.map((Line) => LineNS.push(Line.toObjectId));
      //let idP = result.data.map((deal) => DealNS.push(deal.toObjectId));
      //setLine(result.data);
      LineNS.map((line) => idProducts(event, line));
      //console.log("Lineas3: " ,id, idP, LineNS, "lineas", lines)
      //idProducts(event, LineNS);
      
    } catch {
      console.log("No hay linea"), (<h1>No hay linea</h1>);
    }
  };
//info de empresa
const idEmpresa = async (event, id) => {
  const data = {
    id: id,
  };
  const JSONdata = JSON.stringify(data);
  const endpoint = "/api/apiBilling";
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSONdata,
  };
  const response = await fetch(endpoint, options);
  let result = await response.json();
  setBilling(result.data);
};




  const idProducts = async (event, id) => {
    const data = {
      id: id,
    };
    const JSONdata = JSON.stringify(data);
    const endpoint = "/api/apihubspotproduct1";
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSONdata,
    };
    const response = await fetch(endpoint, options);
    let result = await response.json();
    setProducts(result.data);
  };
  const idDeals = async (event, id) => {
    const data = {
      id: id,
    };
    const JSONdata = JSON.stringify(data);
    const endpoint = "/api/extractDeal";
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSONdata,
    };
    let response = await fetch(endpoint, options);
    let result = await response.json();
    negocios.push(result.data);
    setDataValues(context)
  };



  return (
    <div className="mt-10">
      <form onSubmit={contactoAsociado}>
        <label className="mt-2 mb-5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" htmlFor="email">Email </label>
        <input
          className="mt-2 mb-5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-500 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          type="email"
          id="email"
          name="email"
          //required
        />
        <button
          className="mt-2 mb-5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          type="submit"
        >
          Buscar datos en HubSpot{" "}
        </button>
        <button
          className="mt-2 mb-5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          type="submit"
        >
          Cargar datos al Formulario{" "}
        </button>
      </form>
      
      {console.log("Context: ", context)}
      
    </div>
  );
}