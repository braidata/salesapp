// fixed navbar with blur effect tailwindcss component

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import LoginButton from "../components/loginButton";
import dynamic from "next/dynamic";

const BlurNavbar = () => {
  //navbar
  const Sun = dynamic(() => import("../components/soonIcon"));
  const Moon = dynamic(() => import("../components/moonIcon"));
  const router = useRouter();

  const { systemTheme, theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderThemeChanger = () => {
    if (!mounted) return null;

    const currentTheme = theme === "system" ? systemTheme : theme;

    if (currentTheme === "dark") {
      return (
        <Sun
          className="w-10 h-10 text-yellow-500 "
          role="button"
          onClick={() => setTheme("light")}
        />
      );
    } else {
      return (
        <Moon
          className="w-10 h-10 text-cyan-600 "
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
        <Link href="/">
        <h1
          className="text-2xl hover:backdrop-blur rounded p-1 m-4 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20"
        >
            
          Ventus Sales
        </h1>
        </Link>
      </div>

      <div className="flex flex-row justify-center items-center ml-auto">
        <Link href="/">
          <p className="hover:backdrop-blur rounded p-2 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20">Inicio</p>
        </Link>
        {/* <Link href="/forms">
          <p className="hover:backdrop-blur rounded p-2 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20">Crear Orden</p>
        </Link> */}
                <Link href="/neoForm2">
          <p className="hover:backdrop-blur rounded p-2 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20">Negocios Hubspot</p>
        </Link>
        <Link href="/neoForm">
          <p className="hover:backdrop-blur rounded p-2 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20">Crear Pedido Manual</p>
        </Link>
        <Link href="/dashboard">
          <p className="hover:backdrop-blur rounded p-2 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20">Dashboard</p>
        </Link>
        {/* <Link href="/probahub">
          <p className="hover:backdrop-blur rounded p-2 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20">API HubSpot</p>
        </Link> */}
        <Link href="/toolsSQL">
          <p className="hover:backdrop-blur rounded p-2 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20">Productos</p>
        </Link>
        {/* login */}
        {/* <Link href="/api/auth/signin">
          <p className="hover:backdrop-blur rounded p-2 hover:bg-blue-300/20 
        active:backdrop-blur-md active:bg-blue-300/40 dark:active:bg-white/40
        font-bold dark:text-white/70 text-cyan-800 ml-2 dark:hover:bg-white/20">Ingresar</p>
        </Link> */}
        <LoginButton />
        {renderThemeChanger()}
      </div>
    </div>
  );
};

export default BlurNavbar;
