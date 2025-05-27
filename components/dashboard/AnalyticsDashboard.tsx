// components/Dashboard/AnalyticsDashboard.tsx
'use client'

import React, { useEffect, useState, useRef, useCallback } from "react";
import AdsAnalyticsDashboard from "./AdsAPIAnalytics";
import LoadingState from './ui/LoadingState';
import {
  RefreshCw, Maximize2, Minimize2, Info,
  Table2, BarChart3, Copy, FileText, FileIcon as FilePdf,
  ChevronDown, X, AlertTriangle, Database, TrendingUp
} from "lucide-react";

import { colors } from "./constants/colors";
import {
  chartTypeOptions, sortTypeOptions,
  dateRangeOptions, kpiCategoryOptions, kpiOptions,
  isVtexKpi, getKpiDataSource, getKpiDescription
} from "./constants/options";
import { ChartType, SortOption, ViewMode, CustomDateRange, DataPoint } from "./types";

import {
  renderChart, renderDataTable,
  exportToXLSX, exportToPDF, copyChartAsImage
} from "./ui/chartComponents";

// Enhanced hook imports
import { useAnalyticsData } from "./hooks/useAnalyticsData";
import { useVtexAnalytics } from './hooks/useVtexAnalytics';
import { getDefaultChartType } from "./services/dataServices";

// Enhanced error component
const ErrorDisplay: React.FC<{ error: string; kpiKey: string; onRetry?: () => void }> = ({ 
  error, kpiKey, onRetry 
}) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center p-6 rounded-lg" style={{ backgroundColor: `${colors.glass}80` }}>
      <AlertTriangle size={48} className="mx-auto mb-4" style={{ color: colors.danger }} />
      <h3 className="text-lg font-semibold mb-2" style={{ color: colors.danger }}>
        Error en {kpiKey}
      </h3>
      <p className="text-sm mb-4 opacity-80 max-w-md">
        {error}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-md text-sm flex items-center gap-2 mx-auto"
          style={{
            backgroundColor: colors.accent,
            color: colors.secondary,
            border: `1px solid ${colors.accent}`,
          }}
        >
          <RefreshCw size={16} />
          Reintentar
        </button>
      )}
    </div>
  </div>
);

// Enhanced empty state component
const EmptyState: React.FC<{ kpiKey: string; onRefresh?: () => void }> = ({ kpiKey, onRefresh }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center p-6 rounded-lg" style={{ backgroundColor: `${colors.glass}80` }}>
      <Database size={48} className="mx-auto mb-4 opacity-50" style={{ color: colors.accent }} />
      <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
        Sin datos disponibles
      </h3>
      <p className="text-sm mb-4 opacity-80 max-w-md">
        No se encontraron datos para <strong>{kpiKey}</strong> en el período seleccionado.
        Esto puede deberse a:
      </p>
      <ul className="text-xs opacity-70 mb-4 text-left max-w-sm">
        <li>• No hay datos en el rango de fechas seleccionado</li>
        <li>• El KPI requiere configuración adicional</li>
        <li>• Problemas de conectividad con la fuente de datos</li>
      </ul>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="px-4 py-2 rounded-md text-sm flex items-center gap-2 mx-auto"
          style={{
            backgroundColor: colors.glass,
            color: colors.text,
            border: `1px solid ${colors.accent}`,
          }}
        >
          <RefreshCw size={16} />
          Actualizar datos
        </button>
      )}
    </div>
  </div>
);

// Enhanced data source indicator
const DataSourceIndicator: React.FC<{ kpiKey: string; dataLength: number }> = ({ kpiKey, dataLength }) => {
  const dataSource = getKpiDataSource(kpiKey);
  
  const sourceColors = {
    sql: colors.accent,
    ga4: '#4CAF50', 
    vtex: '#FF6B35',
    ads: '#FF9800'
  };
  
  const sourceLabels = {
    sql: 'SQL',
    ga4: 'GA4',
    vtex: 'VTEX',
    ads: 'ADS'
  };
  
  return (
    <div className="flex items-center gap-2 text-xs opacity-70">
      <div 
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: sourceColors[dataSource] }}
      />
      <span>
        {sourceLabels[dataSource]} • {dataLength} registros
      </span>
    </div>
  );
};

