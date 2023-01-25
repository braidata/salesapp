// //nextjs tailwind unform hubspot component

import { useState, useEffect, useRef, createRef } from "react";
import dynamic from "next/dynamic";
import { useDataData } from "../../context/data";
import SpinnerButton from "../spinnerButton";
import CardDeal from "../forms/cardDeal";
import SuccessMessage from "../forms/succesMessage";
import { useSession } from "next-auth/react";
import SessionInfo from "../forms/sessionInfo";

let negocios = [];
let negoci;

export default function PageWithJSbasedForm3({session}) {
  //   const CardDeal = dynamic(() => import("../forms/cardDeal"), {
  //         ssr: false,
  //         //loading: () => <p>Loading...</p>
  //       });
  //console.log("hubspot api client", createClient({ apiKey: process.env.APP_KEY }))
  const tdRef = useRef(null);
  //const tdRef = createRef([]);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [billing, setBilling] = useState([]);
  const [deals, setDeals] = useState([]);
  const [deale, setDeal] = useState([]);
  const [lines, setLine] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsA, setProductsA] = useState([]);
  const [id, setId] = useState([]);
  const [owner, setOwner] = useState([]);
  const [owners, setOwners] = useState([]);
  const { setDataValues } = useDataData();
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  //const { data: session } = useSession();
  const [user, setUser] = useState(session ? session.token.email : null);
  const [team, setTeam] = useState(session ? session.token.sub : null);

//   console.log(data, status, data.user.email);

  //crete context for objects
  const [context, setContext] = useState({
    contacts: contacts,
    companies: companies,
    billing: billing,
    deals: deals,
    //deale without duplicates

    deale: deale,

    lines: lines,
    products: new Set(products),
    user: user,
    team: team,
    owner: owner,
    owners: owners,
    id: id,
  });

  //set context for objects
  useEffect(() => {
    setContext({
      contacts: contacts,
      companies: companies,
      billing: billing,
      deals: deals,
      deale: deale.filter(
        (thing, index, self) =>
          index === self.findIndex((t) => t.id === thing.id)
      ),
      lines: lines,
      products: products,
      user: user,
      team: team,
      owner: owner,
      owners: owners,
      id: id,
    });
  }, [contacts, companies, billing, deals, deale, lines, products, id]);

  const liniera = (event, idD) => {
    event.preventDefault();
    idDeals(event, idD);
    //setId(idD);
    idLinea(event, idD);
    lines.map((line) => idProducts(event, line));
    // lines ? lines.map((line) => idProducts(event, line)) : null;
    //owner ? setOwners(owner) : null;
    setIsDisabled(true);
  };

  const sendData = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    const prob = await event.target.children[0].htmlFor;
    // console.log("tdRef:", prob);
    const idD = prob;

    liniera(event, idD);

    console.log("el negocios es ", context);

    await stateChanger(event, parseInt(idD));
    //setIsDisabled(true);

    setIsLoading(false);
  };

  //edit data of the context
  const editData = async (event) => {};

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
      idNegocio(event, ids);
      idCompanies(event, ids);
      setContacts(result.data);
    } catch {
      console.log("No se encontró el contacto");
    }
  };

  const idCompanies = async (event, id) => {
    //event.preventDefault();

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
      setIsLoading(false);
    }
  };

  //ejecutadora de funciones
  const ejecutadora0 = async (event) => {
    contactoAsociado(event);

    // //wait for 2 seconds
    // setTimeout(() => {
    //   //your code to be executed after 2 seconds
    //   contactoAsociado(event);

    // }, 5000);
  };

  const ejecutadora = async (event) => {
    sendData(event);

    // //wait for 2 seconds
    // setTimeout(() => {
    //   //your code to be executed after 2 seconds
    //   sendData(event);
    // }, 1000);

    setTimeout(() => {
      //your code to be executed after 2 seconds
      sendData(event);
    }, 5000);

    setTimeout(() => {
      //your code to be executed after 2 seconds
      sendData(event);
    }, 5000);
  };

  //indica los números de negocios asociados al contacto
  const idNegocio = async (event, id) => {
    event.preventDefault();

    try {
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

      DealNS.map((deal) => idDeals(event, deal));
    } catch {
      console.log("No hay negocios asociados");
    }
  };

  //id line items hubspot
  const idLinea = async (event, id) => {
    //event.preventDefault();

    const data = {
      id: id,
    };
    try {
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
      //   lines.map((line) => idProducts(event, line))
      //console.log(context);
    } catch {
      console.log("No hay linea"), (<h1>No hay linea</h1>);
    }
  };
  //info de empresa
  const idEmpresa = async (event, id) => {
    //event.preventDefault();

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
    try {
      const response = await fetch(endpoint, options);
      let result = await response.json();
      setBilling(result.data);
      setIsLoading(false);
      //console.log(context)
    } catch {
      console.log("No hay info de la empresa");
    }
  };

  const idProducts = async (event, id) => {
    //event.preventDefault();
    try {
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
      const unique = [...new Set(Object.values(productsA))];
      setProducts(unique);
      //console.log(context)
    } catch {
      console.log("No hay productos");
    }
  };
  //dealInfo
  const idDeals = async (event, id) => {
    event.preventDefault();
    try {
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
      negocios = negocios.filter((negocio) => negocio.dealstage === "50940199");

      negoci = negocios.length > 0 ? negocios[0].hs_object_id : "No hay linea";
      console.log("ID OWNER DEAL ", negocios[0].hubspot_owner_id);
      setOwner(negocios[0].hubspot_owner_id);
      owner ? idOwners(event, owner) : "No hay owner";
      setDeal(negocios);
      //setDataValues(context);
      //console.log("negocios", context)
    } catch {
      console.log("No hay negocios");
    }
  };

