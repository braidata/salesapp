// components/SAPClientManager.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from "react-dom";
import {
  Check,
  X as XIcon,
  RefreshCw,
  AlertTriangle,
  UserPlus,
  Users,
  Eye,
  Pencil,
  Pen,
  Save,
  Loader2
} from 'lucide-react';

/* ===========================
   Notificaciones (misma lógica, look glass)
=========================== */
/* =====================================================
   Componente NotificationCard (idéntico, solo mejora z-index)
===================================================== */
const NotificationCard = React.memo(
  ({
    type,
    message,
    onClose,
  }: {
    type: "success" | "error" | "info";
    message: string;
    onClose: () => void;
  }) => {
    const typeColors = {
      success:
        "border-green-400 dark:border-green-600 bg-white/95 dark:bg-slate-900/95",
      error:
        "border-red-400 dark:border-red-600 bg-white/95 dark:bg-slate-900/95",
      info: "border-cyan-400 dark:border-cyan-600 bg-white/95 dark:bg-slate-900/95",
    };

    const iconMap = {
      success: (
        <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600 dark:text-green-400" />
      ),
      error: (
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
      ),
      info: (
        <RefreshCw className="w-5 h-5 flex-shrink-0 mt-0.5 text-cyan-600 dark:text-cyan-400" />
      ),
    };

    return (
      <div
        className={`pointer-events-auto backdrop-blur-xl rounded-xl p-4 mb-2 border-2 shadow-lg animate-slide-in-right z-[120] ${typeColors[type]}`}
      >
        <div className="flex items-start gap-3">
          {iconMap[type]}
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white m-0">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Cerrar notificación"
          >
            <XIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
      </div>
    );
  }
);

/* =====================================================
   Portal de Notificaciones 
===================================================== */
function NotificationsPortal({
  notifications,
  onClose,
}: {
  notifications: {
    id: string;
    type: "success" | "error" | "info";
    message: string;
  }[];
  onClose: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);

  // aseguramos que se renderiza sólo en cliente
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[120] max-w-96 pointer-events-none">
      {notifications.map((n) => (
        <div key={n.id} className="pointer-events-auto mb-2">
          <NotificationCard
            type={n.type}
            message={n.message}
            onClose={() => onClose(n.id)}
          />
        </div>
      ))}
    </div>,
    document.body
  );
}

/* ===========================
   Tipos
=========================== */
interface SAPClient {
  id: number;
  client_rut: string;
  client_nombre: string;
  client_apellido_paterno?: string;
  client_apellido_materno?: string;
  client_email?: string;
  client_celular?: string;
  client_region?: string;
  client_ciudad?: string;
  client_comuna?: string;
  client_giro?: string;
  creation_response?: string;
  created_by?: string;
  created_at: string;
  authorized_at?: string;
  authorized_by?: string;
}

interface SAPResponse {
  success: boolean;
  message: string;
  client?: SAPClient;
  sap_response?: any;
  error?: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

/* ===========================
   Componente principal
=========================== */
const SAPClientManager = () => {
  const [clients, setClients] = useState<SAPClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'pending' | 'created' | 'error'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Estado para modal uno-a-uno
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalClient, setModalClient] = useState<SAPClient | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [confirmDelay, setConfirmDelay] = useState(true); // anti-misclick

  // ---- Mini modal de edición por campo ----
  const [feOpen, setFeOpen] = useState(false);
  const [feField, setFeField] = useState<keyof SAPClient | null>(null);
  const [feLabel, setFeLabel] = useState<string>("");
  const [feValue, setFeValue] = useState<string>("");
  const [feSaving, setFeSaving] = useState(false);

