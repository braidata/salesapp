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
            <button className="w-100" type="button" onClick={addComponent}>Agregar {nombre}</button>
            {components.map((component) => (
                <div className="w-100" key={component}>
                    {React.createElement(children.type, {cuenta: component, dataSelect: dataSelect, dato1: dato1})}
                </div>
            ))}
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


