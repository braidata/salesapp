//nextjs tailwind landing page component
import React from "react";
import { useRouter } from "next/router";
import Text from "../components/text";
import GridCards from "../components/gridCards";

const Landing = () => {
  const router = useRouter();

  const handleOrder = () => {
    router.push("/order");
  };

  return (
    <div className="flex flex-col justify-center items-center mt-40">
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-300 mb-5">
          Ventus Sales
        </h1>
        <p className="text-2xl text-gray-700 dark:text-gray-400">
          Portal WEB para Creación de Pedidos en SAP
        </p>
      </div>

      <div className="flex flex-col justify-center items-center"></div>
      <Text
        title="Objetivos"
        description="Desarrollar un portal para capturar todos los datos necesarios para la creación de un pedido en SAP, para los canales de Distribución y Venta Directa."
      />

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
      />

      {/* <FlowChart /> */}
    </div>
  );
};

export default Landing;
