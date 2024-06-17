import Head from "next/head";
import Image from "next/image";
import PaymentsTable from "../components/paymentsTable";
import { useSession } from "next-auth/react";
import Text from "../components/text";
import { useState, useEffect, SetStateAction } from "react";
import { useSelectedUser } from '../context/SelectUserContext';

const Pagos = () => {
  const { selectedUser, setSelectedUser, teamUsers, setTeamUsers } = useSelectedUser();
  const { data: session, status } = useSession();
  const [data, setData] = useState(null);
  const [dataP, setDataP] = useState([]);
  const [orderId, setOrderId] = useState("");
  const [user, setUser] = useState(session ? session.token.email : null);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [sessionInfo, setSessionInfo] = useState(null);

  const handlePaymentStatusChange = (status: SetStateAction<string>) => {
    setPaymentStatus(status);
  };

  useEffect(() => {
    if (session) {
      const userEmail = selectedUser || session.token.email;
      userSender(userEmail);
      fetchPermisos();
    }
  }, [selectedUser, session, orderId]);

  const userSender = async (userEmail: any) => {
    try {
      let data = {
        name: session?.token.name,
        email: userEmail,
        id: parseInt(session?.token.sub),
        orderId: orderId,
        status: paymentStatus,
      };
  
      const JSONdata = JSON.stringify(data);
      const endpoint = "/api/mysqlPayments";
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
      
    } catch (error) {
      console.log("No hay datos DB", error);
    }
  };

  const paymentFetcher = async (status, orderId) => {
    try {
      const response = await fetch('/api/mysqlPayments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, orderId }),
      });
      const data = await response.json();
      setDataP(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al obtener los pagos:', error);
    }
  };

  const fetchPermisos = async () => {
    try {
      const res = await fetch("/api/mysqlPerm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session ? session?.token.email : null,
        }),
      });
      const data = await res.json();
      const userRol = data ? data.user[0].permissions : "No conectado";
      setSessionInfo(userRol);
    } catch (error) {
      console.error('Error al obtener los permisos:', error);
    }
  };

  useEffect(() => {
    if (session) {
      const userEmail = selectedUser || session.token.email;
      userSender(userEmail);
    }
  }, [selectedUser, session, orderId, paymentStatus]);

  if (status === "loading") {
    return <div>Cargando...</div>;
  }

  if (status === "unauthenticated") {
    return <div className="w-96 ml-8 lg:w-full flex min-h-screen flex-col items-center justify-center py-2">
    <Text
      title="Pagos"
      classe="dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
      mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
      border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]"
      description="No tienes acceso a esta sección. Solicita acceso al administrador. "
    />
    
  </div>;
  }

  if (sessionInfo !== 'all' && sessionInfo !== 'payments') {
    return <div className="w-96 ml-8 lg:w-full flex min-h-screen flex-col items-center justify-center py-2">
    <Text
      title="Pagos"
      classe="dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
      mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
      border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]"
      description="No tienes permisos para ver esta sección."
    />
    
  </div>;
  }

  return (
    <div className="w-96 ml-8 lg:w-full flex min-h-screen flex-col items-center justify-center py-2">
      <Text
        title="Pagos"
        classe="dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
        mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
        border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]"
        description="En esta sección podrás ver los pagos que se han creado y validarlos."
      />
      <PaymentsTable data={data} dataP={dataP} functionS={userSender} functionsSP={paymentFetcher} />
    </div>
  );
};

export default Pagos;
