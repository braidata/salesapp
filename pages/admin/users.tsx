import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import usePermissions from "../../hooks/usePermissions";

interface UserRecord {
  id: number;
  name: string;
  email: string;
  ownerId: number;
  permissions?: string | null;
  rol?: string | null;
  team?: string | null;
  rut?: string | null;
  image?: string | null;
}

const initialForm: Partial<UserRecord> & { password?: string } = {
  name: "",
  email: "",
  ownerId: undefined,
  password: "",
  permissions: "",
  rol: "",
  team: "",
  rut: "",
};

const AdminUsersPage = () => {
  const { status } = useSession();
  const { access } = usePermissions([{ permissions: ["all"], roles: ["admin"] }]);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formValues, setFormValues] = useState(initialForm);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const hasAccess = access["all|admin"];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("No se pudo cargar la información de usuarios");
      const data = await response.json();
      setUsers(data.users || []);
      setRoles(data.roles || []);
      setPermissions(data.permissions || []);
    } catch (err: any) {
      setError(err.message || "Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchUsers();
    }
  }, [status]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.team || "").toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const handleChange = (field: keyof typeof formValues, value: any) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormValues(initialForm);
  };

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "No se pudo crear el usuario");
      }

      resetForm();
      setSuccessMessage("Usuario creado exitosamente");
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || "Error creando usuario");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (user: UserRecord) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleEditChange = (field: keyof UserRecord, value: any) => {
    setEditingUser((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "No se pudo actualizar el usuario");
      }

      setModalOpen(false);
      setSuccessMessage("Usuario actualizado");
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || "Error actualizando usuario");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.message || "No se pudo eliminar el usuario");
      }

      setSuccessMessage("Usuario eliminado");
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || "Error eliminando usuario");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-lg text-gray-700 dark:text-gray-200">
        Validando sesión...
      </div>
    );
  }

  if (status === "authenticated" && hasAccess === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center text-lg text-gray-700 dark:text-gray-200">
        Comprobando permisos...
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="mt-32 rounded-xl border border-gray-200 bg-white/70 p-8 text-center shadow-lg backdrop-blur-sm dark:border-gray-600 dark:bg-gray-800/70">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Acceso restringido</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Necesitas rol <span className="font-semibold text-sky-600">admin</span> y permiso <span className="font-semibold text-sky-600">all</span> para ingresar.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-col gap-8 pb-16">
      <section className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-xl backdrop-blur-sm transition hover:shadow-2xl dark:border-gray-600 dark:bg-gray-900/80">
        <div className="flex flex-col gap-4 border-b border-dashed border-gray-200 pb-4 dark:border-gray-700 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Panel administrativo</p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestión de usuarios</h1>
            <p className="text-gray-600 dark:text-gray-300">Crea, busca y edita usuarios usando los roles y permisos existentes.</p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Buscar por nombre, email o equipo"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-sky-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/40 dark:bg-red-900/40 dark:text-red-100">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm dark:border-emerald-400/40 dark:bg-emerald-900/40 dark:text-emerald-100">
            {successMessage}
          </div>
        )}

        <form className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleCreate}>
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-sky-50 p-4 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-200">Nombre completo</label>
            <input
              required
              type="text"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              value={formValues.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-sky-50 p-4 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-200">Email</label>
            <input
              required
              type="email"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              value={formValues.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-sky-50 p-4 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-200">Owner ID</label>
            <input
              required
              type="number"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              value={formValues.ownerId || ""}
              onChange={(e) => handleChange("ownerId", e.target.value)}
            />
          </div>
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-sky-50 p-4 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-200">Password</label>
            <input
              type="text"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              value={formValues.password || ""}
              onChange={(e) => handleChange("password", e.target.value)}
            />
          </div>
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-sky-50 p-4 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-200">Rol</label>
            <select
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              value={formValues.rol || ""}
              onChange={(e) => handleChange("rol", e.target.value)}
            >
              <option value="">Selecciona un rol</option>
              {roles.map((rol) => (
                <option key={rol} value={rol || ""}>
                  {rol}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-sky-50 p-4 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-200">Permisos</label>
            <select
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              value={formValues.permissions || ""}
              onChange={(e) => handleChange("permissions", e.target.value)}
            >
              <option value="">Selecciona permisos</option>
              {permissions.map((perm) => (
                <option key={perm} value={perm || ""}>
                  {perm}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-sky-50 p-4 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-200">Equipo</label>
            <input
              type="text"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              value={formValues.team || ""}
              onChange={(e) => handleChange("team", e.target.value)}
            />
          </div>
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-sky-50 p-4 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-200">Rut</label>
            <input
              type="text"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              value={formValues.rut || ""}
              onChange={(e) => handleChange("rut", e.target.value)}
            />
          </div>
        </form>
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Limpiar
          </button>
          <button
            type="submit"
            onClick={handleCreate}
            className="rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:from-sky-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Guardando..." : "Crear usuario"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-gray-600 dark:bg-gray-900/80">
        <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-3 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Usuarios existentes</h2>
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:bg-sky-900/50 dark:text-sky-100">
            {users.length} en total
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-600 dark:text-gray-300">Cargando usuarios...</div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-sky-50 to-blue-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:from-gray-800 dark:to-gray-800 dark:text-gray-200">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Permisos</th>
                  <th className="px-4 py-3">Equipo</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white/70 text-sm dark:divide-gray-800 dark:bg-gray-900/50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-sky-50/60 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">#{user.id}</td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-200">{user.email}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-100">{user.rol || "—"}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-100">{user.permissions || "—"}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-100">{user.team || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="rounded-lg border border-sky-500 px-3 py-1 text-xs font-semibold text-sky-600 transition hover:bg-sky-50 dark:border-sky-400 dark:text-sky-200 dark:hover:bg-sky-900/40"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="rounded-lg border border-red-500 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-400 dark:text-red-200 dark:hover:bg-red-900/40"
                          disabled={saving}
                        >
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start justify-between border-b border-gray-200 pb-3 dark:border-gray-700">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-600">Editar usuario</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{editingUser.name}</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-200">Nombre</label>
                <input
                  type="text"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  value={editingUser.name}
                  onChange={(e) => handleEditChange("name", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-200">Email</label>
                <input
                  type="email"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  value={editingUser.email}
                  onChange={(e) => handleEditChange("email", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-200">Owner ID</label>
                <input
                  type="number"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  value={editingUser.ownerId}
                  onChange={(e) => handleEditChange("ownerId", Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-200">Rol</label>
                <select
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  value={editingUser.rol || ""}
                  onChange={(e) => handleEditChange("rol", e.target.value)}
                >
                  <option value="">Selecciona un rol</option>
                  {roles.map((rol) => (
                    <option key={rol} value={rol || ""}>
                      {rol}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-200">Permisos</label>
                <select
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  value={editingUser.permissions || ""}
                  onChange={(e) => handleEditChange("permissions", e.target.value)}
                >
                  <option value="">Selecciona permisos</option>
                  {permissions.map((perm) => (
                    <option key={perm} value={perm || ""}>
                      {perm}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-200">Equipo</label>
                <input
                  type="text"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  value={editingUser.team || ""}
                  onChange={(e) => handleEditChange("team", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-200">RUT</label>
                <input
                  type="text"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  value={editingUser.rut || ""}
                  onChange={(e) => handleEditChange("rut", e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdate}
                className="rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:from-sky-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
