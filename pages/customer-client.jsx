// pages/testeo.js

import { useSession } from "next-auth/react";
import { useState, useEffect } from 'react';
import SAPClientManager from "../components/SAPClientManager";

const Testeo = () => {
  const { data: session, status } = useSession();
  const [hasVentasPermission, setHasVentasPermission] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  // Función para verificar permisos (copiada del navbar)
  const checkPermissions = async () => {
    if (!session || !session.session || !session.session.user) {
      setHasVentasPermission(false);
      setIsCheckingPermissions(false);
      return;
    }

    try {
      const res = await fetch("/api/mysqlPerm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.session.user.email,
        }),
      });
      
      const data = await res.json();
      console.log("Los permisos son:", data);

      // Verificar si tiene permisos de ventas
      if (data && data.user && data.user[0] && data.user[0].permissions) {
        const userPermissions = data.user[0].permissions;
        console.log("Permisos del usuario:", userPermissions);
        
        setHasVentasPermission(userPermissions === 'outlet');
      } else {
        setHasVentasPermission(false);
      }
    } catch (error) {
      console.error('Error obteniendo permisos:', error);
      setHasVentasPermission(false);
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session) {
      checkPermissions();
    } else if (status === "unauthenticated") {
      setHasVentasPermission(false);
      setIsCheckingPermissions(false);
    }
  }, [session, status]);

  // Loading session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  // No autenticado
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Acceso Denegado</h2>
          <p className="text-red-600">Debes iniciar sesión para acceder.</p>
        </div>
      </div>
    );
  }

  // Verificando permisos
  if (isCheckingPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Sin permisos de ventas
  if (!hasVentasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Sin Permisos</h2>
          <p className="text-yellow-600">No tienes permisos de ventas para acceder a esta aplicación.</p>
          <p className="text-sm text-gray-500 mt-2">
            Email: {session?.session?.user?.email || 'N/A'}
          </p>
        </div>
      </div>
    );
  }

  // Con permisos correctos
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <SAPClientManager />
      </div>
    </div>
  );
};

export default Testeo;