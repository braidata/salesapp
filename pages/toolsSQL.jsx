import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "../styles/styles.module.scss";
import RefreshButton from "../components/refreshButton";
import { useSession } from "next-auth/react";
import BuscaOrdSQL from "../components/buscaOrdSQL";
import BuscaProdSQL from "../components/buscaProdSQL";



const App = () => {
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      // The user is not authenticated, handle it here.
    },
  });
 
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
          CREA TU VENTA
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
        <title>Consultas SQL</title>
      </Head>
      <h1 className="mt-10 bg-gray-100   border border-gray-300 text-gray-600 text-xl text-center rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-400 dark:border-gray-200 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500 ">
        CONSULTAS SQL
      </h1>
      <h2 className=" mt-10 bg-gray-100   border border-gray-300 text-gray-600 text-xl text-center rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-400 dark:border-gray-200 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500">Consulta de Stock</h2>
      {/* <BuscaOrdSQL /> */}
      <BuscaProdSQL />
      
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