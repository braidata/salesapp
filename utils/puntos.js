// import { useEffect, useRef } from "react";

// const nodes = [];
// const connections = [];

// export default function Canvas() {
//   const canvasRef = useRef();

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const context = canvas.getContext("2d");
//     canvas.style.position = "fixed";
//     canvas.style.top = 0;
//     canvas.style.left = 0;
//     canvas.style.width = "100vw";
//     canvas.style.height = "100vh";
//     canvas.style.zIndex = -1;
//     canvas.width = 4096;
//     canvas.height = 2304;
//     init(canvas);
//     setInterval(() => {
//       draw(canvas, context);
//     }, 30);
//   }, []);

//   function init(canvas) {
//     for (let i = 0; i < 50; i++) { // Crea 25 nodos aleatorios en el lienzo
//       nodes.push({
//         x: Math.random() * canvas.width,
//         y: Math.random() * canvas.height,
//         size: Math.random() * 20 + 10
//       });
//     }

//     for (let i = 0; i < nodes.length; i++) { // Crea conexiones aleatorias entre los nodos
//       for (let j = i + 1; j < nodes.length; j++) {
//         if (Math.random() < 0.2) {
//           connections.push([i, j]);
//         }
//       }
//     }
//   }

//   function mapRange(value, inputStart, inputEnd, outputStart, outputEnd) {
//     return ((value - inputStart) * (outputEnd - outputStart)) / (inputEnd - inputStart) + outputStart;
//   }

//   function draw(canvas, context) {
//     context.clearRect(0, 0, canvas.width, canvas.height); // Limpia el lienzo

//     for (let i = 0; i < connections.length; i++) { // Dibuja todas las conexiones
//       let a = connections[i][0];
//       let b = connections[i][1];
//       let distance = Math.sqrt(Math.pow(nodes[a].x - nodes[b].x, 2) + Math.pow(nodes[a].y - nodes[b].y, 2)); // Calcula la distancia entre los nodos
//       let alpha = map(distance, 0, 400, 1, 0.2); // Calcula la transparencia de la línea según la distancia
//       context.beginPath();
//       context.moveTo(nodes[a].x, nodes[a].y);
//       context.lineTo(nodes[b].x, nodes[b].y);
//       context.lineWidth = 1;
//       context.strokeStyle = `rgba(66, 133, 244, ${alpha})`;
//       context.stroke();
//     }

//     for (let i = 0; i < nodes.length; i++) { // Dibuja todos los nodos
//       //let alpha = map(nodes[i].size, 10, 30, 0.4, 1); // Calcula la transparencia del nodo según su tamaño
//       context.beginPath();
//       const size = mapRange(i, 0, nodes.length - 1, 10, 30);
//       const alpha = mapRange(size, 10, 30, 100, 255);
//       const r = mapRange(size, 10, 30, 0, 255);
//       const g = mapRange(size, 10, 30, 219, 70);
//       const b = mapRange(size, 10, 30, 255, 216);
//       context.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha / 255})`;
//       context.arc(nodes[i].x, nodes[i].y, nodes[i].size, 0, 2 * Math.PI);
//       //context.fillStyle = `rgba(66, 133, 244, ${alpha})`;
//       context.fill();
//     }
//   }

//   function map(value, inputMin, inputMax, outputMin, outputMax) {
//     return (
//       ((value - inputMin) * (outputMax - outputMin)) / (inputMax - inputMin) +
//       outputMin
//     );
//   }

//   return <canvas ref={canvasRef}></canvas>;
// }

import { useEffect, useRef, useState } from "react";
import Draggable from 'react-draggable';


const nodes = [];
const connections = [];


