import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import SimpliRoute from "../components/simpliRoute";

const usePermissions = () => {
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState({});
  const [roles, setRoles] = useState([]);

  const checkPermissions = async (requiredPermissions: any[], requiredRoles: any[]) => {
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
    console.log("Los permisos y roles son: ", data);

    if (data && data.user && data.user[0]) {
      const userPermissions = data.user[0].permissions || [];
      const userRoles = data.user[0].rol || [];
      console.log("Los permisos y roles son: ", userPermissions, userRoles );

      const hasPermissions = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );
      console.log("Los permisos y roles son: ", hasPermissions);
      const hasRoles = requiredRoles.every(role =>
        userRoles.includes(role)
      );
      console.log("Los permisos y roles son: ", hasRoles);

      return hasPermissions && hasRoles;

      
    }
    return false;
  };

  const fetchPermissions = async (requiredPermissions: any[], requiredRoles: any[]) => {
    const hasAccess = await checkPermissions(requiredPermissions, requiredRoles);
    console.log("Has access: ", hasAccess);

    setPermissions(prevPermissions => ({
      ...prevPermissions,
      [requiredPermissions.join(",")]: hasAccess,
    }));

    setRoles(prevRoles => ({
      ...prevRoles,
      [requiredRoles.join(",")]: hasAccess,
    }));
  };

  useEffect(() => {
    if (session) {
      fetchPermissions(["ventas"], ["leader"]);
      // Add more fetchPermissions calls as needed for different permissions and roles combinations
    }
  }, [session]);
  console.log("gatos",permissions, roles)
  return { permissions, roles };
};


const Agenda = () => {
  const { data: session } = useSession()
  const { permissions, roles } = usePermissions();
  const [data, setData] = useState();
  const userSender = async (event) => {
    event.preventDefault();
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
      setData(resDB);

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
            Busca tu Pedido en el SAP Orders
          </h1>
          <p className="mt-10 bg-gray-100 text-sm  border border-gray-300 text-gray-600 text-xl text-center rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-400 dark:border-gray-200 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500 ">
            Identificate con tu cuenta para acceder a los Pedidos solicita un acceso con los permisos necesarios a tu administrador de Ventus Sales y HubSpot.
          </p>
        </div>

      </>
    );
  }

  return (
    <>
      
      <div className="w-96 ml-8 lg:w-full flex min-h-screen flex-col items-center justify-center py-2">
      {/* <h1 className="mt-24">Portal Logística</h1> */}
      <div className="flex flex-row gap-4 mt-24">
      </div>
        {permissions["ventas"] && roles["leader"] &&(<SimpliRoute />)}
      </div></>
  );
};

export default Agenda;