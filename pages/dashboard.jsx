import Head from "next/head";
import Image from "next/image";
import OrderTable from "../components/orderTable";
import { useSession } from "next-auth/react";
import Text from "../components/text";
import { useState, useEffect } from "react";
import { useSelectedUser } from '../context/SelectUserContext';

const Dashboard = () => {
  const { selectedUser, setSelectedUser, teamUsers, setTeamUsers } = useSelectedUser();
  const { data: session } = useSession();
  const [data, setData] = useState();
  const [companyName, setCompanyName] = useState("");
  const [user, setUser] = useState(session ? session.token.email : null);

  useEffect(() => {
    if (session) {
      const userEmail = selectedUser || session.token.email;
      userSender(userEmail);
    }
  }, [selectedUser, session, companyName]);

  const userSender = async (userEmail) => {
    try {
      let data = {
        name: session.token.name,
        email: userEmail,
        id: parseInt(session.token.sub),
        orderId: null,
        companyName: companyName,
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
      setData(resDB);
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
      <button className="bmt-2 mb-5 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
        onClick={userSender}>Ver Pedidos</button>
      <div className="relative">
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Buscar por Razón Social"
          className="mt-2 mb-5 px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {companyName && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3 dark:text-gray-300 font-bold  rounded-lg  hover:text-gray-900   border-gray-40 text-gray-900 hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
            text-center transition duration-500 ease-in-out drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]"
            onClick={() => setCompanyName("")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mb-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      <button className="bmt-2 mb-5 bg-gradient-to-r from-teal-600/40 to-teal-800/40 border-2 drop-shadow-[0_9px_9px_rgba(0,177,155,0.75)]  border-teal-800 hover:bg-teal-600/50 text-gray-800 dark:bg-gradient-to-r dark:from-teal-500/40 dark:to-teal-800/60 border-2 dark:drop-shadow-[0_9px_9px_rgba(0,255,222,0.25)]  dark:border-teal-200 dark:hover:bg-teal-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center"
        onClick={userSender}>Buscar</button>
      <OrderTable data={data} functionS={userSender} />
    </div>
  );
};

export default Dashboard;