export default function Canvas() {
  const canvasRef = useRef();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const [isAnimated, setIsAnimated] = useState(false);


  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    canvas.style.position = "fixed";
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.zIndex = -1;
    canvas.width = 4096;
    canvas.height = 2304;
    init(canvas);
    setInterval(() => {
      draw(canvas, context);
    }, 30);
  }, []);

  function init(canvas) {
    if (nodes.length > 4) {
      nodes.length = 0;
      connections.length = 0;
    } else {
      nodes.length += 1;
      connections.length += 1;
    }
    //canvas.style.border = "1px solid black";
    for (let i = 0; i < 50; i++) { // Crea 25 nodos aleatorios en el lienzo
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 20 + 10
      });
    }

    for (let i = 0; i < nodes.length; i++) { // Crea conexiones aleatorias entre los nodos
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() < 0.2) {
          connections.push([i, j]);
        }
      }
    }
  }

  function map(value, inputMin, inputMax, outputMin, outputMax) {
    return ((value - inputMin) * (outputMax - outputMin)) / (inputMax - inputMin) + outputMin;
  }

  function mapRange(value, inputStart, inputEnd, outputStart, outputEnd) {
    return ((value - inputStart) * (outputEnd - outputStart)) / (inputEnd - inputStart) + outputStart;
  }

  function generateImages() {
    const canvas = canvasRef.current;
    init(canvas);
    draw(canvas, canvas.getContext("2d"));
    setIsGenerated(true);
  }

  function download() {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `red-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsDownloading(true);
  }

  function generate() {

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    // Obtenemos los valores actuales de los inputs
    const numNodes = parseInt(document.getElementById("num-nodes").value);
    const numConnections = parseInt(document.getElementById("num-connections").value);
    const nodeSize = parseInt(document.getElementById("node-size").value) * Math.random(10, 60);
    const nodeColor = document.getElementById("node-color").value;
    const lineWidth = parseInt(document.getElementById("line-width").value);
    const lineColor = document.getElementById("line-color").value;
    //opacity
    const opacity = parseFloat(document.getElementById("opacity").value);

    // Limpiamos el canvas y los arrays
    nodes.length = 0;
    connections.length = 0;
    //context.clearRect(0, 0, canvas.width, canvas.height);

    // Creamos los nuevos nodos
    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 20 + 10 + nodeSize
      });
    }

    // Creamos las nuevas conexiones
    for (let i = 0; i < numConnections; i++) {
      const a = Math.floor(Math.random() * numNodes);
      let b = Math.floor(Math.random() * numNodes);
      while (a === b) { // Nos aseguramos de que no se conecte con sí mismo
        b = Math.floor(Math.random() * numNodes);
      }
      connections.push([a, b]);
    }



    // for (let i = 0; i < numNodes; i++) { // Crea 25 nodos aleatorios en el lienzo
    //   nodes.push({
    //     x: Math.random() * canvas.width,
    //     y: Math.random() * canvas.height,
    //     size: Math.random() * 20 + 10 + nodeSize
    //   });
    // }

    // for (let i = 0; i < numConnections; i++) { // Crea conexiones aleatorias entre los nodos
    //   for (let j = i + 1; j < numConnections; j++) {
    //     if (Math.random() < 0.2) {
    //       connections.push([i, j]);
    //     }
    //   }

    // }

    //canvas.style.border = "1px solid black";
    // for (let i = 0; i < 50; i++) { // Crea 25 nodos aleatorios en el lienzo
    //   nodes.push({
    //     x: Math.random() * canvas.width,
    //     y: Math.random() * canvas.height,
    //     size: Math.random() * 20 + 10
    //   });
    // }

    // for (let i = 0; i < nodes.length; i++) { // Crea conexiones aleatorias entre los nodos
    //   for (let j = i + 1; j < nodes.length; j++) {
    //     if (Math.random() < 0.2) {
    //       connections.push([i, j]);
    //     }
    //   }
    // }

    // Actualizamos las opciones de dibujo
    context.lineWidth = lineWidth;
    context.strokeStyle = lineColor;
    context.fillStyle = nodeColor;
    //opacity
    // Limitar el valor de opacidad al rango de 0 a 1
    const clampedOpacity = Math.min(Math.max(opacity, 0), 1);
    // Redondear el valor de opacidad a dos decimales
    const roundedOpacity = Math.round(clampedOpacity * 100) / 100;
    // Establecer la opacidad en el contexto de canvas
    context.globalAlpha = roundedOpacity * Math.random(0.1, 0.3);

    context.fill();
    context.stroke();

  }

  function draw(canvas, context) {
    context.clearRect(0, 0, canvas.width, canvas.height); // Limpia el lienzo

    for (let i = 0; i < connections.length; i++) { // Dibuja todas las conexiones
      let a = connections[i][0];
      let b = connections[i][1];
      let distance = Math.sqrt(Math.pow(nodes[a].x - nodes[b].x, 2) + Math.pow(nodes[a].y - nodes[b].y, 2)); // Calcula la distancia entre los nodos
      let alpha = map(distance, 0, 400, 1, 0.2); // Calcula la transparencia de la línea según la distancia
      context.beginPath();
      context.moveTo(nodes[a].x, nodes[a].y);
      context.lineTo(nodes[b].x, nodes[b].y);
      //context.lineWidth = 1 - Math.random() * 0.5;
      //context.strokeStyle = `rgba(66, 133, 244, ${alpha})`;
      context.stroke();
    }

    for (let i = 0; i < nodes.length; i++) { // Dibuja todos los nodos
      //let alpha = map(nodes[i].size, 10, 30, 0.4, 1); // Calcula la transparencia del nodo según su tamaño
      context.beginPath();
      const size = mapRange(i, 0, nodes.length - 1, 10, 30);
      const alpha = mapRange(size, 10, 30, 100, 255);
      const r = mapRange(size, 10, 30, 0, 255);
      const g = mapRange(size, 10, 30, 219, 70);
      const b = mapRange(size, 10, 30, 255, 216);
      //context.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha / 255})`;
      context.arc(nodes[i].x, nodes[i].y, nodes[i].size, 0, 2 * Math.PI);
      //context.fillStyle = `rgba(66, 133, 244, ${alpha})`;
      context.fill();
    }

    if (isDownloading.current) {
      const dataURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "network.png";
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      isDownloading.current = false;
    }

    if (isGenerated) {
      return;
    }


  }

  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen((prevState) => !prevState);

  return (
    <>
      <div className="relative">
        <canvas ref={canvasRef}></canvas>

      </div>
      <button
        className="fixed right-0 top-0 mr-6 mt-24 p-3 bg-gray-700/90 dark:bg-gray-800 dark:text-white text-gray-900 rounded-md shadow-lg z-50"
        onClick={toggleSidebar}
      >
        {isOpen ? 'Cerrar' : 'Abrir'} Controles
      </button>
      <Draggable>
        <div
          className={`${isOpen ? 'translate-y-6' : 'invisible'
            } fixed bottom-0 right-0 overflow-hidden w-64 h-32 rounded-md bg-blue-700 dark:bg-gray-800/80  dark:bg-opacity-90 py-6 px-8  transition-all duration-300 ease-in-out z-10 shadow-lg blur-lg`}
        >
          <h2 className="text-2xl font-bold mb-4 space-y-2 space-x-4">Controles</h2>
          <div className="mb-4 space-y-2 space-x-4 z-40 gap-4">
            <label htmlFor="num-nodes">Número de nodos:</label>
            <input className="px-2 ml-2  rounded-md shadow-md mr-2 w-24 max-w-12 z-80" type="number" id="num-nodes" defaultValue={50} />
          </div>
          <div className="mb-4 space-y-2 space-x-4 z-40">
            <label htmlFor="num-connections">Número de conexiones:</label>
            <input className="px-2 ml-2  rounded-md shadow-md mr-2 w-24 max-w-12 z-80" type="number" id="num-connections" defaultValue={25} />
          </div>
          <div className="mb-4 space-y-2 space-x-4 z-40">
            <label htmlFor="node-size">Tamaño de nodo:</label>
            <input className="px-2 ml-2  rounded-md shadow-md mr-2 w-24 max-w-12 z-80" type="number" id="node-size" min={0} max={40} defaultValue={20} />
          </div>
          <div className="mb-4 space-y-2 space-x-4 z-40">
            <label htmlFor="line-width">Ancho de línea:</label>
            <input className="px-2 ml-2  rounded-md shadow-md mr-2 w-24 max-w-12 z-80" type="number" id="line-width" min={0} max={40} defaultValue={0.5} step={0.1} />
          </div>
          <div className="mb-4 space-y-2 space-x-4 z-40">
            <label htmlFor="line-color">Color de línea:</label>
            <input className="px-2 ml-2  rounded-md shadow-md mr-2 w-24 max-w-12 z-80" type="color" id="line-color" defaultValue="#4285f4" />
          </div>
          <div className="mb-4 space-y-2 space-x-4 z-40">
            <label htmlFor="node-color">Color de Nodo:</label>
            <input className="px-2 ml-2  rounded-md shadow-md mr-2 w-24 max-w-12 z-80" type="color" id="node-color" defaultValue="#8285f4" />
          </div>
          {/* opacity */}
          <div className="mb-4 space-y-2 space-x-4 z-40">
            <label htmlFor="opacity">Opacidad:</label>
            <input className="px-2 ml-2  rounded-md shadow-md mr-2 w-24 max-w-12 z-80" type="number" id="opacity" step={0.1} defaultValue={0.5} />
          </div>
          <div className="flex justify-center mt-6">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-md shadow-md mr-2 hover:bg-blue-600 transition-all duration-300 z-80"
              onClick={generateImages}
            >
              Cambiar Aleatorio
            </button>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded-md shadow-md mr-2 hover:bg-green-600 transition-all duration-300 z-80"
              onClick={generate}
            >
              Aplicar Cambios
            </button>
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-gray-600 transition-all duration-300 z-80"
              onClick={download}
            >
              Descargar Imagen
            </button>
          </div>
        </div>
      </Draggable>
    </>

  );
}


