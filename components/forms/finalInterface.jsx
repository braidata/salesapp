// //nextjs tailwind unform hubspot component

import { useState, useEffect, useRef } from "react";
import { useDataData } from "../../context/data";
import SpinnerButton from "../spinnerButton";
import CardDeal from "../forms/cardDeal";





let negocios = [];
let negoci;

export default function PageWithJSbasedForm2() {

    //console.log("hubspot api client", createClient({ apiKey: process.env.APP_KEY }))
  const tdRef = useRef(null);
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
      deale: deale,
      lines: lines,
      products: products,
    });
  }, [contacts, companies, billing, deals, deale, lines, products, id]);

//   const ejecutadora = async (event) => {
//     contactoAsociado(event)
//     //wait for 2 seconds
//     setTimeout(() => {
//       //your code to be executed after 2 seconds
//       contactoAsociado(event);
//     }, 5000)
    
//     setTimeout(() => {
//         //your code to be executed after 2 seconds
//         contactoAsociado(event);
//       }, 5000)
      
//       setTimeout(() => {
//         //your code to be executed after 2 seconds
//         contactoAsociado(event);
//       }, 5000);
//       setTimeout(() => {
//         //your code to be executed after 2 seconds
//         contactoAsociado(event);
//       }, 5000);
//       setTimeout(() => {
//         //your code to be executed after 2 seconds
//         contactoAsociado(event);
//       }, 5000);
//   };

//send context data to sql data base
    const sendData = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        try {
            const data = {
                contacts: contacts,
                companies: companies,
                billing: billing,
                deals: deals,
                deale: deale,
                lines: lines,
                products: products,
                id: id,
            };
            console.log(event.target.id, "el negocios es ", data);
            //console.log("tdRef", tdRef.current.innerHTML);
            let idD = tdRef.current.innerHTML
            //idDeals(event, idD)
            idLinea(event, parseInt(idD))

        } catch (error) {
            console.log(error);
            
        }
        setIsLoading(false);
    };

    //edit data of the context
    const editData = async (event) => {
        //event.preventDefault();
        setIsLoading(true);
        try {
            const data = {
                contacts: contacts,
                companies: companies,
                billing: billing,
                deals: deals,
                deale: deale,
                lines: lines,
                products: products,
                id: id,
            };

            const JSONdata = JSON.stringify(data);
            const endpoint = "/api/apihubspotdeals";
            const options = {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSONdata,
            };
            const response = await fetch(endpoint, options);
            let result = await response.json();
            setDataValues(result.data);
            setIsLoading(false);
        } catch (error) {
            console.log(error);
            setIsLoading(false);
        }
    };





  //indica el id del contacto
  const contactoAsociado = async (event) => {
    event.preventDefault();

    spinner();

    try {
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
      const ids = result.data[0].id;
      //idDeals(event, ids);
      idNegocio(event, ids)
      idCompanies(event, ids);
      setContacts(result.data);
    } catch {
        console.log("No se encontró el contacto");
      }
    

  };

  const idCompanies = async (event, id) => {
    event.preventDefault();
    
    try {
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
   
   try{
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
      (deal) => (idDeals(event, deal) )
    );}
    catch{
        console.log("No hay negocios asociados")
        }
  };

  //id line items hubspot
  const idLinea = async (event, id) => {
   
    
    try {
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
      let LineNS = [];
      let idP = result.data.map((Line) => LineNS.push(Line.toObjectId));
      setLine(LineNS);
      lines.map((line) => idProducts(event, line))
      console.log(context);
    } catch {
      console.log("No hay linea"), (<h1>No hay linea</h1>);
    }
  };
  //info de empresa
  const idEmpresa = async (event, id) => {
    try{
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
    console.log(context)}
    catch{
        console.log("No hay info de la empresa")
    }
  };

  const idProducts = async (event, id) => {
    try{
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
    console.log(context)}
    catch{
        console.log("No hay productos")
    }

  };
  //dealInfo
  const idDeals = async (event, id) => {
    try{
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
    setDeal(negocios)
    setDataValues(context);
    console.log("negocios", context)}
    catch{
         console.log("No hay negocios")
    }
  };

  const spinner = () => {
    setIsLoading(true);
  };

  return (
    <div className="mt-10">
      <form onSubmit={contactoAsociado}>
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
        {/* <button
          className="mt-3 mb-5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          type="submit"
        >
          Cargar datos al Formulario{" "}
        </button> */}
      </form>

      {/* {console.log("Context: ", context)} */}
        {/* {context ? (
            Object.entries(context.deals).map(
                (deal
                    ) => (
                    <div>
                        <h1>Deal: {deal}</h1>
                        
                    </div>
                )
            )) : null  } */}

{context.deale.length > 0 ? (
            context.deale.map( (deal
                ) => (
                    //grid  grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6
                    //deal transparent blurred tailwind small card
                    <div className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 m-5">
                        
                    <div className="text-left text-gray-800 dark:text-gray-100
                    bg-white bg-opacity-25 dark:bg-gray-800 dark:bg-opacity-25 backdrop-filter  rounded-lg shadow-lg p-6 transform transition duration-500 hover:scale-105
                    ">

                    <CardDeal name={deal.dealname} id={deal.hs_object_id} stage={deal.dealstage === "decisionmakerboughtin" ? "Pagado" : "por pagar"} amount={deal.amount}
                     editFunction={editData} sendFunction={sendData} refE={tdRef} /></div></div>
                )
            )) : null  }
    </div>
    
  );
}
