// pages/testeo.js (o pages/testeo.tsx para TypeScript)

import { useSession } from "next-auth/react";
import React from 'react';
import dynamic from 'next/dynamic';

// Importamos el Dashboard dinámicamente para evitar problemas con SSR
const AnalyticsDashboard = dynamic(
  () => import("../components/dashboard"),
  { ssr: false }
);

const Testeo = () => {
  const { data: session, status } = useSession();

  return (
    <div className="w-full min-h-screen p-4 flex flex-col items-center justify-center bg-gray-100/20">
      <h1 className="text-2xl font-bold mb-4">Testeo de Datos</h1>
      {/* El componente Dashboard ya trae su propio fondo y estilos */}
      <AnalyticsDashboard />
    </div>
  );
};

export default Testeo;