import { useState, useRef } from 'react';

export default function Sidebar({ generateImages, generate, downloadImage }) {
  const [isOpen, setIsOpen] = useState(false);
  const canvasRef = useRef();

  const toggleSidebar = () => setIsOpen((prevState) => !prevState);

  return (
    <>
      <button
        className="fixed right-0 top-0 mr-6 mt-6 p-3 bg-blue-500 text-white rounded-md shadow-lg"
        onClick={toggleSidebar}
      >
        {isOpen ? 'Cerrar' : 'Abrir'} menú
      </button>
      <div
        className={`${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } fixed top-0 right-0 h-screen bg-gray-100 w-96 py-6 px-8 overflow-scroll transition-all duration-300 ease-in-out`}
      >
        <h2 className="text-2xl font-bold mb-4">Controles</h2>
        <div className="mb-4">
          <label htmlFor="num-nodes">Número de nodos:</label>
          <input type="number" id="num-nodes" defaultValue={50} />
        </div>
        <div className="mb-4">
          <label htmlFor="num-connections">Número de conexiones:</label>
          <input type="number" id="num-connections" defaultValue={25} />
        </div>
        <div className="mb-4">
          <label htmlFor="node-size">Tamaño de nodo:</label>
          <input type="range" id="node-size" min={10} max={30} defaultValue={20} />
        </div>
        <div className="mb-4">
          <label htmlFor="line-width">Ancho de línea:</label>
          <input type="range" id="line-width" min={0.1} max={10} defaultValue={0.5} step={0.1} />
        </div>
        <div className="mb-4">
          <label htmlFor="line-color">Color de línea:</label>
          <input type="color" id="line-color" defaultValue="#4285f4" />
        </div>
        <div className="mb-4">
          <label htmlFor="node-color">Color de Nodo:</label>
          <input type="color" id="node-color" defaultValue="#8285f4" />
        </div>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md shadow-md mr-2 hover:bg-blue-600 transition-all duration-300"
          onClick={generateImages}
        >
          Cambiar Aleatorio
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-md shadow-md mr-2 hover:bg-green-600 transition-all duration-300"
          onClick={generate}
        >
          Aplicar Cambios
        </button>
        <button
          className="bg-gray-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-gray-600 transition-all duration-300"
          onClick={downloadImage}
        >
          Descargar Imagen
        </button>

        <canvas ref={canvasRef} className="mt-4"></canvas>
      </div>
    </>
  );
}