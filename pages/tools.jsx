import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "../styles/styles.module.scss";
import LlamadorPagos from "../lib/llamadorPagos";
import CreadorPagos from "../lib/creadorPagos";
import FormCard from "../components/FormCard";
import {
  BillingInfo,
  BillingInfo2,
  ConfirmPurchase,
  PersonalInfo,
  ProductsInfo,
  ShippingInfo,
  PaymentsInfo,
} from "../components/forms";
import FormCompleted from "../components/FormCompleted";
import RefreshButton from "../components/refreshButton";
import FinalInterface from "../components/forms/finalInterface";
import { useSession, getSession } from "next-auth/react";
import SpinnerButton from "../components/spinnerButton";
import requireAuthentication from "../utils/requireAuthentication";
//import CardClosable from "../components/cardClosable";



const App = () => {
  const { data: session } = useSession();
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      // The user is not authenticated, handle it here.
    },
  });

  // const FinalInterface = dynamic(() => import("../components/forms/finalInterface"), {
  //   loading: () => <SpinnerButton texto="Cargando..." />
  // }); 
  const router = useRouter();
  const [refresh, setRefresh] = useState(false);
  const [sessionInfo, setSessionInfo] = useState()
  const refreshPage = () => {
    setRefresh(true);
    router.reload();
  };
  const permis = ["hubspot", "admin", "all"];
  //const permisoDato = session ? session.user.permissions : "No conectado";
  //const permiso = permis.some((el) => permisoDato.includes(el));
  console.log("el permiso: ", permis, session);


  //console.log("la session", session ? session.token.token.user.permissions : "No conectado")  session.token.token.user.permissions !== "hubspot"
  if (status === "loading") {
    return (
      <>
      <div className=" mt-48 mb-5">
        <h1 className="dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
      mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
      border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]">
          INGRESA EL PAGO DE TU PEDIDO
        </h1>
        <p className="mt-10 bg-gray-100 text-sm  border border-gray-300 text-gray-600 text-xl text-center rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-400 dark:border-gray-200 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500 ">
          Identificate con tu cuenta para acceder aL Formulario de Generación de Pagos o solicita un acceso con los permisos necesarios a tu administrador de Ventus Sales y HubSpot.
        </p>
      </div>

      </>
    );
  }

  return (
    
    <div className={styles.container}>
      <Head>
        <title>Creador de Pagos</title>
      </Head>
      {/* create a animation of bright gray line throwing the x axe */}
      <h1 className="w-96 sm:w-full text-6xl font-bold text-gray-900 dark:text-gray-300 mt-24 mb-24 dark:text-gray-300 font-bold py-4 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
      bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
      border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]">
        INGRESA EL PAGO DE TU PEDIDO
      </h1>
      {/* dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)] */}
      <LlamadorPagos session={session} />

        <CreadorPagos />


      {/* <AtomCounter /> */}
      <RefreshButton functions={refreshPage} />


      <div className="mt-10">
        {/* <BuscaHubspotD functions={refreshPage} /> */}
      </div>

      {/* <CardClosable children={<BuscaHubspotD functions={refreshPage} />} title="Buscador de Negocios" name="Busca por mail" description="Encuentra los datos de contacto, negocio y productos" /> */}
    </div>
  );
};

export default App;