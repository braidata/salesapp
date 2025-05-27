import React, { useEffect, useState, useRef } from "react";
import {
    RefreshCw, Maximize2, Minimize2, Info, Table2, BarChart3, Copy, 
    FileText, ChevronDown, X, TrendingUp, Users, ShoppingCart, 
    DollarSign, Target, Calendar, Activity, Zap, Eye, MousePointer,
    ShoppingBag, Package, Tag, Globe, Mail, LineChart, PieChart, BarChart
} from "lucide-react";

// CAMBIO 1: Import del hook y tipos corregidos
import { 
    useAnalyticsData, 
    DataPoint, 
    CustomDateRange 
} from '../hooks/useAnalyticsData';

// CAMBIO 2: Importar componente de campañas si existe
// import AdsAnalyticsDashboard from "./AdsAPIAnalytics";

// Rest of types
type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'doughnut';
type SortOption = 'date' | 'value' | 'alphabetical';
type ViewMode = 'chart' | 'table';

// Constants (sin cambios)
const colors = {
    primary: '#4AE3B5',
    secondary: '#0F172A',
    background: '#020617',
    text: '#F8FAFC',
    accent: '#4AE3B5',
    glass: 'rgba(255, 255, 255, 0.1)',
    grid: 'rgba(74, 227, 181, 0.2)',
    danger: '#EF4444',
    warning: '#F59E0B',
};

const chartTypeOptions = [
    { id: 'line', label: 'Línea', icon: <LineChart size={16} /> },
    { id: 'bar', label: 'Barras', icon: <BarChart size={16} /> },
    { id: 'area', label: 'Área', icon: <Activity size={16} /> },
    { id: 'pie', label: 'Circular', icon: <PieChart size={16} /> },
];

const sortTypeOptions = [
    { id: 'date', label: 'Fecha', icon: <Calendar size={16} /> },
    { id: 'value', label: 'Valor', icon: <TrendingUp size={16} /> },
    { id: 'alphabetical', label: 'Alfabético', icon: <Target size={16} /> },
];

const dateRangeOptions = [
    { id: 'today', label: 'Hoy', endDate: 'today' },
    { id: 'yesterday', label: 'Ayer', endDate: 'yesterday' },
    { id: '7daysAgo', label: 'Últimos 7 días', endDate: 'today' },
    { id: '30daysAgo', label: 'Últimos 30 días', endDate: 'today' },
    { id: '2025-01-01', label: 'Este año', endDate: 'today' },
    { id: '2020-01-01', label: 'Últimos 5 años', endDate: 'today' },
    { id: 'custom', label: 'Personalizado', endDate: 'custom' },
];

const kpiCategoryOptions = [
    { id: 'all', label: 'Todos', icon: <Globe size={14} /> },
    { id: 'sales', label: 'Ventas', icon: <DollarSign size={14} /> },
    { id: 'traffic', label: 'Tráfico', icon: <Users size={14} /> },
    { id: 'products', label: 'Productos', icon: <Package size={14} /> },
    { id: 'marketing', label: 'Marketing', icon: <Target size={14} /> },
];

