import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "../styles/styles.module.scss";
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
import { useSession } from "next-auth/react";
import SpinnerButton from "../components/spinnerButton";
//import CardClosable from "../components/cardClosable";



const App = () => {
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
  const refreshPage = () => {
    setRefresh(true);
    router.reload();
  };

  if (status === "loading") {
    return (
      <div>
        <h1 className="mt-24 bg-gray-100   border border-gray-300 text-gray-600 text-xl text-center rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-400 dark:border-gray-200 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500 ">
          ENVÍA TU NEGOCIO A SAP
        </h1>
        <p className="mt-10 bg-gray-100 text-sm  border border-gray-300 text-gray-600 text-xl text-center rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-400 dark:border-gray-200 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500 ">
          Identificate con tu cuenta de Hubspot para acceder al Creador de
          Pedidos
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Creador de Pedidos</title>
      </Head>
      <h1 className="mt-10 bg-gray-100   border border-gray-300 text-gray-600 text-xl text-center rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-400 dark:border-gray-200 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500 ">
      ENVÍA TU NEGOCIO A SAP
      </h1>
      <FinalInterface />
    
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