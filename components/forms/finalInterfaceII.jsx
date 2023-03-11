import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useDataData } from "../../context/data";
import SpinnerButton from "../spinnerButton";
import CardDeal from "../forms/cardDeal";
import SuccessMessage from "../forms/succesMessage";
import { useSession } from "next-auth/react";
import SessionInfo from "../forms/sessionInfo";
import axios from "axios";

export default function PageWithJSbasedForm3({ session }) {
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [billing, setBilling] = useState([]);
  const [deals, setDeals] = useState([]);
  const [deale, setDeal] = useState([]);
  const [lines, setLine] = useState([]);
  const [products, setProducts] = useState(new Set());
  const [id, setId] = useState([]);
  const [owner, setOwner] = useState([]);
  const [owners, setOwners] = useState([]);
  const { setDataValues } = useDataData();
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const tdRef = useRef(null);
  const [user, setUser] = useState(session ? session.token.email : null);
  const [team, setTeam] = useState(session ? session.token.sub : null);

  // Crear contexto para objetos
  const context = {
    contacts,
    companies,
    billing,
    deals,
    deale: deale.filter(
      (thing, index, self) => index === self.findIndex((t) => t.id === thing.id)
    ),
    lines,
    products: Array.from(products),
    user,
    team,
    owner,
    owners,
    id,
  };

  // Setear datos del contexto
  // useEffect(() => {
  //   setDataValues(context);
  // }, [context]);

  // Manejar cambio en el email
  const handleEmailChange = async (event) => {
    event.preventDefault();
    const email = event.target.email.value;

    //spinner();

    try {
      // Obtener ID del primer negocio asociado al email
      const dealResponse = await axios.post("/api/apihubspotdeals", { email });
      const dealId = dealResponse.data.data[0].id;
      console.log("vamos",dealResponse);
      //obtener id de negocio
      const dealResponses = await axios.post("/api/apiHubspot", { id: dealId });
      const dealIds = dealResponses.data.data;
      console.log("vamos",dealIds);
      // Obtener información del negocio}
      //mapea dealIds para entregar cada id como argumento
      dealIds.map(async (dealId) => {
        
        console.log("vamos",dealId.toObjectId);
        const dealResponseData = await axios.post("/api/extractDeal", { id: dealId.toObjectId });
        const dealData = dealResponseData.data.data[0].properties;})

      //const dealResponseData = await axios.post("/api/extractDeal", { id: dealIds });
      // console.log("vamos",dealResponseData);
      // const dealData = dealResponseData.data.data[0].properties;

      // Obtener ID de la empresa asociada al negocio
      //const companyId = dealData.associatedcompanyid.value;

      // Obtener información de la empresa
      const companyResponse = await axios.post("/api/apiBillingIDS", { id: dealId });
      const companyData = companyResponse.data.data[0].toObjectId;
      console.log("vamos",companyData);

      // Obtener información de los productos asociados al negocio
      const lineResponse = await axios.post("/api/apihubspotline", { id: dealData });
      const lineData = lineResponse.data.data;
      console.log("vamos",lineData);

      const productsData = await Promise.all(
        lineData.map(async (line) => {
          const response = await axios.post("/api/apihubspotproduct1", { id: line.toObjectId });
          console.log("vamos",response);
          return response.data.data;
        })
      );

      // Obtener información del dueño del negocio
      const ownerDataResponse = await axios.post("/api/getHubspotOwners", { id: dealData.hubspot_owner_id });
      const ownerData = ownerDataResponse.data;

      // Setear los estados
      setDeals(dealData);
      setCompanies(companyData);
      setLine(lineData);
      setProducts(productsData);
      setOwner(ownerData);
      setId(dealId);
      setIsLoading(false);
      setDataValues(context);
    } catch (error) {
      console.log(error);
    }
  };



  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold">Formulario de negocios</h1>
        <div className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
          <form onSubmit={handleEmailChange}>
            <label htmlFor="email">Email</label>
            <input type="email" name="email" id="email" />
            <button type="submit">Buscar
            </button>
          </form>
          {/* <form onSubmit={handleIdChange}>
            <label htmlFor="id">ID</label>
            <input type="text" name="id" id="id" />
            <button type="submit">Buscar
            <SpinnerButton

              isLoading={isLoading}
              isDisabled={isDisabled}
              text="Buscar"
            /></button>
          </form> */}
        </div>
      </div>
    </div>
  );
};