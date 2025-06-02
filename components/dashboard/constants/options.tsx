// components/Dashboard/constants/options.tsx
import React from "react";
import {
  BarChart3,
  LineChartIcon,
  PieChartIcon,
  AreaChartIcon,
  RadarIcon,
  Calendar,
  FileText,
  TrendingUp,
  SortAsc,
  SortDesc,
  Filter,
  Layers,
  Mail,
  ShoppingCart,
  Users,
  DollarSign,
  Tag,
  Percent,
  Search,
  BarChart2,
  Activity,
  Zap,
  HelpCircle,
  Package,
  Truck,
  CreditCard,
  MapPin,
  Clock,
  AlertCircle,
} from "lucide-react";

// Define chart type options
export const chartTypeOptions = [
  { id: "bar", label: "Barras", icon: <BarChart3 size={16} /> },
  { id: "line", label: "Líneas", icon: <LineChartIcon size={16} /> },
  { id: "pie", label: "Pastel", icon: <PieChartIcon size={16} /> },
  { id: "area", label: "Área", icon: <AreaChartIcon size={16} /> },
  { id: "radar", label: "Radar", icon: <RadarIcon size={16} /> },
  { id: "funnel", label: "Embudo", icon: <Filter size={16} /> },
  { id: "composed", label: "Compuesto", icon: <Layers size={16} /> },
  { id: "treemap", label: "Mapa de árbol", icon: <BarChart2 size={16} /> },
];

// Define sort type options
export const sortTypeOptions = [
  { id: "date", label: "Fecha", icon: <Calendar size={16} /> },
  { id: "value", label: "Valor", icon: <SortDesc size={16} /> },
  { id: "alphabetical", label: "Alfabético", icon: <SortAsc size={16} /> },
];

// Define date range options
export const dateRangeOptions = [
  { id: "today", label: "Hoy", endDate: "today" },
  { id: "yesterday", label: "Ayer", endDate: "yesterday" },
  { id: "7daysAgo", label: "Últimos 7 días", endDate: "today" },
  { id: "30daysAgo", label: "Últimos 30 días", endDate: "today" },
  { id: "2025-01-01", label: "Este año", endDate: "today" },
  { id: "2020-01-01", label: "Últimos 5 años", endDate: "today" },
  { id: "custom", label: "Personalizado", endDate: "custom" },
];

// Define KPI categories - ACTUALIZADO con VTEX
export const kpiCategoryOptions = [
  { id: "all", label: "Todos los KPIs", icon: <Layers size={16} /> },
  { id: "ventas", label: "Ventas", icon: <DollarSign size={16} /> },
  { id: "productos", label: "Productos", icon: <Tag size={16} /> },
  { id: "conversion", label: "Conversión", icon: <Percent size={16} /> },
  { id: "trafico", label: "Tráfico", icon: <Users size={16} /> },
  { id: "marketing", label: "Marketing", icon: <TrendingUp size={16} /> },
  { id: "vtex", label: "VTEX", icon: <Package size={16} /> }, // ✨ NUEVA CATEGORÍA
];

