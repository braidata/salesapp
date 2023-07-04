//nextjs tailwind landing page component
import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Text from "../components/text";
import GridCards from "../components/gridCards";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react"

const Landing = () => {
  const router = useRouter();
  const { data: session, status } = useSession()
  const [showLogistica, setShowLogistica] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPermissions = async (requiredRoles) => {
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
    console.log("Los permisos son: ", data);

    if (data && data.user && data.user[0] && data.user[0].rol) {
      const userRol = data.user[0].rol.toLowerCase();
      if (requiredRoles.some(role => userRol.includes(role))) {
        return true;
      }
    }
    return false;
  };

  // const fetchPermissions = async () => {
  //   const hasPermissions = await checkPermissions(["logistics", "tester"]);
  //   console.log("Has permissions: ", hasPermissions)
  //   setShowLogistica(hasPermissions);
  //   setLoading(false);
  // };

  //fetchPermissions();
  useEffect(() => {
    const fetchPermissions = async () => {
      const hasPermissions = await checkPermissions(["logistics", "tester"]);
      console.log("Has permissions: ", hasPermissions)
      setShowLogistica(hasPermissions);
      setLoading(false);
    };

    fetchPermissions();
  }, [session]);

  const handleOrder = () => {
    router.push("/order");
  };

  return (
    <>
      {loading ? <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-blue-500"></div>
      </div> :
        <div className="flex flex-col justify-center items-center mt-24 mx-4
    ">
          <div className="flex flex-col justify-center items-center">
            <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-300 mb-24 dark:text-gray-300 font-bold py-4 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
      bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
      border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]">
              Ventus Sales
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-400">
              Portal WEB para Creación de Pedidos en SAP
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            {session ? <>

              {!showLogistica ? <>         <Link href="/neoForm2">
                <p className="mt-24 w-96 text-2xl text-center mb-5 text-gray-800 bg-gradient-to-r from-orange-600/40 to-orange-800/40 border-2 drop-shadow-[0_5px_5px_rgba(177,155,0,0.75)]  border-orange-800 hover:bg-orange-600/50  dark:bg-gradient-to-r dark:from-orange-500/40 dark:to-orange-800/60 border-4 dark:drop-shadow-[0_9px_9px_rgba(255,255,0,0.25)]  dark:border-sky-200 dark:border-opacity-50 dark:hover:bg-sky-600/50 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center">
                  Buscar Negocio en HubSpot
                </p>
              </Link> </> : <></>}

              <Link href="/testeo">
                <p className="mt-24 w-96 text-2xl text-center mb-5 text-gray-800 bg-gradient-to-r from-green-600/40 to-green-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,177,100,0.75)]  border-green-800 hover:bg-green-600/50  dark:bg-gradient-to-r dark:from-green-500/40 dark:to-green-800/60 border-4 dark:drop-shadow-[0_9px_9px_rgba(0,255,0,0.25)]  dark:border-sky-200 dark:border-opacity-50 dark:hover:bg-sky-600/50 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center">
                  Herramientas
                </p>
              </Link>
              {
                showLogistica ? <><Link href="/logistica">
                  <p className="mt-24 w-96 text-2xl text-center mb-5 text-gray-800 bg-gradient-to-r from-blue-600/40 to-blue-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)]  border-blue-800 hover:bg-blue-600/50  dark:bg-gradient-to-r dark:from-blue-500/40 dark:to-blue-800/60 border-4 dark:drop-shadow-[0_9px_9px_rgba(0,0,255,0.25)]  dark:border-sky-200 dark:border-opacity-50 dark:hover:bg-sky-600/50 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center">
                    Logística
                  </p>
                </Link></> : <></>}

            </> : <>

              <button className="hover:backdrop-blur rounded p-1 m-4 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20" onClick={() => signIn()}>Conéctate</button>
            </>}
          </div>
        </div>
      } </>
  );
};

export default Landing;