// CAMBIO 3: Lista completa de KPIs (incluir TODOS los originales)
const kpiOptions = [
    // SQL KPIs
    { id: 'ventaDiariaDelMes', label: 'Venta Diaria del Mes', category: 'sales', icon: <DollarSign size={16} /> },
    { id: 'pedidosDiariosDelMes', label: 'Pedidos Diarios del Mes', category: 'sales', icon: <ShoppingCart size={16} /> },
    { id: 'ticketPromedioDelMes', label: 'Ticket Promedio del Mes', category: 'sales', icon: <TrendingUp size={16} /> },
    { id: 'ventaAcumulada', label: 'Venta Acumulada', category: 'sales', icon: <Activity size={16} /> },
    { id: 'kpisDeProductos', label: 'KPIs de Productos', category: 'products', icon: <Package size={16} /> },
    
    // GA4 KPIs (todos los que estaban en el original)
    { id: 'tasaConversionWeb', label: 'Tasa de Conversión Web', category: 'traffic', icon: <MousePointer size={16} /> },
    { id: 'funnelConversiones', label: 'Funnel de Conversiones', category: 'traffic', icon: <Users size={16} /> },
    { id: 'kpisPorCategoria', label: 'KPIs por Categoría', category: 'products', icon: <Tag size={16} /> },
    { id: 'kpisPorMarca', label: 'KPIs por Marca', category: 'products', icon: <Package size={16} /> },
    { id: 'campañas', label: 'Campañas Publicitarias', category: 'marketing', icon: <Target size={16} /> },
    { id: 'tasaAperturaMails', label: 'Tasa de Apertura de Emails', category: 'marketing', icon: <Mail size={16} /> },
    { id: 'carrosAbandonados', label: 'Carros Abandonados', category: 'sales', icon: <ShoppingBag size={16} /> },
    { id: 'comparativos', label: 'Comparativos', category: 'traffic', icon: <BarChart size={16} /> },
];

// CAMBIO 4: Función getKpiDescription completa
const getKpiDescription = (kpiKey: string): string => {
    const descriptions: Record<string, string> = {
        // SQL KPIs
        ventaDiariaDelMes: "Muestra las ventas diarias del mes actual, permitiendo identificar tendencias y patrones de comportamiento de compra.",
        pedidosDiariosDelMes: "Visualiza la cantidad de pedidos procesados por día, útil para analizar la demanda y planificar recursos.",
        ticketPromedioDelMes: "Calcula el valor promedio de compra por pedido, indicador clave para estrategias de pricing y upselling.",
        ventaAcumulada: "Presenta el total acumulado de ventas en el período, mostrando el crecimiento progresivo del negocio.",
        kpisDeProductos: "Analiza el rendimiento individual de productos por ventas totales y cantidad vendida.",
        
        // GA4 KPIs
        tasaConversionWeb: "Mide el porcentaje de visitantes que completan una compra en el sitio web.",
        funnelConversiones: "Analiza cada etapa del proceso de compra para identificar puntos de mejora.",
        kpisPorCategoria: "Compara el rendimiento de ventas entre diferentes categorías de productos.",
        kpisPorMarca: "Evalúa el desempeño de las diferentes marcas en términos de ventas y popularidad.",
        campañas: "Evalúa el rendimiento de campañas publicitarias y su retorno de inversión.",
        tasaAperturaMails: "Mide la efectividad de las campañas de email marketing basada en tasas de apertura.",
        carrosAbandonados: "Analiza los carritos de compra abandonados para identificar oportunidades de recuperación.",
        comparativos: "Compara métricas clave entre diferentes períodos para identificar tendencias."
    };
    
    return descriptions[kpiKey] || "Métrica de análisis de rendimiento del ecommerce.";
};

