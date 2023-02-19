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
  const [creadorPagosVisible, setCreadorPagosVisible] = useState(false);
  const [llamadorPagosVisible, setLlamadorPagosVisible] = useState(false);
  const router = useRouter();
  const [refresh, setRefresh] = useState(false);
  const [sessionInfo, setSessionInfo] = useState()
  const refreshPage = () => {
    setRefresh(true);
    router.reload();
  };
  //fetch user data from prisma and mysqlPerm API
  const  permisos = async () => {
    const res = await fetch("/api/mysqlPerm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session ? session.session.user.email : null,
      }),
    });
    const data = await res.json();
    console.log("el permiso: ", data);
    setSessionInfo(data)
  };
  //funcion que llama a mysqlPerm y devuelve un array con los permisos y roles del usuario vía prisma
 
  //const permisoDato = session ? session.user.permissions : "No conectado";
  //const permiso = permis.some((el) => permisoDato.includes(el));
  console.log("el permiso: ", session ? session.session.user.email : "No conectado");


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

  const showCreadorPagos = async () => {
    const res = await fetch("/api/mysqlPerm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session ? session.session.user.email : null,
      }),
    });
    const data = await res.json();
    console.log("el permisos: ", data.user[0].rol);
    const userRol = data ? data.user[0].rol : "No conectado";
    
    if (userRol.includes("tester") || userRol.includes("user") || userRol.includes("superadmin") || userRol.includes("admin")) {
      setCreadorPagosVisible(true);
    } else {
      alert(
        "No tienes permisos para acceder a esta herramienta. Contacta a tu administrador de Ventus Sales y HubSpot para que te otorgue los permisos necesarios."
      );
    }
  };

  //crea una función como showCreadorPagos pero para remplazar a toggleLlamadorPagos
  const showLlamadorPagos = async () => {
    const res = await fetch("/api/mysqlPerm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session ? session.session.user.email : null,
      }),
    });
    const data = await res.json();
    console.log("el permisos: ", data.user[0].rol);
    const userRol = data ? data.user[0].rol : "No conectado";

    if (userRol.includes("tester") || userRol.includes("validator")) {
      setLlamadorPagosVisible(true);
    } else {
      alert(
        "No tienes permisos para acceder a esta herramienta. Contacta a tu administrador de Ventus Sales y HubSpot para que te otorgue los permisos necesarios."
      );
    }
  };



  const toggleCreadorPagos = () => {
    //run permisos and evaluate if the user has the validator 
    permisos()
    
    //usa los valores que trae persmisos para evaluar si el usuario tiene permisos para acceder a la herramienta
    //si tiene permisos, se muestra el formulario, si no, se muestra un mensaje de error
    if (sessionInfo && sessionInfo[0].permissions.includes("all")) {
    setCreadorPagosVisible(!creadorPagosVisible);
    } else {
      alert("No tienes permisos para acceder a esta herramienta. Contacta a tu administrador de Ventus Sales y HubSpot para que te otorgue los permisos necesarios.")
    }

  };

  const toggleLlamadorPagos = () => {
    
    setLlamadorPagosVisible(!llamadorPagosVisible);
  };

  return (

    <>

    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <button className="mt-24 w-96 text-2xl text-center mb-5 text-gray-800 bg-gradient-to-r from-indigo-600/40 to-indigo-800/40 border-2 drop-shadow-[0_5px_5px_rgba(177,155,0,0.75)]  border-indigo-800 hover:bg-indigo-600/50  dark:bg-gradient-to-r dark:from-indigo-500/40 dark:to-indigo-800/60 border-4 dark:drop-shadow-[0_9px_9px_rgba(255,255,0,0.25)]  dark:border-sky-200 dark:border-opacity-50 dark:hover:bg-sky-600/50 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-0 hover:skew-y-0 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-0 focus:-skew-y-0 focus:scale-105 transition duration-500 origin-center" onClick={showCreadorPagos}>
          {creadorPagosVisible ? "Ocultar Creador" : "Crear Pago"}
        </button>
        <button className="mt-24 w-96 text-2xl text-center mb-5 text-gray-800 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50  dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-4 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:border-opacity-50 dark:hover:bg-sky-600/50 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-0 hover:skew-y-0 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-0 focus:-skew-y-0 focus:scale-105 transition duration-500 origin-center" onClick={showLlamadorPagos}>
          {llamadorPagosVisible ? "Ocultar Validador" : "Validador de Pagos"}
        </button>
      </div>
    
    <div className={styles.container}>
      <Head>
        <title>Creador de Pagos</title>
      </Head>
      {/* create a animation of bright gray line throwing the x axe */}

      {creadorPagosVisible && <CreadorPagos />}
      {llamadorPagosVisible && <LlamadorPagos session={session} />}
      {console.log("LA GRAN SESSION", session)}

        


      {/* <AtomCounter /> */}
      <RefreshButton functions={refreshPage} />


      <div className="mt-10">
        {/* <BuscaHubspotD functions={refreshPage} /> */}
      </div>

      {/* <CardClosable children={<BuscaHubspotD functions={refreshPage} />} title="Buscador de Negocios" name="Busca por mail" description="Encuentra los datos de contacto, negocio y productos" /> */}
    </div>
    </>
  );
};

export default App;