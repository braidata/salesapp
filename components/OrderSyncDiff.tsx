
'use client';

import React, { useState, useMemo, useEffect } from "react";
import { Search, Filter, Download, RefreshCw, Calendar, Clock, TrendingUp, AlertCircle, ChevronUp, ChevronDown } from "lucide-react";

type Order = {
  vtex_order_id: string;
  creation_date: string;
  status: string;
  sap: {
    purchase_order: string;
    sap_order: string;
    created_at: string;
    updated_at: string;
    status: string;
    status_code: string;
  } | null;
  status_SAP: {
    STATUS: string;
    DESCP_STATUS: string;
    FECHA: number;
    HORA: number;
  } | null;
};

function parseStatusSAPDate(statusSAP: Order["status_SAP"]): Date | null {
  if (!statusSAP) return null;
  const { FECHA, HORA } = statusSAP;
  if (!FECHA || !HORA || FECHA === 0 || HORA === 0) return null;
  
  const year = Math.floor(FECHA / 10000);
  const month = Math.floor((FECHA % 10000) / 100) - 1;
  const day = FECHA % 100;
  const hour = Math.floor(HORA / 10000);
  const minute = Math.floor((HORA % 10000) / 100);
  const second = HORA % 100;
  
  if (year < 2020) return null;
  
  return new Date(year, month, day, hour, minute, second);
}

function diffHours(a: string | Date | null | undefined, b: string | Date | null | undefined): number | null {
  if (!a || !b) return null;
  const dateA = typeof a === "string" ? new Date(a) : a;
  const dateB = typeof b === "string" ? new Date(b) : b;
  if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return null;
  return Math.round((+dateB - +dateA) / (1000 * 60 * 60) * 100) / 100;
}

