import { useState } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import OrderTable from "../components/orderTable";
import Puntos from "../utils/puntos";
import SapO2 from "../components/sapO2";
import Tarjetita from "../components/tarjetita";
import Text from "../components/text";
import Titere from "../components/titere";

interface Owner {
  id: number;
  name: string;
  email: string;
  imageUrl: string;
  token: {
    name: string;
    email: string;
    sub: string;
  };
}

//interface for Session


const Dashboard2 = () => {
  const { data: session } = useSession();
  const [data, setData] = useState<Owner[]>();

  const userSender = async () => {
    try {
      if (!session) {
        return;
      }
  
      const data = {
        name: session.token.name,
        email: session.token.email,
        id: parseInt(session.token.sub)
      };
      const JSONdata = JSON.stringify(data);
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSONdata
      };
      const response = await fetch("/api/mysqlConsulta", options);
      const result = await response.json();
      setData(result);
      console.log("base", result);
    } catch (error) {
      console.log("No hay datos DB", error);
    }
  };

  return (
    <div className="w-96 ml-8 lg:w-full flex min-h-screen flex-col items-center justify-center py-2">
        {/* <SapO2/> */}
        {/* <Puntos/> */}
        {/* <Titere/> */}
        {/* <Tarjetita imageUrl="https://images.unhttps://edgestatic-ehf9gbe6gfdfdec4.z01.azurefd.ne…hared-images/27c0ebe4a6b9466f940de28f0e9c100a.pngsplash.com/photo-1617888903275-6d1b6a5c6f7b?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80" buttonText="vamos" /> */}
      <Text
        title="Dashboard2"
        classe="dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
        mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
        border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]"
        description="En esta sección podrás ver las ordenes que se han creado y las que se han entregado."
      />
      <button className="bmt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
       onClick={userSender}>Ver Pedidos</button>
      <OrderTable data={data}/>
    </div>
  );
};

export default Dashboard2;