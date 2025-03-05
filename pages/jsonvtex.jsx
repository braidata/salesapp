import { useSession } from "next-auth/react";
import { useState } from "react";
import Puntos from "../utils/puntos";
import SapO2 from "../components/sapO2";
import SapO3 from "../components/sapO3";
import FedEx from "../components/fedEx";
import MeliTools from "../components/meli_tools";
import MeliTable from "../components/meli_table";
import SyncFramer from "../components/syncFramer";
import { useRouter } from "next/router";
import OrdersVentusComp from "../components/ordersVentusComp";
import JsonFinder from "../components/jsonFinderVtex";
import ConsultaStockComponent from "../components/ConsultaStockSAPTable";

const Testeo = () => {
  const { data: session } = useSession()
  const [data, setData] = useState();
  const userSender = async (event) => {
    //event.preventDefault();
    try {
      let data = {
        name: session.token.name,//contexts.owners.success[1] ,
        email: session.token.email,//contexts.owners.success[0],
        id: parseInt(session.token.sub)
      };
      const JSONdata = JSON.stringify(data);
      const endpoint = "/api/mysqlConsulta";
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSONdata,
      };
      const response = await fetch(endpoint, options);
      const result = response;
      const resDB = await result.json();
      data = setData(resDB);

      console.log("base", resDB);
    } catch {
      console.log("No hay datos DB");
    }
  };

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
            Busca tu JSON
          </h1>
          <p className="mt-10 bg-gray-100 text-sm  border border-gray-300 text-gray-600 text-xl text-center rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-400 dark:border-gray-200 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500 ">
            Identificate con tu cuenta para acceder a los Pedidos solicita un acceso con los permisos necesarios a tu administrador de Ventus Sales y HubSpot.
          </p>
        </div>

      </>
    );
  }

  return (
    <div className="w-96 ml-8 lg:w-full flex min-h-screen flex-col items-center justify-center py-4">
      <h1 className="dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
      mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
      border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]">
        Busca tu JSON
      </h1>

      <JsonFinder />
    </div>
  );
};

export default Testeo;