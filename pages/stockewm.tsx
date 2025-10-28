// pages/logistica.tsx (Next.js 12 - Pages Router)
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/router";
// import SimpliRoute from "../components/simpliRoute";
// import Cotizador from "../components/CotizadorEnviame";
// import DashboardContainer from "@/components/super-dashboard/dashboard-container";
import StockEwmViewer from "../components/StockEwmViewer";

const Logistica = () => {
  const { data: session } = useSession();
  const [data, setData] = useState<any>();
  const userSender = async (event: any) => {
    event.preventDefault();
    try {
      const payload = {
        name: session?.token?.name,
        email: session?.token?.email,
        id: parseInt(session?.token?.sub as string),
      };
      const response = await fetch("/api/mysqlConsulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resDB = await response.json();
      setData(resDB);
      console.log("base", resDB);
    } catch {
      console.log("No hay datos DB");
    }
  };

  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      // The user is not authenticated, handle it here.
    },
  });

  const router = useRouter();
  const [refresh, setRefresh] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>();
  const refreshPage = () => {
    setRefresh(true);
    router.reload();
  };

  if (status === "loading") {
    return (
      <>
        <div className=" mt-48 mb-5">
          <h1 className="dark:text-gray-300 font-bold py-2 px-4 rounded-lg  hover:text-gray-900   border-gray-400 hover:bg-gray-600/50 text-gray-900 dark:bg-gradient-to-r dark:from-gray-400/80 dark:via-gray-600 dark:to-purple-200/50 border-2   dark:border-sky-200 dark:hover:bg-sky-900  hover:animate-pulse transform hover:-translate-y-1 hover:scale-110
      mt-48 mt-2 mb-5 bg-gradient-to-r from-gray-200 via-gray-100 to-purple-300/30 text-center transition duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 
      border-2 drop-shadow-[0_10px_10px_rgba(10,15,17,0.75)] dark:drop-shadow-[0_10px_10px_rgba(255,255,255,0.25)]">
            Busca las ubicaciones de tu stock
          </h1>
          <p className="mt-10 bg-gray-100 text-sm  border border-gray-300 text-gray-600 text-xl text-center rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-100 p-2.5 dark:bg-gray-400 dark:border-gray-200 dark:placeholder-gray-400 dark:text-gray-800 dark:focus:ring-blue-500 dark:focus:border-blue-500 ">
            Identificate con tu cuenta para acceder a el portal de Stock EWM
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="w-full flex min-h-screen flex-col items-center justify-center py-2 rounded-lg">
        {/* <h1 className="mt-24">Portal Logística</h1> */}
        <div className="flex flex-row gap-2 mt-24 rounded-lg w-full max-w-7xl px-4">
          {/* Reemplazo del contenido por el viewer */}
          <StockEwmViewer />
          {/* Si querés conservar el dashboard al lado, descomentá: */}
          {/* <DashboardContainer /> */}
        </div>
      </div>
    </>
  );
};

export default Logistica;