  /* ===========================
     Interpretador SAP (tu lógica intacta)
  =========================== */
  const interpretSAPResponse = useCallback((sapResponse: any) => {
    if (!sapResponse) {
      return { success: false, message: 'Respuesta SAP vacía', status: 'ERROR' };
    }

    if (typeof sapResponse === 'string' && sapResponse === 'PENDING') {
      return { success: false, message: 'Cliente pendiente de procesamiento', status: 'PENDING' };
    }

    if (typeof sapResponse === 'string' && sapResponse === 'ERROR') {
      return { success: false, message: 'Error en procesamiento SAP', status: 'ERROR' };
    }

    let parsedResponse = sapResponse;
    if (typeof sapResponse === 'string') {
      try {
        parsedResponse = JSON.parse(sapResponse);
      } catch (e) {
        console.error('Error parseando respuesta SAP:', sapResponse, e);
        return { success: false, message: 'Formato de respuesta SAP inválido', status: 'ERROR' };
      }
    }

    if (typeof parsedResponse === 'string') {
      return {
        success: false,
        message: parsedResponse || 'Respuesta SAP como string sin contenido',
        status: 'ERROR'
      };
    }

    if (!parsedResponse || typeof parsedResponse !== 'object') {
      return { success: false, message: 'Respuesta SAP no es un objeto válido', status: 'ERROR' };
    }

    if (parsedResponse.RESP && parsedResponse.RESP.CODE !== undefined) {
      const respData = parsedResponse.RESP;
      const code = Number(respData.CODE);
      if (code === 0) {
        return {
          success: true,
          message: respData.TEXT || 'Operación exitosa',
          status: 'CREATED'
        };
      } else {
        return {
          success: false,
          message: respData.TEXT || `Error SAP (Código: ${code})`,
          status: 'ERROR'
        };
      }
    }

    if (parsedResponse.RESP && Array.isArray(parsedResponse.RESP)) {
      const responses = parsedResponse.RESP;
      const errors = responses.filter((resp: any) => Number(resp.CODE) !== 0);
      const successes = responses.filter((resp: any) => Number(resp.CODE) === 0);

      if (errors.length > 0) {
        const firstError = errors[0];
        return {
          success: false,
          message: firstError.TEXT || 'Error desconocido en SAP',
          status: 'ERROR',
          details: errors.map((e: any) => e.TEXT).join(', ')
        };
      } else if (successes.length > 0) {
        const firstSuccess = successes[0];
        return {
          success: true,
          message: firstSuccess.TEXT || 'Cliente creado exitosamente',
          status: 'CREATED',
          details: successes.map((s: any) => s.TEXT).join(', ')
        };
      }
    }

    if (parsedResponse.CODE !== undefined) {
      const code = Number(parsedResponse.CODE);
      if (code === 0) {
        return {
          success: true,
          message: parsedResponse.TEXT || 'Operación exitosa',
          status: 'CREATED'
        };
      } else {
        return {
          success: false,
          message: parsedResponse.TEXT || `Error en SAP (Código: ${code})`,
          status: 'ERROR'
        };
      }
    }

    console.warn('Formato de respuesta SAP no reconocido:', parsedResponse);
    return { success: false, message: 'Formato de respuesta SAP no reconocido', status: 'ERROR' };
  }, []);

