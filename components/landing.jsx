//nextjs tailwind landing page component
import React from "react";
import { useRouter } from "next/router";
import Text from "../components/text";
import GridCards from "../components/gridCards";
import Link from "next/link";

const Landing = () => {
  const router = useRouter();

  const handleOrder = () => {
    router.push("/order");
  };

  return (
    <div className="flex flex-col justify-center items-center mt-24 mx-4
    ">
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-300 mb-24 dark:text-gray-300 font-bold py-4 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
      bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
      border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]">
          Ventus Sales App
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-400">
          Portal WEB para Creación de Pedidos en SAP
        </p>
      </div>

      <div className="flex flex-col justify-center items-center"></div>
      <Text
        title="¿Cómo hacer un Pedido?"
        description="Si usas HubSpot elige Buscar Negocio; si necesitas generar un pedido manual elige Crear Pedido Manual."
      />
     {/* crea dos tarjetas como botones que dirijan a la pagina neoForm y neoForm2, neoForm2 debe ser naranja y transparente, la otra azul y transparente */}
     
     <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
      {/* cambia estos dos etiquetas a por Link <a className="mt-2 w-96 text-2xl text-center mb-5 text-gray-800 bg-gradient-to-r from-orange-600/40 to-orange-800/40 border-2 drop-shadow-[0_5px_5px_rgba(177,155,0,0.75)]  border-orange-800 hover:bg-orange-600/50  dark:bg-gradient-to-r dark:from-orange-500/40 dark:to-orange-800/60 border-4 dark:drop-shadow-[0_9px_9px_rgba(255,255,0,0.25)]  dark:border-sky-200 dark:border-opacity-50 dark:hover:bg-sky-600/50 dark:text-gray-200 font-bold py-2 px-4 rounded-lg" href="/neoForm2">
        Buscar Negocio en HubSpot
      </a>
      <a className="mt-2 w-96 text-2xl text-center mb-5 text-gray-800 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50  dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-4 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:border-opacity-50 dark:hover:bg-sky-600/50 dark:text-gray-200 font-bold py-2 px-4 rounded-lg" href="/neoForm">
        Crear Pedido Manual
      </a> */}
      <Link href="/neoForm2">
        <p className="mt-2 w-96 text-2xl text-center mb-5 text-gray-800 bg-gradient-to-r from-orange-600/40 to-orange-800/40 border-2 drop-shadow-[0_5px_5px_rgba(177,155,0,0.75)]  border-orange-800 hover:bg-orange-600/50  dark:bg-gradient-to-r dark:from-orange-500/40 dark:to-orange-800/60 border-4 dark:drop-shadow-[0_9px_9px_rgba(255,255,0,0.25)]  dark:border-sky-200 dark:border-opacity-50 dark:hover:bg-sky-600/50 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center">
          Buscar Negocio en HubSpot
        </p>
      </Link>
      <Link href="/neoForm">
        <p className="mt-2 w-96 text-2xl text-center mb-5 text-gray-800 bg-gradient-to-r from-sky-600/40 to-sky-800/40 border-2 drop-shadow-[0_5px_5px_rgba(0,155,177,0.75)]  border-sky-800 hover:bg-sky-600/50  dark:bg-gradient-to-r dark:from-sky-500/40 dark:to-sky-800/60 border-4 dark:drop-shadow-[0_9px_9px_rgba(0,255,255,0.25)]  dark:border-sky-200 dark:border-opacity-50 dark:hover:bg-sky-600/50 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transform perspective-1000 hover:rotate-[0.1deg] hover:skew-x-1 hover:skew-y-1 hover:scale-105 focus:-rotate-[0.1deg] focus:-skew-x-1 focus:-skew-y-1 focus:scale-105 transition duration-500 origin-center">
          Crear Pedido Manual
        </p>
      </Link>
      </div>


{/* 
      <Text title="Modulos y Flujo" />

      <GridCards />
      <a className="text-black dark:text-gray-200" href="/info">
        Ver Más
      </a>

      <Text
        title="Técnologías y Costos"
        description="Utilizaremos NextJS, plataforma robusta, rápida y segura que nos permitirá desarrollar un front con la mejor UI/UX posible del lado front o cliente y que además cuenta con un server y middleword pre instalado para gestionar las conexiones vía API y otras integraciones con BD sin exponer nuestros datos sensibles. Nos basaremos en HubSpot para la creacion y gestión de nuevos pedidos con la posiblidad de reutilizar objetos o crearlos (Contactos, Negocios, etc.). Instalaremos Auth0 para la autenticación de usuarios, la gestión de roles y permisos. El deploy será realizado en Vercel."
      />

      <Text
        title="Costos"
        description="Para desarrollar y mantener esta plataforma invertiremos en:"
      />
      <div>Mensual</div>
      <ul className="list-disc list-inside mt-5 mb-5">
        <li className="text-5 text-gray-500"> HubSpot: $60 (ya incluido)</li>
        <li className="text-5 text-gray-500 line-through"> Auth0: $20</li>
        <li className="text-5 text-gray-500 line-through"> Vercel: $25</li>
      </ul>

      <div>Implementación</div>
      <ul className="list-disc list-inside mt-5 mb-5">
        <li className="text-5 text-gray-500 line-through">
          {" "}
          Modulo Logística: $450
        </li>
        <li className="text-5 text-gray-500"> Modulo Productos: $0</li>
      </ul>

      <Text
        title="Desarrollo: Plazos y Encargados"
        description="Canales Digitales se encargará del desarrollo general del portal, las integraciones con HubSpot y Auth0, el diseño de la UI/UX, el modulo de Productos (cuando trabajemos con stock unificado) y el deploy en Vercel. El modulo de Logística será desarrollado por el equipo de desarrollo externo (que ya ha trabajado creando estas calculadoras de costos). El proyecto será entregado en producción en 2 semanas. A partir de esta etapa Claudio Valdebenito utilizará esta información para crear los pedidos en SAP."
      />*/}

     
    </div> 
  );
};

export default Landing;
