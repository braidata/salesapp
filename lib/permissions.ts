import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

/**
 * Verifica si el usuario tiene alguno de los roles requeridos
 */
// checkPermissions.ts
export const checkPermissions = async ({
    email,
    roles = [],
    endpoint = "/api/mysqlPerm",
  }: {
    email: string | null;
    roles: string[];
    endpoint?: string;
  }): Promise<boolean> => {
    if (!email) return false;
  
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
  
      // Ojo: mira 'permissions', no 'rol'
      const userPermission = data?.user?.[0]?.permissions?.toLowerCase() || "";
      // Si en algunos casos la DB usa `rol`, haz un fallback:
      // const userPermission = (data?.user?.[0]?.permissions || data?.user?.[0]?.rol || "").toLowerCase();
  
      // Compara con los roles pedidos
      return roles.some(required => userPermission.includes(required));
    } catch (error) {
      console.error("Error al verificar permisos:", error);
      return false;
    }
  };
  

/**
 * Hook para verificar permisos de usuario autenticado en NextAuth
 */
export const usePermissions = (requiredRoles: string[]) => {
  const { data: session } = useSession();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      const email = session?.session?.user?.email || null;
      const allowed = await checkPermissions({ email, roles: requiredRoles });
      setHasPermission(allowed);
      setLoading(false);
    };

    if (session) fetchPermissions();
  }, [session]);

  return { hasPermission, loading };
};
