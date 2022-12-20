//nextjs tailwindcss navbar component

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import {useState, useEffect} from "react";
import {useTheme} from "next-themes";

import dynamic from "next/dynamic";

const Navbar = () => {
    //navbar
    const Sun = dynamic(() => import("../components/soonIcon"));
    const Moon = dynamic(() => import("../components/moonIcon"));
    const router = useRouter()

    const {systemTheme , theme, setTheme} = useTheme ();

    const [mounted, setMounted] = useState(false);

      useEffect(() =>{
        setMounted(true);
      },[])

    const renderThemeChanger= () => {
          if(!mounted) return null;

          const currentTheme = theme === "system" ? systemTheme : theme ;

          if(currentTheme ==="dark"){
            return (
              <Sun className="w-10 h-10 text-yellow-500 " role="button" onClick={() => setTheme('light')} />
            )
          }

          else {
            return (
              <Moon className="w-10 h-10 text-gray-100 " role="button" onClick={() => setTheme('dark')} />
            )
          }
       };



    
    return (
        <nav className="fixed top-0 left-0 right-0 flex flex-row justify-between items-center bg-gray-900 p-4 mb-12 w-full">
            <div className="flex flex-row justify-center items-center">
                <Image src="/logo-ventus.png" width={50} height={50} />
                <h1 className="text-2xl font-bold text-white ml-2">Ventus Sales</h1>
                {/* <Sun className="w-10 h-10 text-yellow-500 " role="button" onClick={() => setTheme('light')} />
                <Moon className="w-10 h-10 text-gray-900 " role="button" onClick={() => setTheme('dark')} /> */}
               
            </div>
            
            <div className="flex flex-row justify-center items-center">
            
                <Link href="/">
                    <p className="text-white p-2">Inicio</p>
                </Link>
                <Link href="/forms">
                    <p className="text-white p-2">Crear Orden</p>
                </Link>
                <Link href="/dashboard">
                    <p className="text-white p-2">Dashboard</p>
                </Link>
                <Link href="/probahub">
                    <p className="text-white p-2">API HubSpot</p>
                </Link>
                <Link href="/wooProducts">
                    <p className="text-white p-2">Productos</p>
                </Link>
                {/* login */}
                <Link href="/login">
                    <p className="text-white p-2">Ingresar</p>
                </Link>
                {renderThemeChanger()}
            </div>
        </nav>
    )
}

export default Navbar


    