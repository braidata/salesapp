import Head from "next/head";
import Image from "next/image";
import Text from "../components/text";

const Info = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2 mt-10">
      <Text title="Información General" />
      <Text
        title="HubSpot"
        description="Integración Bidireccional para leer/escribir información de Contactos y Negocios."
      />
      <Text
        title="API Productos"
        description="Este modulo será una API que nos traerá toda la información de los productos; medidas, inventario y precios."
      />
      <Text
        title="Módulo Logística"
        description="Nos permitirá pre calcular el flete antes de envíar el pedido a SAP."
      />
    </div>
  );
};

export default Info;
