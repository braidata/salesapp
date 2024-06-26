// fixed navbar with blur effect tailwindcss component

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import NotificationTest from '../components/bell'
import dynamic from "next/dynamic";
import { useSession, signIn, signOut } from "next-auth/react"
import NavBarUserMenu from "../components/NavBarUserMenu"
import { SelectContainer } from "../components/SelectUserContainer";




const BlurNavbar = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const { data: session, status } = useSession()
  const [showLogistica, setShowLogistica] = useState(false);

  const loggedInUserEmail = session ? session.session.user.email : null

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

  const fetchPermissions = async () => {
    const hasPermissions = await checkPermissions(["logistics", "tester"]);
    console.log("Has permissions: ", hasPermissions)
    setShowLogistica(hasPermissions);
  };

  //fetchPermissions();
  useEffect(() => {
    fetchPermissions();
  }, [session]);

  // session permissions for navbar
  //const [session, loading] = useSession();

  //navbar
  const Sun = dynamic(() => import("../components/soonIcon"));
  const Moon = dynamic(() => import("../components/moonIcon"));
  const router = useRouter();

  const { systemTheme, theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const handleModalOpen = () => {
    setModalIsOpen(true);
  };

  const handleModalClose = () => {
    setModalIsOpen(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);



  const renderThemeChanger = () => {
    if (!mounted) return null;

    const currentTheme = theme === "system" ? systemTheme : theme;

    if (currentTheme === "dark") {
      return (
        <Sun
          className="w-10 h-10 text-yellow-500 mr-8 "
          role="button"
          onClick={() => setTheme("light")}
        />
      );
    } else {
      return (
        <Moon
          className="w-10 h-10 text-cyan-600 mr-8 "
          role="button"
          onClick={() => setTheme("dark")}
        />
      );
    }
  };









  return (
    <div className="fixed top-0 z-40 w-full h-12 flex flex-row backdrop-blur-sm bg-white/30 transition-colors duration-500 lg:z-50 lg:border-b lg:border-slate-900/10 dark:border-slate-50/[0.06] bg-white/95 supports-backdrop-blur:bg-white/30 dark:bg-transparent">

      <div className="flex flex-row justify-center items-center ">

        {/* <Image src="/logo-ventus.png" width={50} height={50} /> */}
        {/* hamburguer clckable que despliegue link a inicio ya dashboard*/}

        <div className="flex flex-row justify-center items-center">
          {session ?
            <>
              <div className="sm:hidden flex flex-row  justify-center items-center ml-8">
                <div className="flex flex-col sm:hidden justify-center items-center" onClick={handleModalOpen}>
                  <div className="w-6 h-1  bg-turquoise rounded-full"></div>
                  <div className="w-6 h-1  bg-turquoise rounded-full mt-1"></div>
                  <div className="w-6 h-1  bg-turquoise rounded-full mt-1"></div>
                </div>
              </div>
              {modalIsOpen && (
                <div className="backdrop-blur-sm bg-white/30 transition-colors duration-500 lg:z-50 lg:border-b lg:border-slate-900/10 dark:border-slate-50/[0.06] bg-white/30 supports-backdrop-blur:bg-white/30 dark:bg-transparent fixed top-0 left-0 w-full h-full z-50 flex items-center justify-center overflow-auto 
         
        " id="modal">
                  {/* modal-background gradient */}
                  <div className=" bg-gray-900 bg-opacity-30 absolute w-full h-full z-0   
          "></div>
                  {/* modal-card */}
                  <div className=" bg-gray-700/20 w-11/12 md:max-w-3xl mx-auto rounded shadow-lg z-50 overflow-y-auto 
          ">
                    {/* modal-card-head*/}
                    <header className="bg-gray-300/90 flex items-center justify-between p-5 border-b border-gray-300 dark:border-gray-700 dark:bg-gray-800 
            ">
                      {/* modal-card-title */}
                      <p className="text-gray-600  text-xl font-semibold dark:text-gray-300 
              ">Menú</p>
                      <button
                        title="Cerrar"
                        className="rounded-full p-2 text-gray-600 dark:text-gray-300 text-2xl font-semibold leading-none hover:text-gray-200 hover:bg-gray-500/20 focus:outline-none focus:shadow-outline transition duration-150 ease-in-out dark:hover:bg-gray-700 dark:hover:text-green-100/80 dark:focus:shadow-outline dark:focus:outline-none dark:transition duration-150 ease-in-out dark:ease-in-out dark:duration-150 dark:shadow-outline dark:focus:outline-none dark:focus:shadow-outline dark:transition duration-150 ease-in-out drop-shadow-[0_9px_9px_rgba(0,10,20,0.85)] dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]
                "
                        aria-label="close"
                        onClick={handleModalClose}
                      >X</button>
                    </header>
                    {/* modal-card-body with dashboard link*/}

                    <section className="opacity-50 bg-gray-300/90 flex flex-col items-center justify-center p-5 border-b border-gray-300 dark:border-gray-600 dark:bg-gray-800
            ">
                      <div className="flex flex-col justify-center items-center">
                        <Link href="/toolset">
                          <h1
                            className="text-lg sm:text-3x1 hover:backdrop-blur w-96 text-center rounded hover:bg-blue-300/20
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white text-cyan-900 dark:hover:bg-white/20" onClick={handleModalClose}
                          >
                            Herramientas
                          </h1>
                        </Link>
                      </div>
                    </section>
                    <section className="opacity-50 bg-gray-300/90 flex flex-col items-center justify-center p-5 border-b border-gray-300 dark:border-gray-600 dark:bg-gray-800
            ">
                      <div className="flex flex-col justify-center items-center">
                        <Link href="/inventario">
                          <h1
                            className="text-lg sm:text-3x1 hover:backdrop-blur w-96 text-center rounded hover:bg-blue-300/20
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white text-cyan-900 dark:hover:bg-white/20" onClick={handleModalClose}
                          >
                            Inventario
                          </h1>
                        </Link>
                      </div>
                    </section>
                    {showLogistica ? <><section className="opacity-50 bg-gray-300/90 flex flex-col items-center justify-center p-5 border-b border-gray-300 dark:border-gray-600 dark:bg-gray-800
            ">
                      <div className="flex flex-col justify-center items-center">
                        <Link href="/logistica">
                          <h1
                            className="text-lg sm:text-3x1 hover:backdrop-blur w-96 text-center rounded hover:bg-blue-300/20
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white text-cyan-900 dark:hover:bg-white/20" onClick={handleModalClose}
                          >
                            Logística
                          </h1>
                        </Link>
                      </div>
                    </section></> : null}

                    {!showLogistica ? <><section className="opacity-50 bg-gray-300/90 flex flex-col items-center justify-center p-5 border-b border-gray-300 dark:border-gray-600 dark:bg-gray-800
            ">
                      <div className="flex flex-col justify-center items-center">
                        <Link href="/neoForm2">
                          <h1
                            className="text-lg sm:text-3x1 hover:backdrop-blur w-96 text-center rounded hover:bg-blue-300/20
                    active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
                    font-bold dark:text-white text-cyan-900 dark:hover:bg-white/20" onClick={handleModalClose}
                          >
                            Envíar Negocio HubSpot
                          </h1>
                        </Link>
                      </div>
                    </section>
                      <section className="opacity-50 bg-gray-300/90 flex flex-col items-center justify-center p-5 border-b border-gray-300 dark:border-gray-600 dark:bg-gray-800
            ">
                        <div className="flex flex-col justify-center items-center">
                          <Link href="/dashboard">
                            <h1
                              className="text-lg sm:text-3x1 hover:backdrop-blur w-96 text-center rounded hover:bg-blue-300/20
                    active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
                    font-bold dark:text-white text-cyan-900 dark:hover:bg-white/20" onClick={handleModalClose}
                            >
                              Dashboard
                            </h1>
                          </Link>
                        </div>
                      </section></> : null}

                    {/* <section className="opacity-50 bg-gray-300/90 flex flex-col items-center justify-center p-5 border-b border-gray-300 dark:border-gray-600 dark:bg-gray-800
            ">
                  <div className="flex flex-col justify-center items-center">
                    <Link href="/neoForm">
                      <h1
                        className="text-lg sm:text-3x1 hover:backdrop-blur w-96 text-center rounded hover:bg-blue-300/20
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white text-cyan-900 dark:hover:bg-white/20" onClick={handleModalClose}
                      >
                        Crear Pedido Manual
                      </h1>
                    </Link>
                  </div>
                </section> */}
                  </div></div>)}
            </> : null}
          <div className="flex flex-row justify-center items-center">

            <Link href="/">
              <h1
                className="text-lg lg:text-2x1 ml-4 text-center hover:backdrop-blur w-32 rounded hover:bg-blue-300/20
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 dark:hover:bg-white/20"

              >
                Ventus Sales
              </h1>
            </Link>

          </div>
        </div>
      </div>

      <div className="flex flex-row justify-center gap-4 items-center ml-auto">
        {session ?
          <>
            {!showLogistica ? <><Link href="/neoForm2">
              <p className="hidden lg:flex hover:backdrop-blur rounded p-2 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20">Pedido HubSpot</p>
            </Link>
              <Link href="/neoForm">
                <p className="hidden lg:flex hover:backdrop-blur rounded p-2 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20">Pedido Manual</p>
              </Link>
              <Link href="/dashboard">
                <p className="hidden lg:flex hover:backdrop-blur rounded p-2 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20">Dashboard</p>
              </Link>
              <Link href="https://imega.atlassian.net/servicedesk/customer/portal/1" target="blank">
                <p className="hidden lg:flex hover:backdrop-blur rounded p-2 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20">Soporte</p>
              </Link></> : null}
            <Link href="/toolset">
              <p className="hidden lg:flex hover:backdrop-blur rounded p-2 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20">Herramientas</p>
            </Link>
            <Link href="/inventario">
              <p className="hidden lg:flex hover:backdrop-blur rounded p-2 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20">Inventario</p>
            </Link>

            {showLogistica ? <><Link href="/logistica">
              <p className="hidden lg:flex hover:backdrop-blur rounded p-2 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20">Logística</p>
            </Link></> : null}</> : null}

        <NotificationTest/>
        <NavBarUserMenu loggedInUserEmail={loggedInUserEmail} />
        {renderThemeChanger()}



      </div>
    </div>
  );
};

export default BlurNavbar;