export default function AnalyticsDashboard() {
  const [activeKpi, setActiveKpi] = useState<string>("ventaDiariaDelMes");
  const [dateRange, setDateRange] = useState<CustomDateRange>({ startDate: "7daysAgo", endDate: "today" });
  const [chartTypes, setChartTypes] = useState<Record<string, ChartType>>({});
  const [sortOptions, setSortOptions] = useState<Record<string, SortOption>>({});
  const [viewModes, setViewModes] = useState<Record<string, ViewMode>>({});
  const [showInfo, setShowInfo] = useState<Record<string, boolean>>({});
  const [kpiCategories, setKpiCategories] = useState<string>("all");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [fullscreen, setFullscreen] = useState<string | null>(null);
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Enhanced hook usage with debug info
  const {
    data,
    loading,
    error,
    fetchData,
    clearSqlCache,
    getKpiData,
    getSummary,
    applySorting,
    formatChartData,
    convertRelativeDateToISO,
    formatCurrency,
    sqlLoading, 
    sqlError,
    refreshData,
    _debug
  } = useAnalyticsData();

  // VTEX Analytics Hook
  const vtexAnalytics = useVtexAnalytics();

  const summary = getSummary(activeKpi);

  // VTEX Chart Data Conversion Function
  const getVtexChartData = useCallback((kpiKey: string): DataPoint[] => {
    const analytics = vtexAnalytics.getAnalytics();
    
    if (!analytics) {
      console.log('🛒 No VTEX analytics data available');
      return [];
    }
    
    console.log('🛒 Processing VTEX data for KPI:', kpiKey, analytics);
    
    switch (kpiKey) {
      case 'vtexVentasDiarias':
        return analytics.salesByDate?.map(item => ({
          date: item.fecha,
          value: item.valor,
          label: formatCurrency(item.valor)
        })) || [];
        
      case 'vtexVentaAcumulada':
        // Calcular venta acumulada
        if (!analytics.salesByDate) return [];
        let acumulado = 0;
        return analytics.salesByDate.map(item => {
          acumulado += item.valor;
          return {
            date: item.fecha,
            value: acumulado,
            label: formatCurrency(acumulado)
          };
        });
        
      case 'vtexPedidosDiarios':
        return analytics.ordersByDate?.map(item => ({
          date: item.fecha,
          value: item.valor,
          label: `${item.valor} pedidos`
        })) || [];
        
      case 'vtexTicketPromedio':
        // Calcular ticket promedio por día
        if (!analytics.salesByDate || !analytics.ordersByDate) return [];
        
        return analytics.salesByDate.map(ventaItem => {
          const pedidoItem = analytics.ordersByDate?.find(p => p.fecha === ventaItem.fecha);
          const ticketPromedio = pedidoItem?.valor ? ventaItem.valor / pedidoItem.valor : 0;
          
          return {
            date: ventaItem.fecha,
            value: ticketPromedio,
            label: formatCurrency(ticketPromedio)
          };
        }).filter(item => item.value > 0);
        
      case 'vtexProductosTop':
        return analytics.topProducts?.slice(0, 20).map(item => ({
          name: item.sku,
          value: item.total,
          quantity: item.cantidad,
          label: `${item.nombre || item.sku} - ${formatCurrency(item.total)}`
        })) || [];
        
      case 'vtexCategoriasTop':
        // Agrupar productos por categoría (simulado)
        if (!analytics.topProducts) return [];
        const categorias = analytics.topProducts.reduce((acc, product) => {
          const categoria = 'Categoría General'; // En un caso real, esto vendría del producto
          if (!acc[categoria]) {
            acc[categoria] = { total: 0, cantidad: 0 };
          }
          acc[categoria].total += product.total;
          acc[categoria].cantidad += product.cantidad;
          return acc;
        }, {} as Record<string, {total: number, cantidad: number}>);
        
        return Object.entries(categorias).map(([categoria, data]) => ({
          name: categoria,
          value: data.total,
          quantity: data.cantidad,
          label: `${categoria} - ${formatCurrency(data.total)}`
        }));
        
      case 'vtexMarcasTop':
        // Similar a categorías, pero por marcas
        if (!analytics.topProducts) return [];
        const marcas = analytics.topProducts.reduce((acc, product) => {
          const marca = 'Marca General'; // En un caso real, esto vendría del producto
          if (!acc[marca]) {
            acc[marca] = { total: 0, cantidad: 0 };
          }
          acc[marca].total += product.total;
          acc[marca].cantidad += product.cantidad;
          return acc;
        }, {} as Record<string, {total: number, cantidad: number}>);
        
        return Object.entries(marcas).map(([marca, data]) => ({
          name: marca,
          value: data.total,
          quantity: data.cantidad,
          label: `${marca} - ${formatCurrency(data.total)}`
        }));
        
      case 'vtexEstadosPedidos':
        // Análisis de estados (requiere datos del hook)
        if (!vtexAnalytics.data?.orders) return [];
        const estados = vtexAnalytics.data.orders.reduce((acc, order) => {
          const estado = order.statusDescription || order.status || 'Sin estado';
          acc[estado] = (acc[estado] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(estados).map(([estado, cantidad]) => ({
          name: estado,
          value: cantidad,
          label: `${estado}: ${cantidad} pedidos`
        }));
        
      case 'vtexMetodosPago':
        // Análisis de métodos de pago
        if (!vtexAnalytics.data?.orders) return [];
        const metodosPago = vtexAnalytics.data.orders.reduce((acc, order) => {
          const metodos = order.paymentData?.transactions?.flatMap(t => 
            t.payments?.map(p => p.paymentSystemName) || []
          ) || ['Sin método'];
          
          metodos.forEach(metodo => {
            if (metodo) {
              acc[metodo] = (acc[metodo] || 0) + 1;
            }
          });
          return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(metodosPago).map(([metodo, cantidad]) => ({
          name: metodo,
          value: cantidad,
          label: `${metodo}: ${cantidad} usos`
        }));
        
      case 'vtexEnvios':
        // Análisis de empresas de envío
        if (!vtexAnalytics.data?.orders) return [];
        const empresasEnvio = vtexAnalytics.data.orders.reduce((acc, order) => {
          const empresa = order.shippingData?.logisticsInfo?.[0]?.deliveryCompany || 'Sin empresa';
          acc[empresa] = (acc[empresa] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(empresasEnvio).map(([empresa, cantidad]) => ({
          name: empresa,
          value: cantidad,
          label: `${empresa}: ${cantidad} envíos`
        }));
        
      case 'vtexGeografia':
        // Análisis geográfico por región
        if (!vtexAnalytics.data?.orders) return [];
        const regiones = vtexAnalytics.data.orders.reduce((acc, order) => {
          const region = order.shippingData?.address?.state || 'Sin región';
          acc[region] = (acc[region] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(regiones).map(([region, cantidad]) => ({
          name: region,
          value: cantidad,
          label: `${region}: ${cantidad} pedidos`
        }));
        
      case 'vtexClientesCorporativos':
        // Análisis de clientes B2B vs B2C
        if (!vtexAnalytics.data?.orders) return [];
        const tiposCliente = vtexAnalytics.data.orders.reduce((acc, order) => {
          const tipo = order.clientProfileData?.isCorporate ? 'Corporativo' : 'Individual';
          acc[tipo] = (acc[tipo] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(tiposCliente).map(([tipo, cantidad]) => ({
          name: tipo,
          value: cantidad,
          label: `${tipo}: ${cantidad} pedidos`
        }));
        
      case 'vtexTiemposEntrega':
        // Análisis de tiempos de entrega estimados
        if (!vtexAnalytics.data?.orders) return [];
        const tiemposEntrega = vtexAnalytics.data.orders.reduce((acc, order) => {
          const tiempo = order.shippingData?.logisticsInfo?.[0]?.shippingEstimate || 'Sin estimado';
          acc[tiempo] = (acc[tiempo] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return Object.entries(tiemposEntrega).map(([tiempo, cantidad]) => ({
          name: tiempo,
          value: cantidad,
          label: `${tiempo}: ${cantidad} pedidos`
        }));
        
      case 'vtexCalidadDatos':
        // Métricas de calidad de datos
        if (!vtexAnalytics.data?.orders) return [];
        const metricas = [
          { 
            name: 'Pedidos con tracking', 
            value: vtexAnalytics.data.orders.filter(o => 
              o.packageAttachment?.packages?.some(p => p.trackingNumber)
            ).length 
          },
          { 
            name: 'Pedidos con factura', 
            value: vtexAnalytics.data.orders.filter(o => 
              o.packageAttachment?.packages?.some(p => p.invoiceUrl)
            ).length 
          },
          { 
            name: 'Datos completos cliente', 
            value: vtexAnalytics.data.orders.filter(o => 
              o.clientProfileData?.email && o.clientProfileData?.phone
            ).length 
          },
          { 
            name: 'Dirección completa', 
            value: vtexAnalytics.data.orders.filter(o => 
              o.shippingData?.address?.street && o.shippingData?.address?.city
            ).length 
          }
        ];
        
        return metricas.map(metrica => ({
          name: metrica.name,
          value: metrica.value,
          label: `${metrica.name}: ${metrica.value} pedidos`
        }));
        
      default:
        console.warn('🛒 Unknown VTEX KPI:', kpiKey);
        return [];
    }
  }, [vtexAnalytics, formatCurrency]);

  // Enhanced data fetching with VTEX support
  // Enhanced data fetching with VTEX support - FIXED
useEffect(() => {
  console.log(`🔄 Effect triggered for KPI: ${activeKpi}, dateRange:`, dateRange);
  
  if (isVtexKpi(activeKpi)) {
    // Para KPIs VTEX, usar el hook vtexAnalytics
    console.log('🛒 Fetching VTEX data for:', activeKpi);
    vtexAnalytics.fetchOrders(dateRange.startDate, dateRange.endDate, {
      includeDetails: true,
      forceRefresh: false
    }).catch(err => {
      console.error('VTEX fetchOrders failed:', err);
    });
  } else {
    // Para otros KPIs, usar el hook analytics normal
    fetchData(activeKpi, dateRange).catch(err => {
      console.error('fetchData failed in effect:', err);
    });
  }
}, [activeKpi, dateRange.startDate, dateRange.endDate, fetchData]); // ✅ FIJO: Solo dependencias estables

  // Debug logging
  useEffect(() => {
    if (_debug) {
      console.log('🔍 Dashboard Debug Info:', _debug);
    }
    if (vtexAnalytics._debug) {
      console.log('🛒 VTEX Debug Info:', vtexAnalytics._debug);
    }
  }, [_debug, vtexAnalytics._debug]);

  // Initialize chart type for a KPI if not set
  const getChartType = (kpiKey: string): ChartType => {
    if (!chartTypes[kpiKey]) {
      const defaultType = getDefaultChartType(kpiKey);
      setChartTypes((prev) => ({ ...prev, [kpiKey]: defaultType }));
      return defaultType;
    }
    return chartTypes[kpiKey];
  };

  // Initialize sort option for a KPI if not set
  const getSortOption = (kpiKey: string): SortOption => {
    if (!sortOptions[kpiKey]) {
      const defaultSort = [
        "ventaDiariaDelMes",
        "pedidosDiariosDelMes", 
        "ticketPromedioDelMes",
        "vtexVentasDiarias",
        "vtexPedidosDiarios",
        "vtexTicketPromedio",
        "carrosAbandonados",
        "comparativos",
        "tasaAperturaMails",
      ].includes(kpiKey)
        ? "date"
        : "value";
      setSortOptions((prev) => ({ ...prev, [kpiKey]: defaultSort }));
      return defaultSort;
    }
    return sortOptions[kpiKey];
  };

  // Initialize view mode for a KPI if not set
  const getViewMode = (kpiKey: string): ViewMode => {
    const tableDefaultKpis = [
      "tasaConversionWeb",
      "funnelConversiones", 
      "kpisDeProductos",
      "vtexProductosTop",
      "kpisPorCategoria",
      "kpisPorMarca",
      "vtexEstadosPedidos",
      "vtexMetodosPago",
      "vtexCalidadDatos"
    ];

    if (!viewModes[kpiKey]) {
      const defaultMode = tableDefaultKpis.includes(kpiKey) ? "table" : "chart";
      setViewModes((prev) => ({ ...prev, [kpiKey]: defaultMode }));
      return defaultMode;
    }
    return viewModes[kpiKey];
  };

  // Toggle info panel for a KPI
  const toggleInfo = (kpiKey: string) => {
    setShowInfo((prev) => ({ ...prev, [kpiKey]: !prev[kpiKey] }));
  };

  // Handle custom date range selection
  const handleCustomDateSubmit = () => {
    setDateRange({
      startDate: customDateRange.startDate,
      endDate: customDateRange.endDate,
    });
    setShowCustomDatePicker(false);
  };

  // Handle fullscreen mode
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullscreen(null);
      }
    };

    if (fullscreen) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [fullscreen]);

  // Enhanced chart rendering with VTEX support
  const renderChartWithControls = (kpiKey: string) => {
    const chartType = getChartType(kpiKey);
    const sortOption = getSortOption(kpiKey);
    const viewMode = getViewMode(kpiKey);

    // Enhanced data retrieval with comprehensive logging
   // Enhanced data retrieval with comprehensive logging
console.group(`📊 Rendering chart for ${kpiKey}`);

const isVtex = isVtexKpi(kpiKey);
let chartData: DataPoint[] = [];

if (isVtex) {
  console.log('🛒 Getting VTEX chart data');
  chartData = getVtexChartData(kpiKey);
} else {
  console.log('📈 Getting regular analytics data');
  chartData = getKpiData(kpiKey);
}

console.log('Chart data retrieved:', {
  isVtex,
  length: chartData?.length || 0,
  firstItem: chartData?.[0],
  isArray: Array.isArray(chartData),
  type: typeof chartData
});
    
    // Validate and sort data
    // Validate and sort data
let sortedData: DataPoint[] = [];
let dataError = null;

try {
  if (!chartData || !Array.isArray(chartData)) {
    if (isVtex && vtexAnalytics.loading) {
      console.log('🛒 VTEX data is still loading...');
      sortedData = [];
    } else {
      throw new Error(`Invalid data format: expected array, got ${typeof chartData}`);
    }
  } else if (chartData.length === 0) {
    if (isVtex && vtexAnalytics.loading) {
      console.log('🛒 VTEX data is loading, showing empty state temporarily');
    } else {
      console.log('No data available for KPI');
    }
    sortedData = [];
  } else {
    sortedData = applySorting(chartData, kpiKey, sortOption);
    console.log('Data sorted successfully:', sortedData.length, 'items');
  }
} catch (err: any) {
  console.error('Error processing chart data:', err);
  dataError = err.message;
}

    // Export handlers with error handling
    const handleExportToXLSX = () => {
      try {
        exportToXLSX(sortedData, kpiKey);
      } catch (err) {
        console.error('Export to XLSX failed:', err);
      }
    };
    
    const handleExportToPDF = () => {
      try {
        const kpiLabel = kpiOptions.find((opt) => opt.id === kpiKey)?.label || kpiKey;
        exportToPDF(kpiKey, kpiLabel);
      } catch (err) {
        console.error('Export to PDF failed:', err);
      }
    };

    const handleCopyChart = () => {
      try {
        copyChartAsImage(kpiKey);
      } catch (err) {
        console.error('Copy chart failed:', err);
      }
    };

    return (
      <div
        className={`flex flex-col h-full ${fullscreen === kpiKey ? "fixed inset-0 z-50 p-4 bg-opacity-95" : ""}`}
        style={{
          backgroundColor: fullscreen === kpiKey ? colors.background : "transparent",
          transition: "all 0.3s ease",
        }}
        ref={fullscreen === kpiKey ? chartContainerRef : null}
      >
        {/* Enhanced chart controls */}
        <div
          className="mb-4 p-2 rounded-md flex flex-wrap gap-2 items-center justify-between"
          style={{ backgroundColor: `${colors.secondary}80` }}
        >
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold mr-2">Controles:</span>

            {/* View mode toggle */}
            <button
              className={`p-1.5 rounded-md transition-all duration-200 flex items-center`}
              style={{
                backgroundColor: viewMode === "table" ? colors.accent : colors.glass,
                color: viewMode === "table" ? colors.secondary : colors.text,
                border: `1px solid ${viewMode === "table" ? colors.accent : "transparent"}`,
              }}
              onClick={() =>
                setViewModes((prev) => ({
                  ...prev,
                  [kpiKey]: viewMode === "chart" ? "table" : "chart",
                }))
              }
              title={viewMode === "chart" ? "Ver como tabla" : "Ver como gráfico"}
            >
              {viewMode === "chart" ? <Table2 size={16} /> : <BarChart3 size={16} />}
            </button>

            {/* Chart type selector (only show when in chart mode) */}
            {viewMode === "chart" && (
              <div className="flex items-center space-x-1">
                {chartTypeOptions.map((option) => (
                  <button
                    key={option.id}
                    className={`p-1.5 rounded-md transition-all duration-200 flex items-center ${chartType === option.id ? "bg-opacity-80" : "bg-opacity-20 hover:bg-opacity-40"
                      }`}
                    style={{
                      backgroundColor: chartType === option.id ? colors.accent : colors.glass,
                      color: chartType === option.id ? colors.secondary : colors.text,
                      border: `1px solid ${chartType === option.id ? colors.accent : "transparent"}`,
                    }}
                    onClick={() => setChartTypes((prev) => ({ ...prev, [kpiKey]: option.id as ChartType }))}
                    title={`Cambiar a gráfico de ${option.label}`}
                  >
                    {option.icon}
                  </button>
                ))}
              </div>
            )}

            {/* Export buttons */}
            <button
              className="px-2 py-1 text-xs rounded flex items-center gap-1"
              style={{
                backgroundColor: colors.glass,
                border: `1px solid ${colors.accent}`,
              }}
              onClick={handleExportToXLSX}
              title="Exportar datos a XLSX"
              disabled={sortedData.length === 0}
            >
              <FileText size={12} />
              <span>XLSX</span>
            </button>

            {viewMode === "chart" && (
              <>
                <button
                  className="px-2 py-1 text-xs rounded flex items-center gap-1"
                  style={{
                    backgroundColor: colors.glass,
                    border: `1px solid ${colors.accent}`,
                  }}
                  onClick={handleExportToPDF}
                  title="Exportar gráfico como PDF"
                  disabled={sortedData.length === 0}
                >
                  <FilePdf size={12} />
                  <span>PDF</span>
                </button>

                <button
                  className="px-2 py-1 text-xs rounded flex items-center gap-1"
                  style={{
                    backgroundColor: colors.glass,
                    border: `1px solid ${colors.accent}`,
                  }}
                  onClick={handleCopyChart}
                  title="Copiar gráfico como imagen"
                  disabled={sortedData.length === 0}
                >
                  <Copy size={12} />
                  <span>Copiar</span>
                </button>
              </>
            )}

            {/* Info button */}
            <button
              className="px-2 py-1 text-xs rounded flex items-center gap-1"
              style={{
                backgroundColor: showInfo[kpiKey] ? colors.accent : colors.glass,
                color: showInfo[kpiKey] ? colors.secondary : colors.text,
                border: `1px solid ${colors.accent}`,
              }}
              onClick={() => toggleInfo(kpiKey)}
              title="Ver información del KPI"
            >
              <Info size={12} />
              <span>Info</span>
            </button>

            {/* Enhanced refresh button */}
            <button
              className="px-2 py-1 text-xs rounded flex items-center gap-1"
              style={{
                backgroundColor: colors.glass,
                border: `1px solid ${colors.accent}`,
              }}
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                if (isVtex) {
                  vtexAnalytics.fetchOrders(dateRange.startDate, dateRange.endDate, { forceRefresh: true });
                } else {
                  refreshData(true);
                }
                setRefreshKey((prev) => prev + 1);
              }}
              title="Actualizar datos (limpia la caché)"
              disabled={loading || sqlLoading || vtexAnalytics.loading}
            >
              <RefreshCw size={12} className={loading || sqlLoading || vtexAnalytics.loading ? "animate-spin" : ""} />
              <span>Actualizar</span>
            </button>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Data source indicator */}
            <DataSourceIndicator kpiKey={kpiKey} dataLength={sortedData.length} />

            {/* Sort options */}
            <div className="flex items-center">
              <span className="text-xs mr-2">Ordenar:</span>
              <div className="flex items-center space-x-1">
                {sortTypeOptions.map((option) => (
                  <button
                    key={option.id}
                    className={`p-1.5 rounded-md transition-all duration-200 flex items-center ${
                      sortOption === option.id ? "bg-opacity-80" : "bg-opacity-20 hover:bg-opacity-40"
                    }`}
                    style={{
                      backgroundColor: sortOption === option.id ? colors.accent : colors.glass,
                      color: sortOption === option.id ? colors.secondary : colors.text,
                      border: `1px solid ${sortOption === option.id ? colors.accent : "transparent"}`,
                    }}
                    onClick={() => setSortOptions((prev) => ({ ...prev, [kpiKey]: option.id as SortOption }))}
                    title={`Ordenar por ${option.label}`}
                  >
                    {option.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Fullscreen toggle */}
            <button
              className="p-1.5 rounded-md transition-all duration-200"
              style={{
                backgroundColor: colors.glass,
                border: `1px solid ${colors.accent}`,
              }}
              onClick={() => setFullscreen(fullscreen === kpiKey ? null : kpiKey)}
              title={fullscreen === kpiKey ? "Salir de pantalla completa" : "Ver en pantalla completa"}
            >
              {fullscreen === kpiKey ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* Enhanced KPI info panel */}
        {showInfo[kpiKey] && (
          <div
            className="mb-4 p-4 rounded-md"
            style={{
              backgroundColor: colors.glass,
              border: `1px solid ${colors.accent}`,
              boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: colors.accent }}>
                Información del KPI: {kpiOptions.find(opt => opt.id === kpiKey)?.label || kpiKey}
              </h3>
              <DataSourceIndicator kpiKey={kpiKey} dataLength={sortedData.length} />
            </div>
            <p className="text-sm mb-3" style={{ color: colors.text }}>
              {getKpiDescription(kpiKey)}
            </p>
            
            {/* Additional debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-3">
                <summary className="text-xs opacity-70 cursor-pointer">Debug Info</summary>
                <div className="mt-2 p-2 rounded text-xs font-mono" style={{ backgroundColor: `${colors.secondary}40` }}>
                  <div>Data Length: {chartData?.length || 0}</div>
                  <div>Sorted Length: {sortedData.length}</div>
                  <div>Has Error: {dataError ? 'Yes' : 'No'}</div>
                  <div>Loading: {loading ? 'Yes' : 'No'}</div>
                  <div>SQL Loading: {sqlLoading ? 'Yes' : 'No'}</div>
                  <div>VTEX Loading: {vtexAnalytics.loading ? 'Yes' : 'No'}</div>
                </div>
              </details>
            )}
          </div>
        )}

        {/* Enhanced chart or table rendering with comprehensive error handling */}
        <div className="flex-1 min-h-[300px]">
          {loading || sqlLoading || vtexAnalytics.loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div
                  className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"
                  style={{ borderColor: `${colors.accent} transparent ${colors.accent} transparent` }}
                />
                <p className="text-sm">
                  {sqlLoading ? "Cargando datos SQL..." : vtexAnalytics.loading ? "Cargando datos VTEX..." : "Cargando datos GA4..."}
                </p>
                <p className="text-xs opacity-70 mt-1">
                  {kpiKey}
                </p>
              </div>
            </div>
          ) : error || sqlError || vtexAnalytics.error || dataError ? (
            <ErrorDisplay 
              error={error || sqlError || vtexAnalytics.error || dataError || 'Error desconocido'} 
              kpiKey={kpiKey}
              onRetry={() => {
                console.log('🔄 Retry triggered from error display');
                if (isVtex) {
                  vtexAnalytics.fetchOrders(dateRange.startDate, dateRange.endDate, { forceRefresh: true });
                } else {
                  refreshData(true);
                  fetchData(activeKpi, dateRange);
                }
              }}
            />
          ) : sortedData.length === 0 ? (
            <EmptyState 
              kpiKey={kpiKey}
              onRefresh={() => {
                console.log('🔄 Refresh triggered from empty state');
                if (isVtex) {
                  vtexAnalytics.fetchOrders(dateRange.startDate, dateRange.endDate, { forceRefresh: true });
                } else {
                  refreshData(true);
                  fetchData(activeKpi, dateRange);
                }
              }}
            />
          ) : (
            <>
              {/* Render chart or table based on view mode */}
              {viewMode === "chart"
                ? renderChart(kpiKey, chartType, sortedData, activeTooltipIndex, setActiveTooltipIndex)
                : renderDataTable(sortedData, kpiKey)
              }
              
              {/* Data summary footer */}
              <div className="mt-4 p-2 rounded" style={{ backgroundColor: `${colors.glass}40` }}>
                <div className="flex justify-between items-center text-xs opacity-70">
                  <span>{sortedData.length} registros mostrados</span>
                  <span>
                    Última actualización: {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Custom date picker modal
  const renderCustomDatePicker = () => {
    if (!showCustomDatePicker) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div
          className="rounded-lg p-4 max-w-md w-full"
          style={{
            backgroundColor: colors.secondary,
            border: `1px solid ${colors.accent}`,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`,
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold" style={{ color: colors.text }}>
              Seleccionar rango de fechas
            </h3>
            <button
              onClick={() => setShowCustomDatePicker(false)}
              className="p-1 rounded-full hover:bg-opacity-20"
              style={{ backgroundColor: `${colors.glass}50` }}
            >
              <X size={20} style={{ color: colors.text }} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: colors.text }}>
                Fecha de inicio
              </label>
              <input
                type="date"
                value={customDateRange.startDate}
                onChange={(e) => setCustomDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full p-2 rounded"
                style={{
                  backgroundColor: colors.glass,
                  color: colors.text,
                  border: `1px solid ${colors.accent}`,
                }}
              />
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: colors.text }}>
                Fecha de fin
              </label>
              <input
                type="date"
                value={customDateRange.endDate}
                onChange={(e) => setCustomDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full p-2 rounded"
                style={{
                  backgroundColor: colors.glass,
                  color: colors.text,
                  border: `1px solid ${colors.accent}`,
                }}
              />
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowCustomDatePicker(false)}
                className="px-4 py-2 rounded"
                style={{
                  backgroundColor: `${colors.glass}80`,
                  color: colors.text,
                  border: `1px solid ${colors.glass}`,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCustomDateSubmit}
                className="px-4 py-2 rounded"
                style={{
                  backgroundColor: colors.accent,
                  color: colors.secondary,
                  border: `1px solid ${colors.accent}`,
                }}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="w-full h-full min-h-screen flex flex-col"
      style={{
        background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.background} 100%)`,
        color: colors.text,
      }}
    >
      {/* Enhanced Header */}
      <header className="p-4 border-b border-opacity-20" style={{ borderColor: colors.accent }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-wider flex items-center">
              <span className="mr-2 text-3xl" style={{ color: colors.accent }}>
                ⬢
              </span>
              ECOMMERCE ANALYTICS DASHBOARD
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm opacity-70">
                {data?.metadata?.periodo.startDate} — {data?.metadata?.periodo.endDate}
              </p>
              
              {/* Enhanced status indicators */}
              <div className="flex items-center gap-2">
                {(sqlLoading || loading || vtexAnalytics.loading) && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    <span className="text-xs opacity-50">
                      {sqlLoading ? 'Cargando SQL...' : vtexAnalytics.loading ? 'Cargando VTEX...' : 'Cargando GA4...'}
                    </span>
                  </div>
                )}
                
                {(sqlError || error || vtexAnalytics.error) && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full" />
                    <span className="text-xs text-red-400">
                      Error: {sqlError || error || vtexAnalytics.error}
                    </span>
                  </div>
                )}
                
                {!loading && !sqlLoading && !vtexAnalytics.loading && !error && !sqlError && !vtexAnalytics.error && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-xs opacity-50">
                      Sistema operativo
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced date range selector */}
          <div className="flex flex-wrap gap-2">
            {dateRangeOptions.map((option) => {
              const isActive = dateRange.startDate === option.id ||
                (option.id === "custom" &&
                  dateRange.startDate !== "today" &&
                  dateRange.startDate !== "yesterday" &&
                  dateRange.startDate !== "7daysAgo" &&
                  dateRange.startDate !== "30daysAgo" &&
                  dateRange.startDate !== "2025-01-01" &&
                  dateRange.startDate !== "2020-01-01");
                  
              return (
                <button
                  key={option.id}
                  onClick={() => {
                    if (option.id === "custom") {
                      setShowCustomDatePicker(true);
                    } else {
                      setDateRange({ startDate: option.id, endDate: option.endDate });
                    }
                  }}
                  className={`px-3 py-1 text-sm rounded transition-all duration-300 ${
                    isActive ? "bg-opacity-90 shadow-lg" : "bg-opacity-20 hover:bg-opacity-40"
                  }`}
                  style={{
                    backgroundColor: isActive ? colors.accent : colors.glass,
                    color: isActive ? colors.secondary : colors.text,
                    border: `1px solid ${colors.accent}`,
                    boxShadow: isActive ? `0 0 15px ${colors.accent}40` : "none",
                  }}
                  disabled={loading || sqlLoading || vtexAnalytics.loading}
                >
                  {option.id === "custom" && (
                    <span className="flex items-center">
                      {option.label} <ChevronDown size={14} className="ml-1" />
                    </span>
                  )}
                  {option.id !== "custom" && option.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Enhanced KPI selector sidebar */}
        <div className={`${fullscreen ? "hidden" : "lg:col-span-1"} flex flex-col gap-4`}>
          <div
            className="p-4 rounded-lg backdrop-blur-md border border-opacity-20 h-full"
            style={{
              backgroundColor: colors.glass,
              borderColor: colors.accent,
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 2px ${colors.accent}40`,
            }}
          >
            <h2
              className="text-lg font-semibold mb-4 pb-2 border-b border-opacity-20"
              style={{ borderColor: colors.accent }}
            >
              Métricas Disponibles
            </h2>

            {/* KPI category filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              {kpiCategoryOptions.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setKpiCategories(category.id)}
                  className={`px-2 py-1 text-xs rounded-md transition-all duration-300 flex items-center gap-1 ${
                    kpiCategories === category.id ? "bg-opacity-90" : "bg-opacity-20 hover:bg-opacity-40"
                  }`}
                  style={{
                    backgroundColor: kpiCategories === category.id ? colors.accent : colors.glass,
                    color: kpiCategories === category.id ? colors.secondary : colors.text,
                    border: `1px solid ${kpiCategories === category.id ? colors.accent : "transparent"}`,
                  }}
                >
                  {category.icon}
                  <span>{category.label}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-300px)]">
              {kpiOptions
                .filter((option) => kpiCategories === "all" || option.category === kpiCategories)
                .map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setActiveKpi(option.id)}
                    className={`p-3 rounded-md text-left transition-all duration-300 flex items-center ${
                      activeKpi === option.id ? "bg-opacity-20 shadow-inner" : "bg-opacity-5 hover:bg-opacity-10"
                    }`}
                    style={{
                      backgroundColor: activeKpi === option.id ? colors.accent : "transparent",
                      boxShadow:
                        activeKpi === option.id
                          ? `inset 0 0 10px ${colors.accent}30, 0 0 15px ${colors.accent}20`
                          : "none",
                      border: `1px solid ${activeKpi === option.id ? colors.accent : "transparent"}`,
                    }}
                    disabled={loading || sqlLoading || vtexAnalytics.loading}
                  >
                    <span className="mr-2 text-lg" style={{ color: colors.accent }}>
                      {activeKpi === option.id ? "◉" : "○"}
                    </span>
                    <span className="mr-2">{option.icon}</span>
                    <div className="flex-1">
                      <div>{option.label}</div>
                      {activeKpi === option.id && (
                        <div className="text-xs opacity-70 mt-1">
                          <DataSourceIndicator 
                            kpiKey={option.id} 
                            dataLength={isVtexKpi(option.id) ? getVtexChartData(option.id).length : getKpiData(option.id).length} 
                          />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
            </div>

            {/* Enhanced system status */}
            <div
              className="mt-6 relative h-48 rounded-lg overflow-hidden border border-opacity-20 flex flex-col items-center justify-center p-4"
              style={{ borderColor: colors.accent, backgroundColor: `${colors.glass}20` }}
            >
              <div className="text-center">
                <div className="text-xs opacity-70 mb-2">ESTADO DEL SISTEMA</div>
                <div className="text-lg font-mono mb-2" style={{ color: colors.accent }}>
                  {new Date().toLocaleTimeString()}
                </div>
                <div className="text-xs opacity-70">
                  {loading || sqlLoading || vtexAnalytics.loading ? (
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                      Procesando...
                    </span>
                  ) : error || sqlError || vtexAnalytics.error ? (
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-400 rounded-full" />
                      Error detectado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      Operativo
                    </span>
                  )}
                </div>
                
                {/* Debug info for development */}
                {process.env.NODE_ENV === 'development' && (_debug || vtexAnalytics._debug) && (
                  <div className="mt-2 text-xs opacity-50">
                    <div>Cache: {Object.keys(_debug?.cache || {}).length} items</div>
                    <div>Data: {_debug?.rawData ? Object.keys(_debug.rawData).length : 0} KPIs</div>
                    {vtexAnalytics._debug && (
                      <div>VTEX: {vtexAnalytics._debug.lastUpdate ? 'Active' : 'Inactive'}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced main chart area */}
        <div className={`${fullscreen ? "col-span-full" : "lg:col-span-3"} flex flex-col gap-4`}>
          {/* Enhanced summary cards */}
          {!fullscreen && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* KPI Summary Card */}
              <div
                className="p-4 rounded-lg backdrop-blur-md border border-opacity-20"
                style={{
                  backgroundColor: colors.glass,
                  borderColor:
                    summary?.status === "error"
                      ? colors.danger
                      : summary?.status === "warning"
                        ? colors.warning
                        : colors.accent,
                  boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 2px ${
                    summary?.status === "error"
                      ? colors.danger
                      : summary?.status === "warning"
                        ? colors.warning
                        : colors.accent
                  }40`,
                }}
              >
                <h3 className="text-sm font-semibold opacity-70">{summary?.title}</h3>
                <div
                  className="text-3xl font-bold mt-2"
                  style={{
                    color:
                      summary?.status === "error"
                        ? colors.danger
                        : summary?.status === "warning"
                          ? colors.warning
                          : colors.accent,
                  }}
                >
                  {summary?.value}
                </div>
                <div className="text-sm mt-1 opacity-70">{summary?.subValue}</div>
              </div>

              {/* System Status Card */}
              <div
                className="p-4 rounded-lg backdrop-blur-md border border-opacity-20"
                style={{
                  backgroundColor: colors.glass,
                  borderColor: error || sqlError || vtexAnalytics.error ? colors.danger : colors.accent,
                  boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 2px ${
                    error || sqlError || vtexAnalytics.error ? colors.danger : colors.accent
                  }40`,
                }}
              >
                <h3 className="text-sm font-semibold opacity-70">Estado del Sistema</h3>
                <div
                  className="text-3xl font-bold mt-2"
                  style={{
                    color: error || sqlError || vtexAnalytics.error ? colors.danger : (loading || sqlLoading || vtexAnalytics.loading) ? colors.warning : colors.accent
                  }}
                >
                  {loading || sqlLoading || vtexAnalytics.loading ? "Cargando..." : (error || sqlError || vtexAnalytics.error) ? "Error" : "Operativo"}
                </div>
                <div className="text-sm mt-1 opacity-70">
                  {loading || sqlLoading || vtexAnalytics.loading
                    ? (sqlLoading ? "Obteniendo datos SQL..." : vtexAnalytics.loading ? "Obteniendo datos VTEX..." : "Obteniendo datos GA4...")
                    : error || sqlError || vtexAnalytics.error
                      ? `Error: ${(error || sqlError || vtexAnalytics.error)?.substring(0, 30)}...`
                      : `${data?.metadata?.kpisExitosos || 0} KPIs activos`}
                </div>
              </div>

              {/* Period Analysis Card */}
              <div
                className="p-4 rounded-lg backdrop-blur-md border border-opacity-20"
                style={{
                  backgroundColor: colors.glass,
                  borderColor: colors.accent,
                  boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 2px ${colors.accent}40`,
                }}
              >
                <h3 className="text-sm font-semibold opacity-70">Período de Análisis</h3>
                <div className="text-3xl font-bold mt-2" style={{ color: colors.accent }}>
                  {dateRange.startDate === "7daysAgo"
                    ? "7 días"
                    : dateRange.startDate === "30daysAgo"
                      ? "30 días"
                      : dateRange.startDate === "today"
                        ? "Hoy"
                        : dateRange.startDate === "yesterday"
                          ? "Ayer"
                          : dateRange.startDate === "2025-01-01"
                            ? "Este año"
                            : dateRange.startDate === "2020-01-01"
                              ? "Últimos 5 años"
                              : "Personalizado"}
                </div>
                <div className="text-sm mt-1 opacity-70">
                  {dateRange.startDate !== "today" &&
                    dateRange.startDate !== "yesterday" &&
                    dateRange.startDate !== "7daysAgo" &&
                    dateRange.startDate !== "30daysAgo" &&
                    dateRange.startDate !== "2025-01-01" &&
                    dateRange.startDate !== "2020-01-01"
                    ? `${dateRange.startDate} a ${dateRange.endDate}`
                    : `Hasta ${new Date().toLocaleDateString()}`}
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Chart Container */}
          <div
            className="flex-1 p-4 rounded-lg backdrop-blur-md border border-opacity-20 min-h-[400px]"
            style={{
              backgroundColor: colors.glass,
              borderColor: colors.accent,
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 2px ${colors.accent}40`,
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {kpiOptions.find((opt) => opt.id === activeKpi)?.label || "Gráfico"}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <DataSourceIndicator 
                    kpiKey={activeKpi} 
                    dataLength={isVtexKpi(activeKpi) ? getVtexChartData(activeKpi).length : getKpiData(activeKpi).length} 
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: colors.accent }}></div>
                <span className="text-xs opacity-70">
                  {loading || sqlLoading || vtexAnalytics.loading ? "ACTUALIZANDO..." : "DATOS EN VIVO"}
                </span>
              </div>
            </div>

            <div className="h-[400px] w-full">
              {activeKpi === "campañas" ? (
                <AdsAnalyticsDashboard
                  startDate={convertRelativeDateToISO(dateRange.startDate)}
                  endDate={convertRelativeDateToISO(dateRange.endDate)}
                />
              ) : (
                renderChartWithControls(activeKpi)
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="p-4 border-t border-opacity-20 text-sm opacity-70" style={{ borderColor: colors.accent }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span>ECOMMERCE ANALYTICS SYSTEM v2.1 - Enhanced with VTEX Integration</span>
            {process.env.NODE_ENV === 'development' && (
              <span className="text-xs opacity-50">DEV MODE</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>CLASIFICACIÓN: CONFIDENCIAL</span>
            <span className="text-xs opacity-50">
              Última actualización: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </footer>

      {/* Custom date picker modal */}
      {renderCustomDatePicker()}
    </div>
  );
}