// Chart and DataTable components (sin cambios - mantener los que ya tienes)
const Chart: React.FC<{ 
    data: DataPoint[], 
    type: ChartType, 
    kpiKey: string 
}> = ({ data, type, kpiKey }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
        if (!canvasRef.current || !data.length) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (type === 'line' || type === 'area') {
            drawLineChart(ctx, data, canvas.width, canvas.height, type === 'area');
        } else if (type === 'bar') {
            drawBarChart(ctx, data, canvas.width, canvas.height);
        } else if (type === 'pie' || type === 'doughnut') {
            drawPieChart(ctx, data, canvas.width, canvas.height, type === 'doughnut');
        }
    }, [data, type]);
    
    const drawLineChart = (ctx: CanvasRenderingContext2D, data: DataPoint[], width: number, height: number, filled: boolean) => {
        const padding = 50;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        const maxValue = Math.max(...data.map(d => d.value));
        const minValue = Math.min(...data.map(d => d.value));
        const valueRange = maxValue - minValue || 1;
        
        // Draw grid
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight * i) / 5;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        
        // Draw line
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = padding + (chartWidth * index) / (data.length - 1);
            const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        if (filled) {
            ctx.fillStyle = `${colors.accent}30`;
            ctx.lineTo(width - padding, padding + chartHeight);
            ctx.lineTo(padding, padding + chartHeight);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.fillStyle = colors.accent;
        data.forEach((point, index) => {
            const x = padding + (chartWidth * index) / (data.length - 1);
            const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    };
    
    const drawBarChart = (ctx: CanvasRenderingContext2D, data: DataPoint[], width: number, height: number) => {
        const padding = 50;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        const maxValue = Math.max(...data.map(d => d.value));
        const barWidth = chartWidth / data.length * 0.8;
        
        data.forEach((point, index) => {
            const x = padding + (chartWidth * index) / data.length + (chartWidth / data.length - barWidth) / 2;
            const barHeight = (point.value / maxValue) * chartHeight;
            const y = padding + chartHeight - barHeight;
            
            ctx.fillStyle = colors.accent;
            ctx.fillRect(x, y, barWidth, barHeight);
        });
    };
    
    const drawPieChart = (ctx: CanvasRenderingContext2D, data: DataPoint[], width: number, height: number, isDoughnut: boolean) => {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;
        
        const total = data.reduce((sum, d) => sum + d.value, 0);
        let currentAngle = -Math.PI / 2;
        
        data.forEach((point, index) => {
            const sliceAngle = (point.value / total) * 2 * Math.PI;
            
            ctx.fillStyle = `hsl(${(index * 360) / data.length}, 70%, 60%)`;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            
            currentAngle += sliceAngle;
        });
        
        if (isDoughnut) {
            ctx.fillStyle = colors.secondary;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    };
    
    return <canvas ref={canvasRef} className="w-full h-full" />;
};

const DataTable: React.FC<{ data: DataPoint[], kpiKey: string }> = ({ data, kpiKey }) => {
    return (
        <div className="overflow-auto h-full">
            <table className="w-full text-sm">
                <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.grid}` }}>
                        <th className="text-left p-2">{data[0]?.date ? 'Fecha' : 'Nombre'}</th>
                        <th className="text-right p-2">Valor</th>
                        {data[0]?.quantity && <th className="text-right p-2">Cantidad</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, index) => (
                        <tr key={index} style={{ borderBottom: `1px solid ${colors.grid}40` }}>
                            <td className="p-2">{row.date || row.name}</td>
                            <td className="text-right p-2">{row.label}</td>
                            {row.quantity && <td className="text-right p-2">{row.quantity}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// CAMBIO 5: Componente principal actualizado
export default function AnalyticsDashboard() {
    // CAMBIO 6: Usar el hook correctamente
    const {
        data,
        loading,
        error,
        fetchData,
        refreshData,
        clearSqlCache,
        getKpiData,
        getSummary,
        applySorting,
        convertRelativeDateToISO
    } = useAnalyticsData();

    // Component states
    const [activeKpi, setActiveKpi] = useState<string>("ventaDiariaDelMes");
    const [dateRange, setDateRange] = useState({ startDate: "30daysAgo", endDate: "today" });
    const [chartTypes, setChartTypes] = useState<Record<string, ChartType>>({});
    const [sortOptions, setSortOptions] = useState<Record<string, SortOption>>({});
    const [fullscreen, setFullscreen] = useState<string | null>(null);
    const [showInfo, setShowInfo] = useState<Record<string, boolean>>({});
    const [viewModes, setViewModes] = useState<Record<string, ViewMode>>({});
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
    });
    const [kpiCategories, setKpiCategories] = useState<string>("all");
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // CAMBIO 7: Fetch data when dependencies change
    useEffect(() => {
        fetchData(activeKpi, dateRange);
    }, [activeKpi, dateRange]);
    
    // Helper functions (sin cambios)
    const getChartType = (kpiKey: string): ChartType => {
        if (!chartTypes[kpiKey]) {
            const defaultType: ChartType = kpiKey.includes('producto') || kpiKey.includes('categoria') ? 'pie' : 'line';
            setChartTypes((prev) => ({ ...prev, [kpiKey]: defaultType }));
            return defaultType;
        }
        return chartTypes[kpiKey];
    };
    
    const getSortOption = (kpiKey: string): SortOption => {
        if (!sortOptions[kpiKey]) {
            const defaultSort: SortOption = kpiKey.includes('diaria') || kpiKey.includes('acumulada') ? 'date' : 'value';
            setSortOptions((prev) => ({ ...prev, [kpiKey]: defaultSort }));
            return defaultSort;
        }
        return sortOptions[kpiKey];
    };
    
    const getViewMode = (kpiKey: string): ViewMode => {
        const tableDefaultKpis = ['tasaConversionWeb', 'funnelConversiones', 'kpisDeProductos'];
        if (!viewModes[kpiKey]) {
            const defaultMode: ViewMode = tableDefaultKpis.includes(kpiKey) ? 'table' : 'chart';
            setViewModes((prev) => ({ ...prev, [kpiKey]: defaultMode }));
            return defaultMode;
        }
        return viewModes[kpiKey];
    };
    
    const toggleInfo = (kpiKey: string) => {
        setShowInfo((prev) => ({ ...prev, [kpiKey]: !prev[kpiKey] }));
    };
    
    const handleCustomDateSubmit = () => {
        setDateRange({
            startDate: customDateRange.startDate,
            endDate: customDateRange.endDate,
        });
        setShowCustomDatePicker(false);
    };
    
    const handleRefresh = (forceToday = false) => {
        refreshData(forceToday);
        if (forceToday) {
            setDateRange({ startDate: "today", endDate: "today" });
        }
    };
    
    // CAMBIO 8: Get current KPI data using the hook
    const getCurrentKpiData = (): DataPoint[] => {
        const kpiData = getKpiData(activeKpi);
        const sortOption = getSortOption(activeKpi);
        return applySorting(kpiData, activeKpi, sortOption);
    };
    
    // CAMBIO 9: Render chart with controls actualizado
    const renderChartWithControls = (kpiKey: string) => {
        const chartType = getChartType(kpiKey);
        const sortOption = getSortOption(kpiKey);
        const viewMode = getViewMode(kpiKey);
        const sortedData = getCurrentKpiData();
        
        return (
            <div className={`flex flex-col h-full ${fullscreen === kpiKey ? "fixed inset-0 z-50 p-4 bg-opacity-95" : ""}`}
                 style={{
                     backgroundColor: fullscreen === kpiKey ? colors.background : "transparent",
                     transition: "all 0.3s ease",
                 }}>
                
                {/* Chart controls */}
                <div className="mb-4 p-2 rounded-md flex flex-wrap gap-2 items-center"
                     style={{ backgroundColor: `${colors.secondary}80` }}>
                    <span className="text-xs font-semibold mr-2">Controles:</span>
                    
                    {/* View mode toggle */}
                    <button
                        className="p-1.5 rounded-md transition-all duration-200 flex items-center"
                        style={{
                            backgroundColor: viewMode === "table" ? colors.accent : colors.glass,
                            color: viewMode === "table" ? colors.secondary : colors.text,
                            border: `1px solid ${viewMode === "table" ? colors.accent : "transparent"}`,
                        }}
                        onClick={() => setViewModes((prev) => ({
                            ...prev,
                            [kpiKey]: viewMode === "chart" ? "table" : "chart",
                        }))}
                        title={viewMode === "chart" ? "Ver como tabla" : "Ver como gráfico"}>
                        {viewMode === "chart" ? <Table2 size={16} /> : <BarChart3 size={16} />}
                    </button>
                    
                    {/* Chart type selector */}
                    {viewMode === "chart" && (
                        <div className="flex items-center space-x-1">
                            {chartTypeOptions.map((option) => (
                                <button
                                    key={option.id}
                                    className="p-1.5 rounded-md transition-all duration-200 flex items-center"
                                    style={{
                                        backgroundColor: chartType === option.id ? colors.accent : colors.glass,
                                        color: chartType === option.id ? colors.secondary : colors.text,
                                        border: `1px solid ${chartType === option.id ? colors.accent : "transparent"}`,
                                    }}
                                    onClick={() => setChartTypes((prev) => ({ ...prev, [kpiKey]: option.id as ChartType }))}
                                    title={`Cambiar a gráfico de ${option.label}`}>
                                    {option.icon}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {/* Export buttons */}
                    <button className="px-2 py-1 text-xs rounded flex items-center gap-1"
                            style={{
                                backgroundColor: colors.glass,
                                border: `1px solid ${colors.accent}`,
                            }}
                            title="Exportar datos a XLSX">
                        <FileText size={12} />
                        <span>XLSX</span>
                    </button>
                    
                    <button className="px-2 py-1 text-xs rounded flex items-center gap-1"
                            style={{
                                backgroundColor: colors.glass,
                                border: `1px solid ${colors.accent}`,
                            }}
                            title="Copiar gráfico como imagen">
                        <Copy size={12} />
                        <span>Copiar</span>
                    </button>
                    
                    {/* Info button */}
                    <button
                        className="px-2 py-1 text-xs rounded flex items-center gap-1"
                        style={{
                            backgroundColor: showInfo[kpiKey] ? colors.accent : colors.glass,
                            color: showInfo[kpiKey] ? colors.secondary : colors.text,
                            border: `1px solid ${colors.accent}`,
                        }}
                        onClick={() => toggleInfo(kpiKey)}
                        title="Ver información del KPI">
                        <Info size={12} />
                        <span>Info</span>
                    </button>
                    
                    {/* Refresh button */}
                    <button
                        className="px-2 py-1 text-xs rounded flex items-center gap-1"
                        style={{
                            backgroundColor: colors.glass,
                            border: `1px solid ${colors.accent}`,
                        }}
                        onClick={() => handleRefresh()}
                        title="Actualizar datos">
                        <RefreshCw size={12} />
                        <span>Actualizar</span>
                    </button>
                    
                    {/* Sort options */}
                    <div className="flex items-center ml-auto">
                        <span className="text-xs mr-2">Ordenar:</span>
                        <div className="flex items-center space-x-1">
                            {sortTypeOptions.map((option) => (
                                <button
                                    key={option.id}
                                    className="p-1.5 rounded-md transition-all duration-200 flex items-center"
                                    style={{
                                        backgroundColor: sortOption === option.id ? colors.accent : colors.glass,
                                        color: sortOption === option.id ? colors.secondary : colors.text,
                                        border: `1px solid ${sortOption === option.id ? colors.accent : "transparent"}`,
                                    }}
                                    onClick={() => setSortOptions((prev) => ({ ...prev, [kpiKey]: option.id as SortOption }))}>
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
                        title={fullscreen === kpiKey ? "Salir de pantalla completa" : "Ver en pantalla completa"}>
                        {fullscreen === kpiKey ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>
                
                {/* KPI info panel */}
                {showInfo[kpiKey] && (
                    <div className="mb-4 p-3 rounded-md"
                         style={{
                             backgroundColor: colors.glass,
                             border: `1px solid ${colors.accent}`,
                             boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
                         }}>
                        <h3 className="text-sm font-bold mb-2" style={{ color: colors.accent }}>
                            Acerca de este KPI
                        </h3>
                        <p className="text-sm" style={{ color: colors.text }}>
                            {getKpiDescription(kpiKey)}
                        </p>
                    </div>
                )}
                
                {/* Chart or Table */}
                <div className="flex-1 min-h-[300px]">
                    {viewMode === "chart" 
                        ? <Chart data={sortedData} type={chartType} kpiKey={kpiKey} />
                        : <DataTable data={sortedData} kpiKey={kpiKey} />
                    }
                </div>
            </div>
        );
    };

    // Radar animation (sin cambios)
    useEffect(() => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        const setCanvasDimensions = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.offsetWidth;
                canvas.height = parent.offsetHeight;
            }
        };
        
        setCanvasDimensions();
        window.addEventListener("resize", setCanvasDimensions);
        
        let angle = 0;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) * 0.9;
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let i = 1; i <= 4; i++) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, maxRadius * (i / 4), 0, Math.PI * 2);
                ctx.strokeStyle = colors.grid;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            
            ctx.beginPath();
            ctx.moveTo(centerX - maxRadius, centerY);
            ctx.lineTo(centerX + maxRadius, centerY);
            ctx.moveTo(centerX, centerY - maxRadius);
            ctx.lineTo(centerX, centerY + maxRadius);
            ctx.strokeStyle = colors.grid;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, maxRadius, angle - 0.1, angle);
            ctx.lineTo(centerX, centerY);
            ctx.fillStyle = `rgba(74, 227, 181, 0.3)`;
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + Math.cos(angle) * maxRadius, centerY + Math.sin(angle) * maxRadius);
            ctx.strokeStyle = colors.accent;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            angle += 0.01;
            if (angle > Math.PI * 2) angle = 0;
            
            requestAnimationFrame(animate);
        };
        
        const animationId = requestAnimationFrame(animate);
        
        return () => {
            window.removeEventListener("resize", setCanvasDimensions);
            cancelAnimationFrame(animationId);
        };
    }, []);
    
    // Handle escape key for fullscreen
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
    
    // Custom date picker modal
    const renderCustomDatePicker = () => {
        if (!showCustomDatePicker) return null;
        
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="rounded-lg p-4 max-w-md w-full"
                     style={{
                         backgroundColor: colors.secondary,
                         border: `1px solid ${colors.accent}`,
                         boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`,
                     }}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold" style={{ color: colors.text }}>
                            Seleccionar rango de fechas
                        </h3>
                        <button
                            onClick={() => setShowCustomDatePicker(false)}
                            className="p-1 rounded-full hover:bg-opacity-20"
                            style={{ backgroundColor: `${colors.glass}50` }}>
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
                                }}>
                                Cancelar
                            </button>
                            <button
                                onClick={handleCustomDateSubmit}
                                className="px-4 py-2 rounded"
                                style={{
                                    backgroundColor: colors.accent,
                                    color: colors.secondary,
                                    border: `1px solid ${colors.accent}`,
                                }}>
                                Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    // CAMBIO 10: Get current summary using hook
    const currentSummary = getSummary(activeKpi);
    
    return (
        <div className="w-full h-full min-h-screen flex flex-col"
             style={{
                 background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.background} 100%)`,
                 color: colors.text,
             }}>
            
            {/* Header */}
            <header className="p-4 border-b border-opacity-20" style={{ borderColor: colors.accent }}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-wider flex items-center">
                            <span className="mr-2 text-3xl" style={{ color: colors.accent }}>
                                ⬢
                            </span>
                            ECOMMERCE ANALYTICS DASHBOARD
                        </h1>
                        <p className="text-sm opacity-70">
                            {data?.metadata?.periodo.startDate || dateRange.startDate} — {data?.metadata?.periodo.endDate || dateRange.endDate}
                        </p>
                        {loading && (
                            <p className="text-xs opacity-50 mt-1">
                                Cargando datos...
                            </p>
                        )}
                        {error && (
                            <p className="text-xs text-red-400 mt-1">
                                Error: {error}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {dateRangeOptions.map((option) => (
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
                                    dateRange.startDate === option.id ||
                                    (option.id === "custom" &&
                                        !['today', 'yesterday', '7daysAgo', '30daysAgo', '2025-01-01', '2020-01-01'].includes(dateRange.startDate))
                                        ? "bg-opacity-90 shadow-lg"
                                        : "bg-opacity-20 hover:bg-opacity-40"
                                }`}
                                style={{
                                    backgroundColor:
                                        dateRange.startDate === option.id ||
                                        (option.id === "custom" &&
                                            !['today', 'yesterday', '7daysAgo', '30daysAgo', '2025-01-01', '2020-01-01'].includes(dateRange.startDate))
                                            ? colors.accent
                                            : colors.glass,
                                    color:
                                        dateRange.startDate === option.id ||
                                        (option.id === "custom" &&
                                            !['today', 'yesterday', '7daysAgo', '30daysAgo', '2025-01-01', '2020-01-01'].includes(dateRange.startDate))
                                            ? colors.secondary
                                            : colors.text,
                                    border: `1px solid ${colors.accent}`,
                                    boxShadow:
                                        dateRange.startDate === option.id ||
                                        (option.id === "custom" &&
                                            !['today', 'yesterday', '7daysAgo', '30daysAgo', '2025-01-01', '2020-01-01'].includes(dateRange.startDate))
                                            ? `0 0 15px ${colors.accent}40`
                                            : "none",
                                }}>
                                {option.id === "custom" && (
                                    <span className="flex items-center">
                                        {option.label} <ChevronDown size={14} className="ml-1" />
                                    </span>
                                )}
                                {option.id !== "custom" && option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* KPI selector sidebar */}
                <div className={`${fullscreen ? "hidden" : "lg:col-span-1"} flex flex-col gap-4`}>
                    <div className="p-4 rounded-lg backdrop-blur-md border border-opacity-20 h-full"
                         style={{
                             backgroundColor: colors.glass,
                             borderColor: colors.accent,
                             boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 2px ${colors.accent}40`,
                         }}>
                        <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-opacity-20"
                            style={{ borderColor: colors.accent }}>
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
                                    }}>
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
                                        }}>
                                        <span className="mr-2 text-lg" style={{ color: colors.accent }}>
                                            {activeKpi === option.id ? "◉" : "○"}
                                        </span>
                                        <span className="mr-2">{option.icon}</span>
                                        {option.label}
                                    </button>
                                ))}
                        </div>

                        {/* Radar animation */}
                        <div className="mt-6 relative h-48 rounded-full overflow-hidden border border-opacity-20"
                             style={{ borderColor: colors.accent }}>
                            <canvas ref={canvasRef} className="w-full h-full"></canvas>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-xs opacity-70">SISTEMA ACTIVO</div>
                                    <div className="text-lg font-mono" style={{ color: colors.accent }}>
                                        {new Date().toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main chart area */}
                <div className={`${fullscreen ? "col-span-full" : "lg:col-span-3"} flex flex-col gap-4`}>
                    {/* Summary cards */}
                    {!fullscreen && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg backdrop-blur-md border border-opacity-20"
                                 style={{
                                     backgroundColor: colors.glass,
                                     borderColor: currentSummary.status === 'error' ? colors.danger : 
                                                 currentSummary.status === 'warning' ? colors.warning : colors.accent,
                                     boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 2px ${
                                         currentSummary.status === 'error' ? colors.danger : 
                                         currentSummary.status === 'warning' ? colors.warning : colors.accent
                                     }40`,
                                 }}>
                                <h3 className="text-sm font-semibold opacity-70">{currentSummary.title}</h3>
                                <div className="text-3xl font-bold mt-2" style={{
                                    color: currentSummary.status === 'error' ? colors.danger : 
                                          currentSummary.status === 'warning' ? colors.warning : colors.accent
                                }}>
                                    {currentSummary.value}
                                </div>
                                <div className="text-sm mt-1 opacity-70">{currentSummary.subValue}</div>
                            </div>

                            <div className="p-4 rounded-lg backdrop-blur-md border border-opacity-20"
                                 style={{
                                     backgroundColor: colors.glass,
                                     borderColor: error ? colors.danger : colors.accent,
                                     boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 2px ${error ? colors.danger : colors.accent}40`,
                                 }}>
                                <h3 className="text-sm font-semibold opacity-70">Estado del Sistema</h3>
                                <div className="text-3xl font-bold mt-2" style={{ 
                                    color: error ? colors.danger : loading ? colors.warning : colors.accent 
                                }}>
                                    {loading ? "Cargando..." : error ? "Error" : "Operativo"}
                                </div>
                                <div className="text-sm mt-1 opacity-70">
                                    {loading
                                        ? "Obteniendo datos..."
                                        : error
                                            ? error
                                            : `${(data?.metadata?.kpisExitosos || 0)} KPIs activos`}
                                </div>
                            </div>

                            <div className="p-4 rounded-lg backdrop-blur-md border border-opacity-20"
                                 style={{
                                     backgroundColor: colors.glass,
                                     borderColor: colors.accent,
                                     boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 2px ${colors.accent}40`,
                                 }}>
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
                                    {!['today', 'yesterday', '7daysAgo', '30daysAgo', '2025-01-01', '2020-01-01'].includes(dateRange.startDate)
                                        ? `${dateRange.startDate} a ${dateRange.endDate}`
                                        : `Hasta ${new Date().toLocaleDateString()}`}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chart */}
                    <div className="flex-1 p-4 rounded-lg backdrop-blur-md border border-opacity-20 min-h-[400px]"
                         style={{
                             backgroundColor: colors.glass,
                             borderColor: colors.accent,
                             boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 2px ${colors.accent}40`,
                         }}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">
                                {kpiOptions.find((opt) => opt.id === activeKpi)?.label || "Gráfico"}
                            </h2>

                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: colors.accent }}></div>
                                <span className="text-xs opacity-70">DATOS EN VIVO</span>
                            </div>
                        </div>

                        <div className="h-[400px] w-full">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"
                                             style={{ borderColor: `${colors.accent} transparent ${colors.accent} transparent` }}>
                                        </div>
                                        <p className="mt-2">Cargando datos...</p>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <p className="text-xl" style={{ color: colors.danger }}>
                                            ⚠️
                                        </p>
                                        <p className="mt-2">Error al cargar datos: {error}</p>
                                        <button
                                            onClick={() => handleRefresh()}
                                            className="mt-4 px-4 py-2 rounded"
                                            style={{
                                                backgroundColor: colors.accent,
                                                color: colors.secondary,
                                            }}>
                                            Reintentar
                                        </button>
                                    </div>
                                </div>
                            ) : getCurrentKpiData().length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <div className="text-6xl mb-4" style={{ color: colors.accent }}>📊</div>
                                        <h3 className="text-xl font-semibold mb-2">
                                            Sin datos disponibles
                                        </h3>
                                        <p className="text-sm opacity-70 mb-4">
                                            No hay información para el KPI y período seleccionado
                                        </p>
                                        <button
                                            onClick={() => handleRefresh()}
                                            className="px-4 py-2 rounded"
                                            style={{
                                                backgroundColor: colors.accent,
                                                color: colors.secondary,
                                            }}>
                                            Actualizar datos
                                        </button>
                                    </div>
                                </div>
                            ) : activeKpi === "campañas" ? (
                                // CAMBIO 11: Renderizar componente de campañas si existe
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <div className="text-6xl mb-4" style={{ color: colors.accent }}>📈</div>
                                        <h3 className="text-xl font-semibold mb-2">
                                            Campañas Publicitarias
                                        </h3>
                                        <p className="text-sm opacity-70">
                                            Componente AdsAnalyticsDashboard integrado aquí
                                        </p>
                                    </div>
                                </div>
                                // Uncomment this line when AdsAnalyticsDashboard is available:
                                // <AdsAnalyticsDashboard 
                                //     startDate={convertRelativeDateToISO(dateRange.startDate)}
                                //     endDate={convertRelativeDateToISO(dateRange.endDate)}
                                // />
                            ) : (
                                renderChartWithControls(activeKpi)
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-4 border-t border-opacity-20 text-sm opacity-70" style={{ borderColor: colors.accent }}>
                <div className="flex justify-between items-center">
                    <div>ECOMMERCE ANALYTICS SYSTEM v2.0 - SQL Integration</div>
                    <div>CLASIFICACIÓN: CONFIDENCIAL</div>
                </div>
            </footer>

            {/* Custom date picker modal */}
            {renderCustomDatePicker()}
        </div>
    );
}

// Export types for external use
export type { DataPoint, ChartType, SortOption, ViewMode };