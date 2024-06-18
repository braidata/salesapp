import Head from "next/head";

import OrderTable from "../components/orderTable";
import { useSession } from "next-auth/react";
import Text from "../components/text";
import { useState, useEffect } from "react";
import { useSelectedUser } from '../context/SelectUserContext';
import { useRouter } from 'next/router';

const Dashboard = () => {
  const { selectedUser, setSelectedUser, teamUsers, setTeamUsers } = useSelectedUser();
  const { data: session } = useSession();
  const [data, setData] = useState();
  const [filteredData, setFilteredData] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [user, setUser] = useState(session ? session.token.email : null);
  const router = useRouter();

  useEffect(() => {
    if (session) {
      const userEmail = selectedUser || session.token.email;
      userSender(userEmail);
    }
  }, [selectedUser, session, companyName]);

  useEffect(() => {
    const { orderId } = router.query;
    if (orderId && data) {
      const filtered = data.orders.filter(order => order.id.toString() === orderId);
      setFilteredData({ orders: filtered });
    } else {
      setFilteredData(data);
    }
  }, [router.query, data]);

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

    } catch {
      console.log("No hay datos DB");
    }
  };

  return (
    <div className="w-full lg:w-full flex flex-col items-center justify-center py-2">
      <Text
        title="Dashboard"
        classe="dark:text-gray-300 font-bold py-2 px-2 w-full rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
        mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
        border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]"
        description="Módulo de Pedidos, Pagos e Información SAP."
      />


      <OrderTable data={filteredData} functionS={userSender} />
    </div>
  );
};

export default Dashboard;
