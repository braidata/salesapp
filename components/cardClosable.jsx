//closable card component


import React from "react";
import { useState } from "react";
import { createContext } from "react";
export default function CardClosable({ children, title, name, description }) {

    const variables = {
        title: title,
        name: name,
        description: description,
    };

    //create context

    const Environment = createContext(variables);
    
        
    const [show, setShow] = useState(true);

    const toggle = () => {
        setShow(!show);
    };





    return (
        <div className="bg-gray-100  border border-gray-300 text-gray-600 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-400 dark:border-gray-200 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-700 ">{title}</h3>
                </div>
                <div className="flex justify-between items-center">
                {/* nombre */}
                <h3 className="text-md   ">{name}</h3></div>
                <div className="flex justify-between items-center">
                {/* descripcion */}
                <h3 className="text-sm font-15 text-gray-700">{description}</h3></div>

                <button onClick={toggle} className="text-gray-600 focus:outline-none focus:text-gray-500">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm2 0v8h8V6H6z" clipRule="evenodd" />
                    </svg>
                </button>
            
            {show && (
                <div className="mt-4">
                    {children}
                </div>
            )}

</div>
            
        
    );
}

// Path: with-tailwindcss\components\cardClosable.jsx
// Compare this snippet from with-tailwindcss\components\buscaHubspotD.jsx:
//           className="mt-2 mb-5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
// Compare this snippet from with-tailwindcss\components\buscaHubspotDSWR.jsx:
//     <button onClick={() => {
//       mutate()
//     }} className="mt-2 mb-5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" type="submit">
//       Refrescar
//     </button>

// Path: with-tailwindcss\components\cardClosable.jsx
// Compare this snippet from with-tailwindcss\components\buscaHubspotD.jsx:
//       <button
//         onClick={functions}
//         className="mt-2 mb-5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
//         type="submit"
//       >




            


                
                {/* < Dialog  as = "div"   className = "fixed inset-0 z-10 overflow-y-auto"   onClose = { close } >
                    < div   className = "min-h-screen px-4 text-center" >
                        < Dialog  as = "div"   className = "inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"   onClose = { close } >
                            < div   className = "bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4" >
                                < div   className = "sm:flex sm:items-start" >
                                    < div   className = "mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10" >
                                        < XIcon   className = "h-6 w-6 text-blue-600"   aria-hidden = "true"   />
                                    </ div >
                                    < div   className = "mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left" >
                                        < Dialog .  Title   as = "h3"   className = "text-lg leading-6 font-medium text-gray-900" > { name } </ Dialog . Title >
                                        < div   className = "mt-2" >
                                            < p   className = "text-sm text-gray-500" > { description } </ p >
                                        </ div >
                                    </ div >
                                </ div >
                            </ div >
                            < div   className = "bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse" >
                                < button   type = "button"   className = "w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"   onClick = { functions } >
                                    Save
                                </ button >
                                < button   type = "button"   className = "mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"   onClick = { close } >
                                    Cancel
                                </ button >
                            </ div >
                        </ Dialog >
                    </ div >
                </ Dialog > */}

// // //             <div className="flex justify-between">
// // //                 <h2 className="text-lg font-medium text-gray-900">{title}</h2>
// // //                 <button
// // //                     type="button"
// // //                     className="text-gray-400 hover:text-gray-500"
// // //                 >
// // //                     <span className="sr-only">Close</span>
// // //                     <svg
// // //                         className="h-5 w-5"
// // //                         xmlns="http://www.w3.org/2000/svg"
// // //                         viewBox="0 0 20 20"
// // //                         fill="currentColor"
// // //                         aria-hidden="true"
// // //                     >
// // //                         <path
// // //                             fillRule="evenodd"
// // //                             d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
// // //                             clipRule="evenodd"
// // //                         />
// // //                     </svg>
// // //                 </button>
// // //             </div>
// // //             <div className="mt-4">{children}</div>
// // //         </div>
// // //     );
// // // }





