import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "../styles/styles.module.scss";
import RefreshButton from "../components/refreshButton";
import FinalInterface from "../components/forms/finalInterface";
import { useSession } from "next-auth/react";




const App = () => {
  const { data: session } = useSession();
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      // The user is not authenticated, handle it here.
    },
  });

  const router = useRouter();
  const [refresh, setRefresh] = useState(false);
  const [sessionInfo, setSessionInfo] = useState()
  const refreshPage = () => {
    setRefresh(true);
    router.reload();
  };


  //console.log("la session", session ? session.token.token.user.permissions : "No conectado")  session.token.token.user.permissions !== "hubspot"
  if (status === "loading") {
    return (
      <>
        <div className=" mt-48 mb-5">
          <h1 className="dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
      mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
      border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]">
            ENVÍA TU NEGOCIO A SAP
          </h1>
          <p className="mt-10 bg-gray-100 text-sm  border border-gray-300 text-gray-600 text-xl text-center rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-400 dark:border-gray-200 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500 ">
            Identificate con tu cuenta para acceder a los Negocios de HubSpot o solicita un acceso con los permisos necesarios a tu administrador de Ventus Sales y HubSpot.
          </p>
        </div>

      </>
    );
  }

  return (

    <div className={styles.container}>
      <Head>
        <title>Creador de Pedidos</title>
      </Head>
      {/* create a animation of bright gray line throwing the x axe */}
      <h1 className="w-96 sm:w-full text-6xl font-bold text-gray-900 dark:text-gray-300 mt-24 mb-24 dark:text-gray-300 font-bold py-4 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
      bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
      border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]">
        ENVÍA TU PEDIDO A SAP
      </h1>
      {/* dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)] */}
      <FinalInterface session={session} />

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