// Define KPI options with categories - ACTUALIZADO con KPIs VTEX
export const kpiOptions = [

   // ✨ NUEVOS KPIs VTEX
  // Ventas VTEX
  { 
    id: "vtexVentasDiarias", 
    label: "Ventas Diarias VTEX", 
    category: "vtex", 
    icon: <DollarSign size={16} />,
    description: "Ventas diarias desde VTEX - datos de órdenes facturadas"
  },
  { 
    id: "vtexPedidosDiarios", 
    label: "Pedidos Diarios VTEX", 
    category: "vtex", 
    icon: <ShoppingCart size={16} />,
    description: "Cantidad de pedidos diarios desde VTEX"
  },
  { 
    id: "vtexTicketPromedio", 
    label: "Ticket Promedio VTEX", 
    category: "vtex", 
    icon: <FileText size={16} />,
    description: "Valor promedio de pedidos desde VTEX"
  },
  { 
    id: "vtexVentaAcumulada", 
    label: "Venta Acumulada VTEX", 
    category: "vtex", 
    icon: <TrendingUp size={16} />,
    description: "Suma acumulativa de ventas VTEX"
  },

  // Productos VTEX
  { 
    id: "vtexProductosTop", 
    label: "Top Productos VTEX", 
    category: "vtex", 
    icon: <Tag size={16} />,
    description: "Productos más vendidos según datos VTEX"
  },
  { 
    id: "vtexCategoriasTop", 
    label: "Top Categorías VTEX", 
    category: "vtex", 
    icon: <Layers size={16} />,
    description: "Categorías más vendidas desde VTEX"
  },
  { 
    id: "vtexMarcasTop", 
    label: "Top Marcas VTEX", 
    category: "vtex", 
    icon: <Tag size={16} />,
    description: "Marcas más vendidas desde VTEX"
  },

  // Operacional VTEX
  { 
    id: "vtexEstadosPedidos", 
    label: "Estados de Pedidos VTEX", 
    category: "vtex", 
    icon: <AlertCircle size={16} />,
    description: "Distribución de pedidos por estado en VTEX"
  },
  { 
    id: "vtexMetodosPago", 
    label: "Métodos de Pago VTEX", 
    category: "vtex", 
    icon: <CreditCard size={16} />,
    description: "Análisis de métodos de pago desde VTEX"
  },
  { 
    id: "vtexEnvios", 
    label: "Análisis de Envíos VTEX", 
    category: "vtex", 
    icon: <Truck size={16} />,
    description: "Métricas de envío y logística desde VTEX"
  },
  { 
    id: "vtexTiemposEntrega", 
    label: "Tiempos de Entrega VTEX", 
    category: "vtex", 
    icon: <Clock size={16} />,
    description: "Análisis de tiempos de entrega desde VTEX"
  },

  // Clientes VTEX
  { 
    id: "vtexClientesCorporativos", 
    label: "Clientes Corporativos VTEX", 
    category: "vtex", 
    icon: <Users size={16} />,
    description: "Análisis de clientes B2B desde VTEX"
  },
  { 
    id: "vtexGeografia", 
    label: "Análisis Geográfico VTEX", 
    category: "vtex", 
    icon: <MapPin size={16} />,
    description: "Distribución geográfica de pedidos VTEX"
  },

  // Calidad de Datos VTEX
  { 
    id: "vtexCalidadDatos", 
    label: "Calidad de Datos VTEX", 
    category: "vtex", 
    icon: <AlertCircle size={16} />,
    description: "Métricas de calidad y completitud de datos VTEX"
  },
  // Ventas Integración
  // { id: "ventaDiariaDelMes", label: "Venta Diaria Integración", category: "ventas", icon: <DollarSign size={16} /> },
  // { id: "pedidosDiariosDelMes", label: "Pedidos Diarios Integración", category: "ventas", icon: <ShoppingCart size={16} /> },
  // { id: "ticketPromedioDelMes", label: "Ticket Promedio Integración", category: "ventas", icon: <FileText size={16} /> },
  // { id: "ventaAcumulada", label: "Venta Acumulada Integración", category: "ventas", icon: <TrendingUp size={16} /> },
  // { id: "comparativos", label: "Comparativos", category: "ventas", icon: <BarChart2 size={16} /> },

  // Productos Integración
  { id: "kpisDeProductos", label: "KPIs de Productos Integración", category: "productos", icon: <Tag size={16} /> },
  { id: "kpisPorCategoria", label: "KPIs por Categoría", category: "productos", icon: <Layers size={16} /> },
  { id: "kpisPorMarca", label: "KPIs por Marca", category: "productos", icon: <Tag size={16} /> },

  // Conversión (GA4)
  { id: "tasaConversionWeb", label: "Tasa de Conversión", category: "conversion", icon: <Percent size={16} /> },
  // { id: "funnelConversiones", label: "Funnel de Conversiones", category: "conversion", icon: <Filter size={16} /> },
  {
    id: "carrosAbandonados",
    label: "Carritos Abandonados",
    category: "conversion",
    icon: <ShoppingCart size={16} />,
  },

  // Tráfico (GA4)
  { id: "traficoPorFuente", label: "Tráfico por Fuente", category: "trafico", icon: <Activity size={16} /> },
  { id: "audiencia", label: "Audiencia", category: "trafico", icon: <Users size={16} /> },
  { id: "palabrasBuscadas", label: "Palabras Buscadas", category: "trafico", icon: <Search size={16} /> },

  // Marketing (GA4 + ADS)
  // { id: "inversionMarketing", label: "Inversión Marketing", category: "marketing", icon: <DollarSign size={16} /> },
  { id: "campañas", label: "Campañas", category: "marketing", icon: <Zap size={16} /> },
  // {
  //   id: "kpiContestabilidadCorus",
  //   label: "Contestabilidad Corus",
  //   category: "marketing",
  //   icon: <HelpCircle size={16} />,
  // },
  // { id: "clientesPerdidos", label: "Clientes Perdidos", category: "marketing", icon: <Users size={16} /> },
  // { id: "tasaAperturaMails", label: "Tasa Apertura Mails", category: "marketing", icon: <Mail size={16} /> },
  // { id: "sugerenciasMejora", label: "Sugerencias Mejora", category: "marketing", icon: <Zap size={16} /> },

 
];

// Helper function para obtener KPIs por categoría
export const getKpisByCategory = (category: string) => {
  if (category === "all") return kpiOptions;
  return kpiOptions.filter(kpi => kpi.category === category);
};

// Helper function para detectar si es KPI VTEX
export const isVtexKpi = (kpiId: string): boolean => {
  return kpiId.startsWith('vtex');
};

// Helper function para obtener fuente de datos del KPI
export const getKpiDataSource = (kpiId: string): 'sql' | 'ga4' | 'vtex' | 'ads' => {
  if (kpiId.startsWith('vtex')) return 'vtex';
  
  const sqlKpis = [
    'ventaDiariaDelMes', 
    'pedidosDiariosDelMes', 
    'ticketPromedioDelMes', 
    'ventaAcumulada', 
    'kpisDeProductos'
  ];
  
  if (sqlKpis.includes(kpiId)) return 'sql';
  
  if (kpiId === 'campañas') return 'ads';
  
  return 'ga4';
};

// Helper function para obtener descripción del KPI
export const getKpiDescription = (kpiId: string): string => {
  const kpi = kpiOptions.find(option => option.id === kpiId);
  return kpi?.description || `Información sobre ${kpi?.label || kpiId}`;
};