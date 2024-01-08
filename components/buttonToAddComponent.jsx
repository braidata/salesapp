//nextjs tailwind button to add component component 

import React from "react";
import {useState} from "react";


export default function ButtonToAddComponent({ children, nombre, dataSelect, dato1}) {
    
    //add infinite components
    const [components, setComponents] = useState([]);
    //add 1 counter
    let [counter, setCounter] = useState(0);
    

    const addComponent = () => {
        setCounter(counter + 1);
        console.log(counter)
        setComponents([...components, counter]);
    };

    return (
        <div className="w-100">
                        {components.map((component) => (
                <div className="w-100" key={component}>
                    {React.createElement(children.type, {cuenta: component, dataSelect: dataSelect, dato1: dato1})}
                </div>
            ))}
            <button className="mt-2 mb-5 bg-gradient-to-r from-indigo-600/40 to-indigo-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)]  border-indigo-800 hover:bg-indigo-600/50 text-gray-600 hover:text-gray-300 dark:bg-gradient-to-r dark:from-indigo-400/50 dark:to-indigo-600/50 border-2 dark:drop-shadow-[0_5px_5px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:hover:bg-sky-900 dark:text-gray-200 font-bold py-2 px-4 rounded-full" type="button" onClick={addComponent}>Agregar {nombre}</button>

        </div>
    );
}




      
        


//         setComponents([...components, <div className="flex flex-col items-center justify-center w-full h-full">
//             <div className="flex flex-col items-center justify-center w-full h-full">
//                 {children}
//             </div>
//         </div>]);
//     };

//     return (
//         <div className="flex flex-col items-center justify-center w-full h-full">
//             <div className="flex flex-col items-center justify-center w-full h-full">
//                 {components}
//             </div>
//             <button type="button" onClick={addComponent}>Agregar</button>
//         </div>
//     );
// }



//     const [show, setShow] = useState(false);

//     return (
//         <div>
//             <button type="button" onClick={() => setShow(!show)}>Agregar Producto</button>
//             {show && children}
//         </div>
//     );
// }



//     //mount unmount component
//     const [mounted, setMounted] = useState(false);
//     const toggle = () => setMounted(!mounted);
//     const Component = mounted ? children : null;

//     return (
//         <div className="flex flex-col items-center justify-center">
//             <div>
//             <button type="button" onClick={toggle} className="bg-green-200">
//                 {mounted ? "Quitar" : "Agregar"}
//             </button>
//             </div>
//             <div>
//             {Component}</div>

//             {/* add another children */}
           
            
//             </div>

           
        
//     );
// }


