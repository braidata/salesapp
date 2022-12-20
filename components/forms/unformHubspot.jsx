// //nextjs tailwind unform hubspot component

import { useState, useEffect } from "react";
import { useDataData } from "../../context/data";
import SpinnerButton from "../spinnerButton";

let negocios = [];
let negoci;

export default function PageWithJSbasedForm2() {
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [billing, setBilling] = useState([]);
  const [deals, setDeals] = useState([]);
  const [deale, setDeal] = useState([]);
  const [lines, setLine] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsA, setProductsA] = useState([]);
  const [id, setId] = useState([]);
  const { setDataValues } = useDataData();
  const [isLoading, setIsLoading] = useState(false);
  //crete context for objects
  const [context, setContext] = useState({
    contacts: contacts,
    companies: companies,
    billing: billing,
    deals: deals,
    deale: deale,
    lines: lines,
    products: new Set(products),
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
  }, [contacts, companies, billing, deals, deale, lines, products, id]);
  //ejecutadora de funciones
  const ejecutadora = async (event) => {
    contactoAsociado(event);
    //wait for 2 seconds
    setTimeout(() => {
      //your code to be executed after 2 seconds
      contactoAsociado(event);
    }, 5000);
  };

  //indica el id del contacto
  const contactoAsociado = async (event) => {
    event.preventDefault();
    spinner();
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
    try {
      const ids = result.data[0].id;
      idNegocio(event, ids);

      idCompanies(event, ids);
    } catch {
      console.log("No se encontró el contacto");
    }
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
    try {
      const ids = result.data[0].toObjectId;
      idEmpresa(event, ids);
      setCompanies(ids);
    } catch {
      console.log("No se encontró La Empresa");
    }
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
    let DealNS = [];
    setDeals(DealNS);
    let idL = result.data.map((deal) => DealNS.push(deal.toObjectId));

    DealNS.map(
      (deal) => (idDeals(event, deal), idLinea(event, parseInt(negoci)))
    );
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
    
    try {
      const response = await fetch(endpoint, options);
      let result = await response.json();
      let LineNS = [];
      let idP = result.data.map((Line) => LineNS.push(Line.toObjectId));
      setLine(LineNS);
      lines.map((line) => idProducts(event, line));
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
    setIsLoading(false);
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

    result.data ? productsA.push(result.data) : "NO HAY DATOS";
    //filter remove duplicates
    setProducts(productsA);
  };
  //dealInfo
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
    result.data ? negocios.push(result.data[0].properties) : "NO HAY DATOS";
    negocios = negocios.filter(
      (negocio) => negocio.dealstage === "decisionmakerboughtin"
    );
    negoci = negocios.length > 0 ? negocios[0].hs_object_id : "No hay linea";
    setDataValues(context);
  };

  const spinner = () => {
    setIsLoading(true);
  };

  return (
    <div className="mt-10">
      <form onSubmit={ejecutadora}>
        <label
          className="mt-2 mb-5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          htmlFor="email"
        >
          Email{" "}
        </label>
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
        <div>
          {isLoading == true ? <SpinnerButton texto="Cargando..." /> : null}
        </div>
        <button
          className="mt-3 mb-5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          type="submit"
        >
          Cargar datos al Formulario{" "}
        </button>
      </form>

      {/* {console.log("Context: ", context)} */}
    </div>
  );
}
