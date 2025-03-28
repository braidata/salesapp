import { useSession } from "next-auth/react";
import React from 'react';
import RutValidator from "../components/rutTester"; // Asegurate de que el nombre del archivo sea correcto

const Testeo = () => {
  const { data: session, status } = useSession();

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-900">
      <div className="w-full max-w-7xl h-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <RutValidator />
      </div>
    </div>
  );
};

export default Testeo;
