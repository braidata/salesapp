import Head from "next/head";
import Image from "next/image";
import OrderTable from "../components/orderTable";
import { useSession } from "next-auth/react";
import Text from "../components/text";
import { useState } from "react";

const Dashboard = () => {
  const {data: session} = useSession()
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


  return (
    <div className="w-96 ml-8 lg:w-full flex min-h-screen flex-col items-center justify-center py-2">
      <Text
        title="Dashboard"
        classe="dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
        mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
        border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]"
        description="En esta sección podrás ver las ordenes que se han creado y las que se han entregado."
      />
      <button className="bmt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full"
       onClick={userSender}>Ver Pedidos</button>
      <OrderTable data={data}/>
    </div>
  );
};

export default Dashboard;