  /* ===========================
     Notificaciones (misma lógica)
  =========================== */
  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const blockPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement> | React.DragEvent<HTMLInputElement>) => {
    e.preventDefault();
    // opcional: avisa al usuario
    showNotification('info', 'Pegado/desplegado deshabilitado: escribí CONFIRMAR manualmente.');
  }, [showNotification]);

  const blockHotkeyPaste = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const isPasteHotkey = (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'v');
    if (isPasteHotkey) {
      e.preventDefault();
      showNotification('info', 'Pegado deshabilitado.');
    }
  }, [showNotification]);

  /* ===========================
     Data fetch (igual)
  =========================== */
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/apiSAPClientGetAll');
      if (response.ok) {
        const data = await response.json();
        console.log('Clientes de BD:', data.clients?.slice(0, 3).map((c: any) => ({
          id: c.id,
          creation_response: c.creation_response,
          typeof_response: typeof c.creation_response
        })));
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      showNotification('error', 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);



  /* ===========================
     Estado por cliente (igual)
  =========================== */
  const getClientStatus = useCallback((client: SAPClient) => {
    if (!client.creation_response || client.creation_response === 'PENDING') {
      return { status: 'pending', text: 'Pendiente', color: 'yellow' as const };
    }
    if (client.creation_response === 'ERROR') {
      return { status: 'error', text: 'Error', color: 'red' as const };
    }
    const interpretation = interpretSAPResponse(client.creation_response);
    if (interpretation.success) {
      return { status: 'created', text: 'Creado en SAP', color: 'green' as const };
    } else {
      return { status: 'error', text: 'Error SAP', color: 'red' as const };
    }
  }, [interpretSAPResponse]);

  /* ===========================
     Crear cliente (igual)
  =========================== */
const createSingleClient = useCallback(async (clientId: number) => {
  // Optimista: mostrar PENDING al instante
  setClients(prev => prev.map(c => c.id === clientId ? { ...c, creation_response: "PENDING" } : c));
  setProcessingIds(prev => new Set(prev).add(clientId));

  try {
    const resp = await fetch("/api/apiSAPClientCreator", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ client_id: clientId, authorized_by: "Admin" })
    });

    const result: SAPResponse = await resp.json();
    // Pisar con EXACTO lo que volvió del servidor (que ya guardó en DB)
    const interpretation = interpretSAPResponse(result.sap_response);

    setClients(prev => prev.map(c =>
      c.id === clientId
        ? {
            ...c,
            creation_response:
              result?.sap_response ? JSON.stringify(result.sap_response) :
              (c.creation_response || "ERROR"),
            authorized_at: new Date().toISOString(),
            authorized_by: "Admin"
          }
        : c
    ));

    if (interpretation.success) {
      showNotification("success", interpretation.message || "OK");
    } else {
      showNotification("error", interpretation.message || "Error SAP");
    }

    // Sincronizar duro con la base para evitar “valores pegados”
    await fetchClients();

  } catch (error) {
    console.error("Error creating client in SAP:", error);
    setClients(prev => prev.map(c =>
      c.id === clientId ? { ...c, creation_response: "ERROR" } : c
    ));
    showNotification("error", "Error de conexión al crear cliente en SAP");
  } finally {
    setProcessingIds(prev => {
      const s = new Set(prev);
      s.delete(clientId);
      return s;
    });
  }
}, [interpretSAPResponse, showNotification, fetchClients]);

  /* ===========================
     Filtros y contadores (igual)
  =========================== */
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      switch (filter) {
        case 'pending':
          return !client.creation_response || client.creation_response === 'PENDING';
        case 'created':
          if (!client.creation_response || client.creation_response === 'PENDING') return false;
          if (client.creation_response === 'ERROR') return false;
          return interpretSAPResponse(client.creation_response).success;
        case 'error':
          if (client.creation_response === 'ERROR') return true;
          if (!client.creation_response || client.creation_response === 'PENDING') return false;
          return !interpretSAPResponse(client.creation_response).success;
        default:
          return true;
      }
    });
  }, [clients, filter, interpretSAPResponse]);

  const counts = useMemo(() => {
    const pending = clients.filter(c => !c.creation_response || c.creation_response === 'PENDING').length;
    let created = 0;
    let error = 0;

    clients.forEach(client => {
      if (!client.creation_response || client.creation_response === 'PENDING') return;
      if (client.creation_response === 'ERROR') { error++; return; }
      const interpretation = interpretSAPResponse(client.creation_response);
      if (interpretation.success) created++; else error++;
    });

    return { all: clients.length, pending, created, error };
  }, [clients, interpretSAPResponse]);

  const openFieldEditor = useCallback((
    field: keyof SAPClient,
    label: string,
    initial?: string | null
  ) => {
    setFeField(field);
    setFeLabel(label);
    setFeValue(initial ?? "");
    setFeOpen(true);
  }, []);

  const saveFieldEditor = useCallback(async () => {
    if (!modalClient || !feField) return;
    setFeSaving(true);
    try {
      const resp = await fetch("/api/apiSAPClientUpdate", {
        method: "POST", // o PATCH si preferís
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: modalClient.id,
          [feField]: feValue === "" ? null : feValue,
          updated_by: "Admin", // o tu user real
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.success) {
        throw new Error(data?.message || "No se pudo actualizar");
      }
      // refrescar lista y modal
      setClients((prev) => prev.map((c) => (c.id === data.client.id ? data.client : c)));
      setModalClient(data.client);
      showNotification("success", "Campo actualizado");
      setFeOpen(false);
    } catch (e: any) {
      showNotification("error", e?.message || "Error al actualizar");
    } finally {
      setFeSaving(false);
    }
  }, [modalClient, feField, feValue, showNotification]);


  /* ===========================
     Modal uno-a-uno
  =========================== */
  const openClientModal = useCallback((client: SAPClient) => {
    setModalClient(client);
    setConfirmText('');
    setConfirmDelay(true);
    setIsModalOpen(true);
    // anti-misclick delay 1.2s
    setTimeout(() => setConfirmDelay(false), 1200);
  }, []);

  const closeClientModal = useCallback(() => {
    setIsModalOpen(false);
    setModalClient(null);
    setConfirmText('');
    setConfirmDelay(true);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeClientModal();
    };
    // lock scroll del body
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isModalOpen, closeClientModal]);

  const confirmCreateIfAllowed = useCallback(async () => {
    if (!modalClient) return;
    const status = getClientStatus(modalClient);
    if (status.status === 'created') {
      // Ya creado -> Volver cierra modal
      closeClientModal();
      return;
    }
    // Requiere confirmar texto CONFIRMAR
    if (confirmText !== 'CONFIRMAR' || confirmDelay) return;
    await createSingleClient(modalClient.id);
    // refrescar cliente en el modal con el estado nuevo
    const updated = clients.find(c => c.id === modalClient.id);
    if (updated) setModalClient(updated);
  }, [modalClient, confirmText, confirmDelay, getClientStatus, createSingleClient, clients, closeClientModal]);

  /* ===========================
     Loading
  =========================== */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800">
        <div className="flex justify-center items-center h-64">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/20 dark:border-slate-700/20 shadow-xl rounded-2xl p-8 flex items-center gap-4">
            <RefreshCw className="w-8 h-8 text-cyan-600 dark:text-cyan-400 animate-spin" />
            <span className="text-lg font-medium text-slate-900 dark:text-white">Cargando clientes...</span>
          </div>
        </div>
      </div>
    );
  }




  type FieldRowProps = {
    label: string;
    field: keyof SAPClient;  // mejor tipado
    value?: string | null;
    onEdit: (field: keyof SAPClient, label: string, initial?: string | null) => void;
  };

  function FieldRow({ label, field, value, onEdit }: FieldRowProps) {
    return (
      <div className="w-full min-w-0">
        <div className="text-sm text-slate-500 dark:text-slate-400">{label}:</div>
        <div className="mt-0.5 flex items-center justify-between gap-2 w-full min-w-0">
          <div className="flex-1 min-w-0">
            <span className="block text-slate-900 dark:text-white truncate" title={value ?? "—"}>
              {value && value.trim().length > 0 ? value : "—"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onEdit(field, label, value ?? null)}
            className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg
                     border border-slate-300/50 dark:border-slate-700/50
                     bg-white/60 dark:bg-slate-800/60
                     hover:bg-white/80 dark:hover:bg-slate-700/80
                     text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
            aria-label={`Editar ${label}`}
          >
            <Pen size={14} className="opacity-70" />
            Editar
          </button>
        </div>
      </div>
    );
  }




  /* ===========================
     Render principal
  =========================== */
  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-950 dark:to-slate-900">
      {/* Notificaciones */}
      <NotificationsPortal
        notifications={notifications}
        onClose={removeNotification}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-800 dark:from-cyan-400 dark:to-cyan-600 bg-clip-text text-transparent mb-2 drop-shadow-[0_0_12px_rgba(0,255,255,0.25)]">
          Gestión de Clientes SAP
        </h1>
        <p className="text-lg text-slate-700 dark:text-slate-400">
          Administra y sincroniza clientes con SAP (flujo uno a uno con confirmación segura)
        </p>
      </div>

      {/* Controles superiores */}
      <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[inset_1px_1px_5px_rgba(255,255,255,0.06),_0_10px_30px_rgba(0,0,0,0.4)] rounded-3xl p-6 mb-6">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-2xl text-sm font-semibold border-none cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${filter === 'all'
              ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-600/30'
              : 'bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
              }`}
          >
            Todos ({counts.all})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-6 py-3 rounded-2xl text-sm font-semibold border-none cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${filter === 'pending'
              ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-600/30'
              : 'bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
              }`}
          >
            Pendientes ({counts.pending})
          </button>
          <button
            onClick={() => setFilter('created')}
            className={`px-6 py-3 rounded-2xl text-sm font-semibold border-none cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${filter === 'created'
              ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-600/30'
              : 'bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
              }`}
          >
            Creados ({counts.created})
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-6 py-3 rounded-2xl text-sm font-semibold border-none cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${filter === 'error'
              ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-600/30'
              : 'bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
              }`}
          >
            Errores ({counts.error})
          </button>
        </div>

        {/* Acciones superiores */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchClients}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium border-none cursor-pointer transition-all duration-200 bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/70"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabla de clientes */}
      <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[inset_1px_1px_5px_rgba(255,255,255,0.06),_0_10px_30px_rgba(0,0,0,0.4)] rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/60 dark:to-slate-800/60">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Fecha Registro</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const status = getClientStatus(client);
                const isProcessing = processingIds.has(client.id);
                const canCreate = status.status === 'pending' || status.status === 'error';

                const statusColors: Record<'pending' | 'created' | 'error', string> = {
                  pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700',
                  created: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700',
                  error: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
                };

                return (
                  <tr key={client.id} className="border-b border-slate-200/40 dark:border-white/10 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                          {[client.client_nombre, client.client_apellido_paterno, client.client_apellido_materno]
                            .filter(Boolean)
                            .join(' ')
                          }
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          RUT: {client.client_rut}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{client.client_email || 'N/A'}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{client.client_celular || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{client.client_ciudad || 'N/A'}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{client.client_region || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[status.status as 'pending' | 'created' | 'error']}`}>
                          {status.text}
                        </span>
                        {client.creation_response &&
                          client.creation_response !== 'PENDING' &&
                          client.creation_response !== 'ERROR' && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 max-w-48 truncate" title={interpretSAPResponse(client.creation_response).message}>
                              {interpretSAPResponse(client.creation_response).message}
                            </div>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(client.created_at).toLocaleDateString('es-CL')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openClientModal(client)}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-700/80 to-cyan-500/80 text-white border border-cyan-400/20 rounded-2xl font-semibold text-sm cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg shadow-cyan-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Estado vacío */}
      {filteredClients.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[inset_1px_1px_5px_rgba(255,255,255,0.06),_0_10px_30px_rgba(0,0,0,0.4)] rounded-3xl p-12 max-w-md mx-auto">
            <Users className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No hay clientes</h3>
            <p className="text-slate-600 dark:text-slate-400">
              {filter === 'all' ? 'No se encontraron clientes registrados.' : `No hay clientes con estado: ${filter}`}
            </p>
          </div>
        </div>
      )}

      {/* Modal uno-a-uno */}
      {isModalOpen && modalClient && (
        <div className="fixed inset-0 z-50 overscroll-contain">
          {/* Backdrop clickable */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeClientModal}
            aria-hidden="true"
          />
          {/* Contenedor centrado */}
          <div className="relative z-[51] flex min-h-full items-center justify-center p-4">
            {/* Dialog: altura limitada, layout en columnas y overflow controlado */}
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="client-detail-title"
              className="w-full max-w-3xl max-h-[88vh]
                   bg-white/90 dark:bg-slate-950/80 border border-white/20 dark:border-white/10
                   rounded-3xl shadow-[inset_1px_1px_6px_rgba(255,255,255,0.07),_0_20px_60px_rgba(0,0,0,0.55)]
                   backdrop-blur-2xl
                   flex flex-col overflow-hidden"
            >
              {/* Header (no scrollea) */}
              <div className="shrink-0 px-6 pt-5 pb-4 border-b border-white/20 dark:border-white/10">
                <div className="flex items-center justify-between gap-4">
                  <h2 id="client-detail-title" className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                    Detalle de cliente
                  </h2>
                  <button
                    onClick={closeClientModal}
                    className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10"
                    aria-label="Cerrar"
                  >
                    <XIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </button>
                </div>
              </div>

              {/* BODY (solo esto scrollea) */}
              <div className="grow overflow-y-auto overflow-x-hidden px-4 py-4">
                {/* === TU GRID SIN max-h AQUÍ === */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                  {/* Identificación */}
                  <div className="rounded-2xl p-4 bg-white/70 dark:bg-slate-900/60 border border-white/20 dark:border-white/10">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Identificación</h3>
                    <div className="min-w-0 space-y-1">
                      <FieldRow label="Nombre" field="client_nombre" value={modalClient?.client_nombre} onEdit={openFieldEditor} />
                      <FieldRow label="Apellido paterno" field="client_apellido_paterno" value={modalClient?.client_apellido_paterno} onEdit={openFieldEditor} />
                      <FieldRow label="Apellido materno" field="client_apellido_materno" value={modalClient?.client_apellido_materno} onEdit={openFieldEditor} />
                      <FieldRow label="RUT" field="client_rut" value={modalClient?.client_rut} onEdit={openFieldEditor} />
                      <FieldRow label="Sexo" field="client_sexo" value={modalClient?.client_sexo} onEdit={openFieldEditor} />
                    </div>
                  </div>

                  {/* Contacto */}
                  <div className="rounded-2xl p-4 bg-white/70 dark:bg-slate-900/60 border border-white/20 dark:border-white/10">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Contacto</h3>
                    <div className="min-w-0 space-y-1">
                      <FieldRow label="Email" field="client_email" value={modalClient?.client_email} onEdit={openFieldEditor} />
                      <FieldRow label="Teléfono" field="client_telefono" value={modalClient?.client_telefono} onEdit={openFieldEditor} />
                      <FieldRow label="Celular" field="client_celular" value={modalClient?.client_celular} onEdit={openFieldEditor} />
                    </div>
                  </div>

                  {/* Dirección */}
                  <div className="rounded-2xl p-4 bg-white/70 dark:bg-slate-900/60 border border-white/20 dark:border-white/10">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Dirección</h3>
                    <div className="space-y-1">
                      <FieldRow label="Calle" field="client_calle" value={modalClient?.client_calle} onEdit={openFieldEditor} />
                      <FieldRow label="N° calle" field="client_numero_calle" value={modalClient?.client_numero_calle} onEdit={openFieldEditor} />
                      <FieldRow label="Casa/Depto" field="client_numero_casa_depto" value={modalClient?.client_numero_casa_depto} onEdit={openFieldEditor} />
                      <FieldRow label="Comuna" field="client_comuna" value={modalClient?.client_comuna} onEdit={openFieldEditor} />
                      <FieldRow label="Ciudad" field="client_ciudad" value={modalClient?.client_ciudad} onEdit={openFieldEditor} />
                      <FieldRow label="Región" field="client_region" value={modalClient?.client_region} onEdit={openFieldEditor} />
                      <FieldRow label="Giro" field="client_giro" value={modalClient?.client_giro} onEdit={openFieldEditor} />
                    </div>
                  </div>

                  {/* Estado SAP */}
                  <div className="md:col-span-2 rounded-2xl p-4 bg-white/70 dark:bg-slate-900/60 border border-white/20 dark:border-white/10">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Estado SAP</h3>
                    {(() => {
                      const s = getClientStatus(modalClient);
                      const colorMap: any = {
                        pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700',
                        created: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700',
                        error: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
                      };
                      return (
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex w-fit items-center px-3 py-1 rounded-full text-xs font-semibold border ${colorMap[s.status]}`}>
                            {s.text}
                          </span>
                          {(modalClient.creation_response &&
                            modalClient.creation_response !== 'PENDING' &&
                            modalClient.creation_response !== 'ERROR') && (
                              <div className="text-xs text-slate-600 dark:text-slate-400">
                                {interpretSAPResponse(modalClient.creation_response).message}
                              </div>
                            )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Confirmación (también dentro del área scrolleable) */}
                  {(() => {
                    const s = getClientStatus(modalClient);
                    const canCreate = s.status === 'pending' || s.status === 'error';
                    return canCreate ? (
                      <div className="md:col-span-2">
                        <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                          Escribí <b>CONFIRMAR</b> para crear el cliente en SAP
                        </label>
                        <input
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder="CONFIRMAR"
                          className="w-full bg-white/60 dark:bg-slate-900/60 border border-white/20 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-cyan-500 outline-none text-slate-900 dark:text-white placeholder-slate-400"
                          onPaste={blockPaste}
                          onDrop={blockPaste}
                          onKeyDown={blockHotkeyPaste}
                          autoComplete="off"
                          inputMode="text"
                          spellCheck={false}
                        />
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Seguridad: espera breve antes de habilitar el botón para evitar aprobaciones accidentales.
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              {/* FOOTER (no scrollea, siempre visible) */}
              <div className="shrink-0 px-6 py-4 border-t border-white/20 dark:border-white/10 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  {(() => {
                    if (!modalClient) return null;
                    const s = getClientStatus(modalClient);
                    const canCreate = s.status === 'pending' || s.status === 'error';
                    return (
                      <>
                        <button
                          onClick={confirmCreateIfAllowed}
                          disabled={canCreate ? (confirmText !== 'CONFIRMAR' || confirmDelay || processingIds.has(modalClient.id)) : false}
                          className={`px-5 py-2 rounded-2xl text-sm font-semibold transition-all duration-200
                      ${canCreate
                              ? (confirmText === 'CONFIRMAR' && !confirmDelay && !processingIds.has(modalClient.id)
                                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/30 hover:scale-[1.02]'
                                : 'bg-slate-800/50 text-slate-400 cursor-not-allowed')
                              : 'bg-gradient-to-r from-slate-700/80 to-slate-600/80 text-white hover:scale-[1.02]'}
                    `}
                        >
                          {(() => {
                            if (canCreate) {
                              return processingIds.has(modalClient.id)
                                ? (<span className="inline-flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Creando…</span>)
                                : (<span className="inline-flex items-center gap-2"><UserPlus className="w-4 h-4" /> CREAR</span>);
                            }
                            return 'VOLVER';
                          })()}
                        </button>

                        <button
                          onClick={closeClientModal}
                          className="px-5 py-2 rounded-2xl bg-gradient-to-r from-slate-900/70 to-slate-800/70 border border-white/10 hover:bg-slate-800/90 transition-all duration-200 text-slate-200 hover:scale-[1.02]"
                        >
                          Cancelar
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {feOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setFeOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-[71] w-full max-w-md rounded-2xl border border-white/15
                    bg-white/80 dark:bg-slate-900/80 shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Editar: {feLabel}
              </h3>
              <button onClick={() => setFeOpen(false)} className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10" aria-label="Cerrar">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                value={feValue}
                onChange={(e) => setFeValue(e.target.value)}
                placeholder={`Nuevo valor para ${feLabel}`}
                className="flex-1 bg-white/70 dark:bg-slate-900/60 border border-white/20 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 outline-none"
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setFeValue("")}
                className="px-3 rounded-xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 hover:scale-[1.02]"
                title="Borrar rápido"
                aria-label="Borrar rápido"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setFeOpen(false)} className="px-3 py-2 rounded-xl bg-slate-700/60 text-slate-100 hover:scale-[1.02] text-sm">
                Cancelar
              </button>
              <button
                onClick={saveFieldEditor}
                disabled={feSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 text-white hover:scale-[1.03] disabled:opacity-60 text-sm"
              >
                {feSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {feSaving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}





      {/* Animación CSS para notificaciones */}
      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default SAPClientManager;
