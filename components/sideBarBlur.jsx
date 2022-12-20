//nextjs tailwinds blur sidebar component

import React from "react";
import { useState } from "react";
import { Transition } from "@headlessui/react";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid";
import  BuscaHubspotD from "../components/buscaHubspotD";


export default function SideBarBlur ({children})  {
  
    
    return (
        //left sidebar with search and filter
        <div className="mt-10 w-full">
        <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-medium text-white-900 dark:text-white-100">Filtros</h3>
            {/* <button
            onClick={() => setOpen(!open)}
            className="text-gray-500 dark:text-white-500 focus:outline-none"
            >
            {open ? (
                <ChevronUpIcon className="w-5 h-5" />
            ) : (
                <ChevronDownIcon className="w-5 h-5" />
            )}
            </button>
            <BuscaHubspotD />
        </div>
        <Transition

            show={open}
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
        >
            <div className="mt-2">{children}</div>  
        </Transition>
        <div className="mt-10 w-full">
        <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-medium text-white-900 dark:text-white-100">Filtros</h3>
            <button
            onClick={() => setOpen(!open)}
            className="text-gray-500 dark:text-white-500 focus:outline-none"
            >
            {open ? (
                <ChevronUpIcon className="w-5 h-5" />
            ) : (

                <ChevronDownIcon className="w-5 h-5" />
            )}
            </button>
        </div>
        <Transition

            show={open}
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
        >
            <div className="mt-2">{children}</div>
        </Transition> */}
        </div>
        </div>
        
        


    );
    }

//

