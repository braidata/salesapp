import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Text from "../components/text";
import OrdersVentusCompP from "../components/orderVentusCompPaymentsVTEXpe";

const PagosV = () => {
  const { data: session, status } = useSession();
  const [sessionInfo, setSessionInfo] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermisos = async () => {
      if (!session?.token?.email) return;

      try {
        const res = await fetch("/api/mysqlPerm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: session.token.email,
          }),
        });

        const data = await res.json();
        const userRol = data?.user?.[0]?.permissions ?? "No conectado";
        setSessionInfo(userRol);
      } catch (error) {
        console.error("Error al obtener los permisos:", error);
      }
    };

    if (status === "authenticated") {
      fetchPermisos();
    }
  }, [session, status]);

  if (status === "loading") {
    return <div>Cargando...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="w-96 ml-8 lg:w-full flex min-h-screen flex-col items-center justify-center py-2">
        <Text
          title="Pagos"
          classe="dark:text-gray-300 font-bold py-2 px-4 rounded-lg hover:text-gray-900 border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2 dark:border-sky-200 dark:hover:bg-sky-900 hover:animate-pulse transform hover:-translate-y-1 hover:scale-110 mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]"
          description="No tienes acceso a esta sección. Solicita acceso al administrador."
        />
      </div>
    );
  }

  if (sessionInfo !== "all" && sessionInfo !== "payments") {
    return (
      <div className="w-96 ml-8 lg:w-full flex min-h-screen flex-col items-center justify-center py-2">
        <Text
          title="Pedidos de Ecommerce Ventus Perú"
          classe="dark:text-gray-300 font-bold py-2 px-4 rounded-lg hover:text-gray-900 border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2 dark:border-sky-200 dark:hover:bg-sky-900 hover:animate-pulse transform hover:-translate-y-1 hover:scale-110 mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]"
          description="No tienes permisos para ver esta sección."
        />
      </div>
    );
  }

  return (
    <div className="w-96 ml-8 lg:w-full flex min-h-screen flex-col items-center justify-center py-2">
      <Text
        title="Pedidos de Ecommerce Ventus Perú"
        classe="dark:text-gray-300 font-bold py-2 px-4 rounded-lg hover:text-gray-900 border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2 dark:border-sky-200 dark:hover:bg-sky-900 hover:animate-pulse transform hover:-translate-y-1 hover:scale-110 mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]"
        description="En esta sección podrás ver los pedidos en espera de ecommerce Ventus Perú para su aprobación y envío a SAP controlado."
      />

      <OrdersVentusCompP />
    </div>
  );
};

export default PagosV;
