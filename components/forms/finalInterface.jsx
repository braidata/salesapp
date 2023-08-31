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
    products: products,
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
  }, [contacts, companies, billing, deals, deale, lines, products]);

  const liniera = async (idD) => {
    
    //idDeals(event, idD);
    idCompanies(idD);
    //setId(idD);
    idLinea(idD);

    // Divide el array 'lines' en chunks de 3
    const chunkedLines = [];
    for (let i = 0; i < lines.length; i += 3) {
        chunkedLines.push(lines.slice(i, i + 3));
    }

    // Por cada chunk, llama a idProducts y espera 15 segundos
    for (const chunk of chunkedLines) {
        setIsLoading(true);

        for (let line of chunk) {
             idProducts(line);
        }

        setIsLoading(false);

        // Si no es el último chunk, espera 15 segundos antes de continuar
        if (chunk !== chunkedLines[chunkedLines.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};


  const sendData = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    const idD = await event.target.children[0].htmlFor;
    console.log("tdRef:", idD);
    liniera(idD);
    console.log("el negocios es ", context);

    // await stateChanger(event, parseInt(idD));
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
      idNegocio(ids);
      setContacts(result.data);
      setIsLoading(false);
    } catch {
      console.log("No se encontró el contacto");
    }
  };

  const idCompanies = async (id) => {
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
      idEmpresa(ids);
      setCompanies(ids);
    } catch {
      console.log("No se encontró La Empresa");
      setIsLoading(false);
    }
  };

  //indica los números de negocios asociados al contacto
  const idNegocio = async (id) => {
    

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

      DealNS.map((deal) => idDeals(deal));
    } catch {
      console.log("No hay negocios asociados");
    }
  };

  //id line items hubspot
  const idLinea = async (id) => {
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
      //   lines.map((line) => idProducts(line))
      //console.log(context);
    } catch {
      console.log("No hay linea"), (<h1>No hay linea</h1>);
    }
  };
  //info de empresa
  const idEmpresa = async (id) => {
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

  const idProducts = async (id) => {
    //event.preventDefault();
    console.log("id", id);
    const data = {
      id: id,
    };
    console.log("data", data);
    const JSONdata = JSON.stringify(data);
    console.log("JSONdata", JSONdata);
    

      const endpoint = "/api/apihubspotproduct1";
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSONdata,
      };
   
      console.log("options", options);
      try {
      const response = await fetch(endpoint, options);
      console.log("response", response);
      let result = await response.json();
      //console log de todo: 
      console.log("result", result.data);
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
  const idDeals = async (id) => {
    
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
      owner ? idOwners(owner) : "No hay owner";
      setDeal(negocios);
      //setDataValues(context);
      //console.log("negocios", context)
    } catch {
      console.log("No hay negocios");
    }
  };

//ownerInfo
const idOwners = async (id) => {
    
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


  const spinner = () => {
    setIsLoading(true);
  };

  return (
    <div className="mt-10 w-96 sm:w-full">
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
          className="mt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-400/50 dark:to-sky-600/50 border-2 dark:drop-shadow-[0_5px_5px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-0 hover:skew-x-0 hover:skew-y-0 hover:scale-105 focus:-rotate-0 focus:-skew-x-0 focus:-skew-y-0 focus:scale-90 transition duration-500 origin-center"
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
              className="mt-2 mb-5 bg-gradient-to-r from-orange-600/40 to-orange-800/40 border-2 drop-shadow-[0_10px_10px_rgba(177,155,0,0.75)]  border-orange-800 hover:bg-orange-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-orange-400/50 dark:to-orange-600/50 border-2 dark:drop-shadow-[0_10px_10px_rgba(255,200,0,0.25)]  dark:border-orange-200 dark:hover:bg-orange-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-0 hover:skew-x-0 hover:skew-y-0 hover:scale-105 focus:-rotate-0 focus:-skew-x-0 focus:-skew-y-0 focus:scale-90 transition duration-500 origin-center"
              type="submit"
            >
              Cargar Datos{" "}
            </button>
          </div>
        ) : null}
      </form>

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
                stage={deal.dealstage === "50940199" ? "Pagado Enviar a SAP" : "por pagar"}
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




