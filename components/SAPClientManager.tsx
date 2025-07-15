import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Íconos SVG inline optimizados
const CheckIcon = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XMarkIcon = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface ArrowPathIconProps {
  className?: string;
  size?: number | string;
  strokeWidth?: number;
  color?: string;
  'aria-label'?: string;
}

const ArrowPathIcon: React.FC<ArrowPathIconProps> = ({
  className = "",
  size = 24,
  strokeWidth = 2,
  color = "currentColor",
  'aria-label': ariaLabel = "Actualizar"
}) => (
  <svg
    className={className}
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={ariaLabel}
    role="img"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m-4.991 0v-4.991"
    />
  </svg>
);

const ExclamationTriangleIcon = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const UserPlusIcon = ({ className = "" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

interface UsersIconProps {
  className?: string;
  size?: number | string;
  strokeWidth?: number;
  color?: string;
  variant?: 'default' | 'solid' | 'outline';
  'aria-label'?: string;
}

const UsersIcon: React.FC<UsersIconProps> = ({
  className = "",
  size = 24,
  strokeWidth = 2,
  color = "currentColor",
  variant = "default",
  'aria-label': ariaLabel = "Usuarios"
}) => {
  const renderPath = () => {
    switch (variant) {
      case 'solid':
        return (
          <path
            fill={color}
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 18a6 6 0 1112 0v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-1zM15 12a3 3 0 100-6 3 3 0 000 6zm5 2a4 4 0 00-6.06.75A7.966 7.966 0 0116 18v1h4a1 1 0 001-1 4 4 0 00-1-2.65z"
            clipRule="evenodd"
          />
        );
      case 'outline':
        return (
          <>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </>
        );
      default:
        return (
          <>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </>
        );
    }
  };

  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill={variant === 'solid' ? color : 'none'}
      stroke={variant === 'solid' ? 'none' : color}
      strokeWidth={variant === 'solid' ? 0 : strokeWidth}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={ariaLabel}
      role="img"
    >
      {renderPath()}
    </svg>
  );
};

// Componente de notificación optimizado
const NotificationCard = React.memo(({
  type,
  message,
  onClose
}) => {
  const icons = {
    success: CheckIcon,
    error: ExclamationTriangleIcon,
    info: ArrowPathIcon
  };

  const IconComponent = icons[type];

  const typeColors = {
    success: 'border-green-400 dark:border-green-600 bg-white/95 dark:bg-slate-900/95',
    error: 'border-red-400 dark:border-red-600 bg-white/95 dark:bg-slate-900/95',
    info: 'border-cyan-400 dark:border-cyan-600 bg-white/95 dark:bg-slate-900/95'
  };

  const iconColors = {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-cyan-600 dark:text-cyan-400'
  };

  return (
    <div className={`backdrop-blur-xl rounded-xl p-4 mb-2 border-2 shadow-lg animate-slide-in-right ${typeColors[type]}`}>
      <div className="flex items-start gap-3">
        <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColors[type]}`} />
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900 dark:text-white m-0">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Cerrar notificación"
        >
          <XMarkIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>
      </div>
    </div>
  );
});

// Interfaces TypeScript
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

const SAPClientManager = () => {
  const [clients, setClients] = useState<SAPClient[]>([]);
  const [selectedClients, setSelectedClients] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'created' | 'error'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Función para interpretar respuestas SAP - CORREGIDA PARA STRINGS JSON
  const interpretSAPResponse = useCallback((sapResponse: any) => {
    if (!sapResponse) {
      return { success: false, message: 'Respuesta SAP vacía', status: 'ERROR' };
    }

    // Si la respuesta es string "PENDING"
    if (typeof sapResponse === 'string' && sapResponse === 'PENDING') {
      return { success: false, message: 'Cliente pendiente de procesamiento', status: 'PENDING' };
    }

    // Si la respuesta es string "ERROR"
    if (typeof sapResponse === 'string' && sapResponse === 'ERROR') {
      return { success: false, message: 'Error en procesamiento SAP', status: 'ERROR' };
    }

    // AQUÍ ESTÁ LA CORRECCIÓN: Parsear string JSON primero
    let parsedResponse = sapResponse;
    if (typeof sapResponse === 'string') {
      try {
        parsedResponse = JSON.parse(sapResponse);
      } catch (e) {
        console.error('Error parseando respuesta SAP:', sapResponse, e);
        return { success: false, message: 'Formato de respuesta SAP inválido', status: 'ERROR' };
      }
    }

    // Si después del parseo sigue siendo string, intentar procesar como mensaje directo
    if (typeof parsedResponse === 'string') {
      // Podría ser un mensaje directo de error o éxito
      return {
        success: false,
        message: parsedResponse || 'Respuesta SAP como string sin contenido',
        status: 'ERROR'
      };
    }

    // Verificar que parsedResponse sea un objeto
    if (!parsedResponse || typeof parsedResponse !== 'object') {
      return { success: false, message: 'Respuesta SAP no es un objeto válido', status: 'ERROR' };
    }

    // ESTRUCTURA PRINCIPAL: {"RESP":{"CODE":0,"TEXT":"OK"}}
    if (parsedResponse.RESP && parsedResponse.RESP.CODE !== undefined) {
      const respData = parsedResponse.RESP;

      // Convertir CODE a número para comparación segura
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

    // ESTRUCTURA ALTERNATIVA (array): {"RESP":[{"CODE":"0","TEXT":"OK"}]}
    if (parsedResponse.RESP && Array.isArray(parsedResponse.RESP)) {
      const responses = parsedResponse.RESP;

      // Buscar errores (CODE !== "0" o CODE !== 0)
      const errors = responses.filter((resp: any) => {
        const code = Number(resp.CODE);
        return code !== 0;
      });

      const successes = responses.filter((resp: any) => {
        const code = Number(resp.CODE);
        return code === 0;
      });

      if (errors.length > 0) {
        // Hay errores, tomar el primer error para mostrar
        const firstError = errors[0];
        return {
          success: false,
          message: firstError.TEXT || 'Error desconocido en SAP',
          status: 'ERROR',
          details: errors.map(e => e.TEXT).join(', ')
        };
      } else if (successes.length > 0) {
        // Solo éxitos
        const firstSuccess = successes[0];
        return {
          success: true,
          message: firstSuccess.TEXT || 'Cliente creado exitosamente',
          status: 'CREATED',
          details: successes.map(s => s.TEXT).join(', ')
        };
      }
    }

    // ESTRUCTURA DIRECTA (sin RESP): {"CODE":0,"TEXT":"OK"}
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

    // Fallback: si no se puede interpretar
    console.warn('Formato de respuesta SAP no reconocido:', parsedResponse);
    return { success: false, message: 'Formato de respuesta SAP no reconocido', status: 'ERROR' };
  }, []);

  // Función optimizada para mostrar notificaciones
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

  // Función optimizada para obtener clientes
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/apiSAPClientGetAll');
      if (response.ok) {
        const data = await response.json();

        // DEBUG: Ver qué contiene creation_response
        console.log('Clientes de BD:', data.clients?.slice(0, 3).map(c => ({
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

  // Función para determinar el estado del cliente basado en creation_response
  const getClientStatus = useCallback((client: SAPClient) => {
    if (!client.creation_response || client.creation_response === 'PENDING') {
      return { status: 'pending', text: 'Pendiente', color: 'yellow' };
    }

    if (client.creation_response === 'ERROR') {
      return { status: 'error', text: 'Error', color: 'red' };
    }

    // Interpretar la respuesta SAP para determinar el estado real
    const interpretation = interpretSAPResponse(client.creation_response);

    if (interpretation.success) {
      return { status: 'created', text: 'Creado en SAP', color: 'green' };
    } else {
      return { status: 'error', text: 'Error SAP', color: 'red' };
    }
  }, [interpretSAPResponse]);

  // Función optimizada para crear cliente individual
  const createSingleClient = useCallback(async (clientId: number) => {
    setProcessingIds(prev => new Set(prev).add(clientId));

    try {
      const response = await fetch('/api/apiSAPClientCreator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          authorized_by: 'Admin'
        })
      });

      const result: SAPResponse = await response.json();

      // Interpretar la respuesta SAP
      const interpretation = interpretSAPResponse(result.sap_response);

      if (interpretation.success) {
        setClients(prev => prev.map(client =>
          client.id === clientId
            ? {
              ...client,
              creation_response: JSON.stringify(result.sap_response),
              authorized_at: new Date().toISOString(),
              authorized_by: 'Admin'
            }
            : client
        ));

        setSelectedClients(prev => {
          const newSet = new Set(prev);
          newSet.delete(clientId);
          return newSet;
        });

        showNotification('success', interpretation.message);
      } else {
        // Marcar como error y guardar la respuesta para análisis
        setClients(prev => prev.map(client =>
          client.id === clientId
            ? {
              ...client,
              creation_response: JSON.stringify(result.sap_response || 'ERROR'),
              authorized_at: new Date().toISOString(),
              authorized_by: 'Admin'
            }
            : client
        ));
        showNotification('error', `Error SAP: ${interpretation.message}`);
      }
    } catch (error) {
      console.error('Error creating client in SAP:', error);
      setClients(prev => prev.map(client =>
        client.id === clientId
          ? {
            ...client,
            creation_response: 'ERROR',
            authorized_at: new Date().toISOString(),
            authorized_by: 'Admin'
          }
          : client
      ));
      showNotification('error', 'Error de conexión al crear cliente en SAP');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(clientId);
        return newSet;
      });
    }
  }, [showNotification, interpretSAPResponse]);

  // Función optimizada para crear clientes en lote
  const createBulkClients = useCallback(async () => {
    if (selectedClients.size === 0) {
      showNotification('error', 'Selecciona al menos un cliente');
      return;
    }

    setBulkProcessing(true);
    const selectedArray = Array.from(selectedClients);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    const processInBatches = async (items: number[], batchSize = 3) => {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const promises = batch.map(async (clientId) => {
          try {
            const response = await fetch('/api/apiSAPClientCreator', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                client_id: clientId,
                authorized_by: 'Admin'
              })
            });

            const result: SAPResponse = await response.json();

            // Interpretar la respuesta SAP
            const interpretation = interpretSAPResponse(result.sap_response);

            if (interpretation.success) {
              successCount++;
              setClients(prev => prev.map(client =>
                client.id === clientId
                  ? {
                    ...client,
                    creation_response: JSON.stringify(result.sap_response),
                    authorized_at: new Date().toISOString(),
                    authorized_by: 'Admin'
                  }
                  : client
              ));
            } else {
              errorCount++;
              errors.push(`Cliente ${clientId}: ${interpretation.message}`);
              setClients(prev => prev.map(client =>
                client.id === clientId
                  ? {
                    ...client,
                    creation_response: JSON.stringify(result.sap_response || 'ERROR'),
                    authorized_at: new Date().toISOString(),
                    authorized_by: 'Admin'
                  }
                  : client
              ));
            }
          } catch (error) {
            errorCount++;
            errors.push(`Cliente ${clientId}: Error de conexión`);
            console.error(`Error creating client ${clientId}:`, error);
            setClients(prev => prev.map(client =>
              client.id === clientId
                ? {
                  ...client,
                  creation_response: 'ERROR',
                  authorized_at: new Date().toISOString(),
                  authorized_by: 'Admin'
                }
                : client
            ));
          }
        });

        await Promise.allSettled(promises);
      }
    };

    await processInBatches(selectedArray);

    setBulkProcessing(false);
    setSelectedClients(new Set());

    // Mostrar resumen detallado
    if (successCount > 0 && errorCount === 0) {
      showNotification('success', `✅ Todos los clientes creados exitosamente (${successCount})`);
    } else if (successCount > 0 && errorCount > 0) {
      showNotification('info', `⚠️ Proceso completado: ${successCount} exitosos, ${errorCount} errores`);
    } else if (errorCount > 0) {
      showNotification('error', `❌ Todos los clientes fallaron (${errorCount} errores)`);
    }

    // Si hay errores, mostrar el primero como ejemplo
    if (errors.length > 0) {
      setTimeout(() => {
        showNotification('error', `Ejemplo de error: ${errors[0]}`);
      }, 1000);
    }
  }, [selectedClients, showNotification, interpretSAPResponse]);

  // Funciones de selección optimizadas
  const toggleClientSelection = useCallback((clientId: number) => {
    setSelectedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  }, []);

  // Clientes filtrados usando useMemo para optimización
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      switch (filter) {
        case 'pending':
          return !client.creation_response || client.creation_response === 'PENDING';
        case 'created':
          if (!client.creation_response || client.creation_response === 'PENDING') return false;
          if (client.creation_response === 'ERROR') return false;
          // Verificar si realmente fue creado exitosamente
          const interpretation = interpretSAPResponse(client.creation_response);
          return interpretation.success;
        case 'error':
          if (client.creation_response === 'ERROR') return true;
          if (!client.creation_response || client.creation_response === 'PENDING') return false;
          // Verificar si hay error en la respuesta SAP
          const errorInterpretation = interpretSAPResponse(client.creation_response);
          return !errorInterpretation.success;
        default:
          return true;
      }
    });
  }, [clients, filter, interpretSAPResponse]);

  // Contadores optimizados
  const counts = useMemo(() => {
    const pending = clients.filter(c => !c.creation_response || c.creation_response === 'PENDING').length;

    let created = 0;
    let error = 0;

    clients.forEach(client => {
      if (!client.creation_response || client.creation_response === 'PENDING') {
        return; // Ya contado en pending
      }

      if (client.creation_response === 'ERROR') {
        error++;
        return;
      }

      // Interpretar respuesta SAP
      const interpretation = interpretSAPResponse(client.creation_response);
      if (interpretation.success) {
        created++;
      } else {
        error++;
      }
    });

    return {
      all: clients.length,
      pending,
      created,
      error
    };
  }, [clients, interpretSAPResponse]);

  const selectAll = useCallback(() => {
    const pendingClients = filteredClients.filter(client => {
      if (!client.creation_response || client.creation_response === 'PENDING') return true;
      if (client.creation_response === 'ERROR') return true;

      // Verificar si hay error en respuesta SAP (permite reintento)
      const interpretation = interpretSAPResponse(client.creation_response);
      return !interpretation.success;
    });
    setSelectedClients(new Set(pendingClients.map(c => c.id)));
  }, [filteredClients, interpretSAPResponse]);

  const clearSelection = useCallback(() => {
    setSelectedClients(new Set());
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800">
        <div className="flex justify-center items-center h-64">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/20 dark:border-slate-700/20 shadow-xl rounded-2xl p-8 flex items-center gap-4">
            <ArrowPathIcon className="w-8 h-8 text-cyan-600 dark:text-cyan-400 animate-spin" />
            <span className="text-lg font-medium text-slate-900 dark:text-white">Cargando clientes...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      {/* Notificaciones */}
      <div className="fixed top-4 right-4 z-50 max-w-96">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            type={notification.type}
            message={notification.message}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-800 dark:from-cyan-400 dark:to-cyan-600 bg-clip-text text-transparent mb-2">
          Gestión de Clientes SAP
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Administra y sincroniza clientes con SAP
        </p>
      </div>

      {/* Controles superiores */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/20 dark:border-slate-700/20 shadow-xl rounded-2xl p-6 mb-6">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold border-none cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${filter === 'all'
              ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-600/30'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
          >
            Todos ({counts.all})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold border-none cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${filter === 'pending'
              ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-600/30'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
          >
            Pendientes ({counts.pending})
          </button>
          <button
            onClick={() => setFilter('created')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold border-none cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${filter === 'created'
              ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-600/30'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
          >
            Creados ({counts.created})
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold border-none cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${filter === 'error'
              ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-600/30'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
          >
            Errores ({counts.error})
          </button>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={selectAll}
            className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer transition-all duration-200 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            Seleccionar pendientes
          </button>
          <button
            onClick={clearSelection}
            className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer transition-all duration-200 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            Limpiar selección
          </button>
          <button
            onClick={fetchClients}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer transition-all duration-200 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {/* Acciones masivas */}
        {selectedClients.size > 0 && (
          <div className="mt-6 bg-cyan-600/10 dark:bg-cyan-400/10 border border-cyan-600/20 dark:border-cyan-400/20 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
                {selectedClients.size} cliente(s) seleccionado(s)
              </span>
              <button
                onClick={createBulkClients}
                disabled={bulkProcessing}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white border-none rounded-xl font-semibold cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl shadow-cyan-600/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {bulkProcessing ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <UsersIcon className="w-5 h-5" />
                )}
                {bulkProcessing ? 'Procesando...' : 'Crear seleccionados en SAP'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de clientes */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/20 dark:border-slate-700/20 shadow-xl rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedClients.size === filteredClients.filter(c => {
                      const clientStatus = getClientStatus(c);
                      return clientStatus.status === 'pending' || clientStatus.status === 'error';
                    }).length && filteredClients.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        selectAll();
                      } else {
                        clearSelection();
                      }
                    }}
                    className="w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500 dark:focus:ring-cyan-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </th>
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

                const statusColors = {
                  pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700',
                  created: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700',
                  error: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
                };

                return (
                  <tr key={client.id} className="border-b border-slate-200/20 dark:border-slate-700/20 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedClients.has(client.id)}
                        onChange={() => toggleClientSelection(client.id)}
                        disabled={!canCreate}
                        className={`w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500 dark:focus:ring-cyan-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 ${!canCreate ? 'opacity-50' : ''}`}
                      />
                    </td>
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
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[status.status]}`}>
                          {status.text}
                        </span>
                        {/* Mostrar mensaje detallado si hay respuesta SAP */}
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
                      {canCreate && (
                        <button
                          onClick={() => createSingleClient(client.id)}
                          disabled={isProcessing}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white border-none rounded-lg font-semibold text-sm cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg shadow-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {isProcessing ? (
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserPlusIcon className="w-4 h-4" />
                          )}
                          {isProcessing ? 'Creando...' : (status.status === 'error' ? 'Reintentar' : 'Crear en SAP')}
                        </button>
                      )}
                      {status.status === 'created' && (
                        <div className="space-y-1">
                          <span className="flex items-center gap-2 font-semibold text-sm text-green-600 dark:text-green-400">
                            <CheckIcon className="w-4 h-4" />
                            Sincronizado
                          </span>
                          {client.authorized_at && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(client.authorized_at).toLocaleString('es-CL')}
                            </div>
                          )}
                        </div>
                      )}
                      {status.status === 'error' && (
                        <div className="space-y-1">
                          <span className="flex items-center gap-2 font-semibold text-sm text-red-600 dark:text-red-400">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            Error SAP
                          </span>
                          {client.creation_response &&
                            client.creation_response !== 'ERROR' &&
                            client.creation_response !== 'PENDING' && (
                              <div className="text-xs text-red-500 dark:text-red-400 max-w-32 truncate" title={interpretSAPResponse(client.creation_response).message}>
                                {interpretSAPResponse(client.creation_response).message}
                              </div>
                            )}
                        </div>
                      )}
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
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/20 dark:border-slate-700/20 shadow-xl rounded-2xl p-12 max-w-md mx-auto">
            <UsersIcon className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No hay clientes</h3>
            <p className="text-slate-600 dark:text-slate-400">
              {filter === 'all' ? 'No se encontraron clientes registrados.' : `No hay clientes con estado: ${filter}`}
            </p>
          </div>
        </div>
      )}

      {/* Estilos para animaciones personalizadas */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SAPClientManager;