// Versión monolítica adaptada para consumir `/api/analitica/gaddsDeep` y soportar múltiples KPIs
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import {
  Clock, BarChart2, Globe2, Filter, Loader2,
  PieChart as PieChartIcon, RefreshCw, Calendar as CalIcon,
  Wallet, ArrowUpRight, DollarSign, ChevronDown
} from 'lucide-react';

const colors = {
  secondary: "#1a1c23",
  background: "#121317",
  text: "#e2e8f0",
  accent: "#3b82f6",
  glass: "rgba(30, 41, 59, 0.7)",
  grid: "rgba(148, 163, 184, 0.15)",
  success: "#22c55e",
  danger: "#ef4444",
  warning: "#f59e0b",
  chartColors: ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"]
};

const CLIENT_ACCOUNTS = [
  // { id: "7580380792", name: "BBQ Grill", status: 2 },
  // { id: "7400622292", name: "BLANIK", status: 2 },
  { id: "5609625109", name: "Imega Ventus", status: 2 },
  { id: "9133801156", name: "Marketing Ventus", status: 2 }
];

const KPI_OPTIONS = [
  { value: "rendimientoCampanas", label: "Campañas" },
  { value: "rendimientoAnuncios", label: "Anuncios" },
  { value: "metricsEcommerce", label: "Ecommerce" },
  { value: "metricsImpressionShare", label: "Share Impresiones" },
  { value: "rendimientoPorDispositivo", label: "Dispositivos" },
  { value: "rendimientoPorUbicacion", label: "Ubicaciones" },
  { value: "rendimientoPorHorario", label: "Horario" }
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
const formatPercent = (value) => `${value.toFixed(2)}%`;
const formatNumber = (value) => new Intl.NumberFormat('es-CL').format(value);

const GoogleAdsDeepDashboard = () => {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedKPI, setSelectedKPI] = useState('rendimientoCampanas');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { fetchData(); }, [selectedKPI]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/api/analitica/gaddsDeep?startDate=${startDate}&endDate=${endDate}`;
      if (selectedClient) url += `&clientId=${selectedClient}`;
      const res = await fetch(url);
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Error desconocido');
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const kpiData = data?.[selectedKPI];
  const items = kpiData?.aggregated?.items || [];
  const resumen = kpiData?.aggregated || {};

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: colors.secondary, color: colors.text }}>
      <div className="flex flex-wrap gap-2 items-center">
        <CalIcon size={20} />
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 rounded" style={{ backgroundColor: colors.background, color: colors.text }} />
        <span>-</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 rounded" style={{ backgroundColor: colors.background, color: colors.text }} />
        <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="p-2 rounded" style={{ backgroundColor: colors.background, color: colors.text }}>
          <option value="">Todas las cuentas</option>
          {CLIENT_ACCOUNTS.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
        <select value={selectedKPI} onChange={(e) => setSelectedKPI(e.target.value)} className="p-2 rounded" style={{ backgroundColor: colors.background, color: colors.text }}>
          {KPI_OPTIONS.map((kpi) => (
            <option key={kpi.value} value={kpi.value}>{kpi.label}</option>
          ))}
        </select>
        <button onClick={fetchData} className="px-4 py-2 rounded font-semibold flex items-center" style={{ backgroundColor: colors.accent, color: colors.secondary }}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="animate-spin h-8 w-8 mr-2" />
          <span>Cargando datos...</span>
        </div>
      )}

      {error && <div style={{ color: colors.danger }}>Error: {error}</div>}

      {kpiData && (
        <>
          <h2 className="text-xl font-bold">KPIs: {KPI_OPTIONS.find(k => k.value === selectedKPI)?.label}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded" style={{ backgroundColor: colors.glass }}>Imp: {formatNumber(resumen.totalImpressions || 0)}</div>
            <div className="p-4 rounded" style={{ backgroundColor: colors.glass }}>Clics: {formatNumber(resumen.totalClicks || 0)}</div>
            <div className="p-4 rounded" style={{ backgroundColor: colors.glass }}>Costo: {formatCurrency(resumen.totalCost || 0)}</div>
            <div className="p-4 rounded" style={{ backgroundColor: colors.glass }}>Conv.: {formatNumber(resumen.totalConversions || 0)}</div>
            <div className="p-4 rounded" style={{ backgroundColor: colors.glass }}>Tasa conv: {formatPercent(resumen.conversionRate || 0)}</div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2">Top 10</h3>
            <div className="overflow-x-auto">
              <table className="table-auto w-full text-sm">
                <thead>
                  <tr>
                    <th className="p-2 text-left">Nombre</th>
                    <th className="p-2 text-right">Imp.</th>
                    <th className="p-2 text-right">Clics</th>
                    <th className="p-2 text-right">Conv.</th>
                    <th className="p-2 text-right">Costo</th>
                    <th className="p-2 text-right">Tasa Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, 10).map((item, idx) => (
                    <tr key={idx} className={idx % 2 ? "bg-zinc-800" : undefined}>
                      <td className="p-2 text-left">{item.name}</td>
                      <td className="p-2 text-right">{formatNumber(item.impressions)}</td>
                      <td className="p-2 text-right">{formatNumber(item.clicks)}</td>
                      <td className="p-2 text-right">{formatNumber(item.conversions)}</td>
                      <td className="p-2 text-right">{formatCurrency(item.cost)}</td>
                      <td className="p-2 text-right">{formatPercent(item.convRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GoogleAdsDeepDashboard;