//ownerInfo
const idOwners = async (event, id) => {
    event.preventDefault();
    try {
      const data = {
        id: id,
      };
      const JSONdata = JSON.stringify(data);
      const endpoint = "/api/getHubspotOwners";
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSONdata,
      };
      const response = await fetch(endpoint, options);
      const result =  response
      const resO = await result.json()
      console.log("dueños", resO
      );
      
      setOwners(resO
        );
 
    } catch {
      console.log("No hay dueños");
    }
  };







  //dealInfo
  const stateChanger = async (event, id) => {
    event.preventDefault();
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

  const stateSetter = (s) => {
    setIsDisabled(s);
    return isDisabled;
  };

  const spinner = () => {
    setIsLoading(true);
  };

  return (
    <div className="mt-10">
      {/* <SessionInfo /> */}
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
          className="mt-2 mb-5 bg-blue-900/90 border border-gray-300 text-gray-900 text-sm rounded-lg hover:bg-blue-800/90 focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-blue-600/20 dark:hover:bg-blue-400/20 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          type="submit"
        >
          Buscar datos en HubSpot{" "}
        </button>

        <div>
          {isLoading == true ? <SpinnerButton texto="Cargando..." /> : null}
        </div>

        {!context.billing ? (
          <div>
            <h4 className="bg-white bg-opacity-25 dark:bg-gray-800 dark:bg-opacity-25 backdrop-filter  rounded-lg shadow-lg p-6 text-center text-gray-800 dark:text-gray-100">
              Debes completar los datos de Empresa en HubSpot para continuar.
            </h4>
            <button
              className="mt-2 mb-5 bg-orange-800/90 border border-gray-300 text-gray-900 text-sm rounded-lg hover:bg-orange-700/90 focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-orange-600/20 dark:hover:bg-orange-400/20 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              type="submit"
            >
              Cargar Datos{" "}
            </button>
          </div>
        ) : null}
      </form>

      {/* {context.companies.length < 1 ? (
        <h4 className="bg-white bg-opacity-25 dark:bg-gray-800 dark:bg-opacity-25 backdrop-filter  rounded-lg shadow-lg p-6 text-center text-gray-800 dark:text-gray-100">
          Debes completar los datos de Empresa en HubSpot para continuar
        </h4>
      ) : null} */}

      {/* {context.companies.length < 1 ? stateSetter(false) : "hola" } */}

      {context.deale.length > 0 ? (
        context.deale.map((deal, index) => (
          //grid  grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6
          //deal transparent blurred tailwind small card
          <div
            key={index}
            className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 m-5"
          >
            <div
              key={index}
              className="w-full rounded-lg text-left text-gray-800 dark:text-gray-100
                    bg-white bg-opacity-25 dark:bg-gray-800 dark:bg-opacity-25 backdrop-filter  rounded-lg shadow-lg p-6 transform transition duration-500 hover:scale-105
                    "
            >
              <CardDeal
                name={deal.dealname}
                id={deal.hs_object_id}
                stage={deal.dealstage === "50940199" ? "Pagado" : "por pagar"}
                amount={deal.amount}
                editFunction={editData}
                sendFunction={sendData}
                refE={tdRef}
                index={index}
                comp={<SuccessMessage />}
                context={context}
                // status={isDisabled}
              />
            </div>
          </div>
        ))
      ) : (
        <h4 className="bg-white bg-opacity-25 dark:bg-gray-800 dark:bg-opacity-25 backdrop-filter  rounded-lg shadow-lg p-6 text-center text-gray-800 dark:text-gray-100">
          No hay negocios, recuerda cambiar el estado a Pagado
        </h4>
      )}
    </div>
  );
}
