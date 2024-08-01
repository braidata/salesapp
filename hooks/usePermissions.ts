import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface PermissionRoleCombination {
  permissions: string[];
  roles: string[];
}

const usePermissions = (combinations: PermissionRoleCombination[]) => {
  const { data: session } = useSession();
  const [access, setAccess] = useState<Record<string, boolean>>({});

  const checkPermissions = async (requiredPermissions: string[], requiredRoles: string[]) => {
    const res = await fetch("/api/mysqlPerm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session ? session.session.user.email : null,
      }),
    });
    const data = await res.json();
    console.log("Los permisos y roles son: ", data);

    if (data && data.user && data.user[0]) {
      const userPermissions = data.user[0].permissions || [];
      const userRoles = data.user[0].rol || [];
      console.log("Los permisos y roles son: ", userPermissions, userRoles);

      const hasPermissions = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );
      const hasRoles = requiredRoles.every(role =>
        userRoles.includes(role)
      );

      return hasPermissions && hasRoles;
    }
    return false;
  };

  const fetchPermissions = async () => {
    const newAccess: Record<string, boolean> = {};

    for (const { permissions, roles } of combinations) {
      const key = `${permissions.join(",")}|${roles.join(",")}`;
      newAccess[key] = await checkPermissions(permissions, roles);
    }

    setAccess(newAccess);
  };

  useEffect(() => {
    if (session) {
      fetchPermissions();
    }
  }, [session]);

  return { access };
};

export default usePermissions;