function formatDate(date: string | Date | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year}, ${hours}:${minutes}`;
}

function formatTimeValue(hours: number | null, mode: "hours" | "days"): string {
  if (hours === null) return "-";
  
  if (mode === "days") {
    const days = Math.round((hours / 24) * 100) / 100;
    return `${days}d`;
  }
  
  return `${hours}h`;
}

export const OrderSyncDiff: React.FC = () => {
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sapStatusFilter, setSapStatusFilter] = useState("all");
  const [statusSAPFilter, setStatusSAPFilter] = useState("Transporte Finalizado"); // Nuevo filtro por status SAP externo
  
  // Ordenamiento
  const [sortField, setSortField] = useState<string>("creation_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Modo de tiempo
  const [timeMode, setTimeMode] = useState<"hours" | "days">("hours");

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders-db-date?startDate=${startDate}&endDate=${endDate}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Error al consultar API");
      setOrders(json.data.orders);
    } catch (e: any) {
      setError(e.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    const headers = [
      "VTEX Order ID",
      "Creación VTEX",
      "Creación SAP", 
      "Modif. SAP",
      "Último Estado SAP",
      `Δ VTEX→SAP (${timeMode === "days" ? "días" : "horas"})`,
      `Δ VTEX→Modif. SAP (${timeMode === "days" ? "días" : "horas"})`,
      `Δ VTEX→Últ. Estado (${timeMode === "days" ? "días" : "horas"})`,
      "Estado VTEX",
      "Estado SAP",
      "Status SAP (ext)"
    ];

    const csvData = filteredOrders.map(order => {
      const vtexDate = order.creation_date;
      const sapCreated = order.sap?.created_at || null;
      const sapUpdated = order.sap?.updated_at || null;
      const statusSAPDate = parseStatusSAPDate(order.status_SAP);

      return [
        order.vtex_order_id,
        formatDate(vtexDate),
        formatDate(sapCreated),
        formatDate(sapUpdated),
        formatDate(statusSAPDate),
        formatTimeValue(diffHours(vtexDate, sapCreated), timeMode),
        formatTimeValue(diffHours(vtexDate, sapUpdated), timeMode),
        formatTimeValue(diffHours(vtexDate, statusSAPDate), timeMode),
        order.status,
        order.sap?.status || "-",
        order.status_SAP?.DESCP_STATUS || "-"
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sincronizacion-vtex-sap-${startDate}-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Datos filtrados y ordenados
  const filteredOrders = useMemo(() => {
    if (!mounted) return [];
    
    let filtered = orders.filter(order => {
      const matchesSearch = order.vtex_order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (order.sap?.sap_order || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesSapStatus = sapStatusFilter === "all" || (order.sap?.status || "") === sapStatusFilter;
      const matchesStatusSAP = statusSAPFilter === "all" || (order.status_SAP?.DESCP_STATUS || "") === statusSAPFilter;
      
      return matchesSearch && matchesStatus && matchesSapStatus && matchesStatusSAP;
    });

    // Ordenamiento
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "vtex_order_id":
          aValue = a.vtex_order_id;
          bValue = b.vtex_order_id;
          break;
        case "creation_date":
          aValue = new Date(a.creation_date).getTime();
          bValue = new Date(b.creation_date).getTime();
          break;
        case "sap_created":
          aValue = a.sap?.created_at ? new Date(a.sap.created_at).getTime() : 0;
          bValue = b.sap?.created_at ? new Date(b.sap.created_at).getTime() : 0;
          break;
        case "sap_updated":
          aValue = a.sap?.updated_at ? new Date(a.sap.updated_at).getTime() : 0;
          bValue = b.sap?.updated_at ? new Date(b.sap.updated_at).getTime() : 0;
          break;
        case "status_sap_date":
          aValue = parseStatusSAPDate(a.status_SAP)?.getTime() || 0;
          bValue = parseStatusSAPDate(b.status_SAP)?.getTime() || 0;
          break;
        case "vtex_to_sap":
          aValue = diffHours(a.creation_date, a.sap?.created_at) || 0;
          bValue = diffHours(b.creation_date, b.sap?.created_at) || 0;
          break;
        case "vtex_to_update":
          aValue = diffHours(a.creation_date, a.sap?.updated_at) || 0;
          bValue = diffHours(b.creation_date, b.sap?.updated_at) || 0;
          break;
        case "vtex_to_status":
          aValue = diffHours(a.creation_date, parseStatusSAPDate(a.status_SAP)) || 0;
          bValue = diffHours(b.creation_date, parseStatusSAPDate(b.status_SAP)) || 0;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "sap_status":
          aValue = a.sap?.status || "";
          bValue = b.sap?.status || "";
          break;
        case "status_sap_desc":
          aValue = a.status_SAP?.DESCP_STATUS || "";
          bValue = b.status_SAP?.DESCP_STATUS || "";
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [orders, searchTerm, statusFilter, sapStatusFilter, statusSAPFilter, sortField, sortDirection, mounted]);

  // Cálculo de métricas
  const metrics = useMemo(() => {
    if (!mounted) return { 
      totalOrders: 0, 
      ordersWithSap: 0, 
      syncRate: 0, 
      avgVtexToSap: 0, 
      avgVtexToStatus: 0, 
      avgVtexToUpdate: 0 
    };
    
    const ordersWithSap = filteredOrders.filter(o => o.sap);
    const ordersWithStatusSap = filteredOrders.filter(o => o.status_SAP);
    
    const vtexToSapTimes = ordersWithSap
      .map(o => diffHours(o.creation_date, o.sap!.created_at))
      .filter(h => h !== null) as number[];
    
    const vtexToStatusTimes = ordersWithStatusSap
      .map(o => diffHours(o.creation_date, parseStatusSAPDate(o.status_SAP)))
      .filter(h => h !== null) as number[];
    
    const vtexToUpdateTimes = ordersWithSap
      .map(o => diffHours(o.creation_date, o.sap!.updated_at))
      .filter(h => h !== null) as number[];

    const avgVtexToSap = vtexToSapTimes.length > 0 
      ? vtexToSapTimes.reduce((a, b) => a + b, 0) / vtexToSapTimes.length 
      : 0;
    
    const avgVtexToStatus = vtexToStatusTimes.length > 0 
      ? vtexToStatusTimes.reduce((a, b) => a + b, 0) / vtexToStatusTimes.length 
      : 0;
    
    const avgVtexToUpdate = vtexToUpdateTimes.length > 0 
      ? vtexToUpdateTimes.reduce((a, b) => a + b, 0) / vtexToUpdateTimes.length 
      : 0;

    return {
      totalOrders: filteredOrders.length,
      ordersWithSap: ordersWithSap.length,
      syncRate: filteredOrders.length > 0 ? (ordersWithSap.length / filteredOrders.length) * 100 : 0,
      avgVtexToSap: timeMode === "days" ? Math.round((avgVtexToSap / 24) * 100) / 100 : Math.round(avgVtexToSap * 100) / 100,
      avgVtexToStatus: timeMode === "days" ? Math.round((avgVtexToStatus / 24) * 100) / 100 : Math.round(avgVtexToStatus * 100) / 100,
      avgVtexToUpdate: timeMode === "days" ? Math.round((avgVtexToUpdate / 24) * 100) / 100 : Math.round(avgVtexToUpdate * 100) / 100
    };
  }, [filteredOrders, mounted, timeMode]);

  // Opciones únicas para filtros
  const statusOptions = [...new Set(orders.map(o => o.status))];
  const sapStatusOptions = [...new Set(orders.map(o => o.sap?.status).filter(Boolean))];
  const statusSAPOptions = [...new Set(orders.map(o => o.status_SAP?.DESCP_STATUS).filter(Boolean))];

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th 
      className="text-left p-4 text-slate-300 font-medium cursor-pointer hover:text-emerald-400 transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortField === field && (
          sortDirection === "asc" ? 
            <ChevronUp className="w-4 h-4" /> : 
            <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </th>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="w-full p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-400 mb-2">
            DIFERENCIAS DE SINCRONIZACIÓN VTEX/SAP
          </h1>
          <p className="text-slate-400">Monitoreo en tiempo real de sincronización de pedidos</p>
        </div>

        {/* Controles de fecha */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 min-w-0">
              <label className="block text-sm text-slate-300 mb-2">Fecha inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-sm text-slate-300 mb-2">Fecha fin</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 px-6 py-2 rounded font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? "Cargando..." : "Buscar"}
            </button>
          </div>
        </div>

        {/* Métricas Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 text-sm font-medium">Total Pedidos</h3>
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{metrics.totalOrders}</div>
            <div className="text-xs text-slate-400 mt-1">En rango seleccionado</div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 text-sm font-medium">Tasa Sincronización</h3>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{metrics.syncRate.toFixed(1)}%</div>
            <div className="text-xs text-slate-400 mt-1">{metrics.ordersWithSap} de {metrics.totalOrders} sincronizados</div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 text-sm font-medium">Promedio VTEX→SAP</h3>
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {metrics.avgVtexToSap}{timeMode === "days" ? "d" : "h"}
            </div>
            <div className="text-xs text-slate-400 mt-1">Tiempo promedio de creación</div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 text-sm font-medium">Promedio →Estado SAP</h3>
              <AlertCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {metrics.avgVtexToStatus}{timeMode === "days" ? "d" : "h"}
            </div>
            <div className="text-xs text-slate-400 mt-1">Tiempo a último estado</div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Filtros y controles */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por Order ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded pl-10 pr-4 py-2 text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
              >
                <option value="all">Todos los estados VTEX</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>

              <select
                value={sapStatusFilter}
                onChange={e => setSapStatusFilter(e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
              >
                <option value="all">Todos los estados SAP</option>
                {sapStatusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>

              <select
                value={statusSAPFilter}
                onChange={e => setStatusSAPFilter(e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:border-emerald-400 focus:outline-none"
              >
                <option value="all">Todos los Status SAP</option>
                {statusSAPOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Controles */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button 
                onClick={() => setTimeMode(timeMode === "hours" ? "days" : "hours")}
                className={`flex-1 px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors ${
                  timeMode === "days" 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                    : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                }`}
              >
                <Clock className="w-4 h-4" />
                {timeMode === "hours" ? "Cambiar a Días" : "Cambiar a Horas"}
              </button>
              
              <button 
                onClick={exportToCSV}
                className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
              
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setSapStatusFilter("all");
                  setStatusSAPFilter("all");
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <SortableHeader field="vtex_order_id">Order ID</SortableHeader>
                  <SortableHeader field="creation_date">Creación VTEX</SortableHeader>
                  <SortableHeader field="sap_created">Creación SAP</SortableHeader>
                  <SortableHeader field="sap_updated">Modif. SAP</SortableHeader>
                  <SortableHeader field="status_sap_date">Último Estado</SortableHeader>
                  <SortableHeader field="vtex_to_sap">
                    Δ VTEX→SAP ({timeMode === "days" ? "d" : "h"})
                  </SortableHeader>
                  <SortableHeader field="vtex_to_update">
                    Δ VTEX→Modif ({timeMode === "days" ? "d" : "h"})
                  </SortableHeader>
                  <SortableHeader field="vtex_to_status">
                    Δ VTEX→Estado ({timeMode === "days" ? "d" : "h"})
                  </SortableHeader>
                  <SortableHeader field="status">Estado VTEX</SortableHeader>
                  <SortableHeader field="sap_status">Estado SAP</SortableHeader>
                  <SortableHeader field="status_sap_desc">Status SAP</SortableHeader>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 && !loading && (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      No hay resultados para los filtros seleccionados.
                    </td>
                  </tr>
                )}
                {filteredOrders.map((order, i) => {
                  const vtexDate = order.creation_date;
                  const sapCreated = order.sap?.created_at || null;
                  const sapUpdated = order.sap?.updated_at || null;
                  const statusSAPDate = parseStatusSAPDate(order.status_SAP);

                  return (
                    <tr key={order.vtex_order_id} className={`border-t border-slate-700 hover:bg-slate-700 transition-colors ${i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-850'}`}>
                      <td className="p-3 font-mono text-emerald-400 text-sm whitespace-nowrap">
                        {order.vtex_order_id}
                      </td>
                      <td className="p-3 text-slate-300 text-sm whitespace-nowrap">
                        {mounted ? formatDate(vtexDate) : "-"}
                      </td>
                      <td className="p-3 text-slate-300 text-sm whitespace-nowrap">
                        {mounted ? formatDate(sapCreated) : "-"}
                      </td>
                      <td className="p-3 text-slate-300 text-sm whitespace-nowrap">
                        {mounted ? formatDate(sapUpdated) : "-"}
                      </td>
                      <td className="p-3 text-slate-300 text-sm whitespace-nowrap">
                        {mounted ? formatDate(statusSAPDate) : "-"}
                      </td>
                      <td className="p-3 text-slate-300 text-sm whitespace-nowrap">
                        {mounted ? formatTimeValue(diffHours(vtexDate, sapCreated), timeMode) : "-"}
                      </td>
                      <td className="p-3 text-slate-300 text-sm whitespace-nowrap">
                        {mounted ? formatTimeValue(diffHours(vtexDate, sapUpdated), timeMode) : "-"}
                      </td>
                      <td className="p-3 text-slate-300 text-sm whitespace-nowrap">
                        {mounted ? formatTimeValue(diffHours(vtexDate, statusSAPDate), timeMode) : "-"}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded text-xs bg-blue-900 text-blue-300 whitespace-nowrap">
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded text-xs bg-green-900 text-green-300 whitespace-nowrap">
                          {order.sap?.status || "-"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300 text-sm">
                        {order.status_SAP?.DESCP_STATUS || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        {mounted && (
          <div className="mt-6 text-center text-slate-400 text-sm">
            Mostrando {filteredOrders.length} de {orders.length} registros • 
            Última actualización: {new Date().toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSyncDiff;