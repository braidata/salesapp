//nextjs tailwind table widget component

import React from "react";

export default function TableWidget ({ children })  {

    //copy to clipboard function
    const copyTableRowToClipboard = (e) => {
     
        e.preventDefault();
        const text = e.target.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.children[0].children[0].children[2].textContent;
        navigator.clipboard.writeText(text);
        const info = navigator.clipboard.writeText(text);
        return info
    // }
        // const el = e.target;
        // let text = e.target.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.children[0].children[0].children[2].textContent;
        // navigator.clipboard.writeText(text);

        el.classList.add("bg-green-500");
        setTimeout(() => {
            el.classList.remove("bg-green-500");
        }
        , 1000);


        
    };




    return (

        //table widget
        
            
         <td className="py-4 px-6 text-right">
         <div className="flex item-center justify-end">
           <button onClick={copyTableRowToClipboard} className="w-4 mr-2 transform hover:text-purple-500 hover:scale-110">
             <svg
               xmlns="http://www.w3.org/2000/svg"
               className="h-6 w-6"
               fill="none"
               viewBox="0 0 24 24"
               stroke="currentColor"
             >
               <path
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 strokeWidth={4}
                 d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
               />
               <path
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 strokeWidth={2}
                 d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
               />
             </svg>
           </button>
           
           {/* <div className="w-4 mr-2 transform hover:text-purple-500 hover:scale-110">
             <svg
               xmlns="http://www.w3.org/2000/svg"
               className="h-6 w-6"
               fill="none"
               viewBox="0 0 24 24"
               stroke="currentColor"
             >
               <path
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 strokeWidth={2}
                 d="M6 18L18 6M6 6l12 12"
               />
             </svg>
           </div> */}
         </div>
       </td>
     


       /*{/* <td className="py-4 px-6">
         <a
           href="#"
           className="font-medium text-blue-600 dark:text-blue-500 hover:underline ml-2"
         >
           Editar
         </a>
         <a
           href="#"
           className="font-medium text-blue-600 dark:text-blue-500 hover:underline ml-2"
         >
           Enviar
         </a>
    </td> */
    )}

    