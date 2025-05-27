"use client"

import { useEffect, useState, useRef } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Sector,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  FunnelChart,
  Funnel,
  LabelList,
  Treemap,
} from "recharts"
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
  RefreshCw,
  Maximize2,
  Minimize2,
  Info,
  Copy,
  FileIcon as FilePdf,
  Table2,
  ChevronDown,
  X,
} from "lucide-react"

import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

// Types based on the API response
interface KPIResponse {
  success: boolean
  message: string
  metadata: {
    periodo: { startDate: string; endDate: string }
    kpisHabilitados: number
    kpisExitosos: number
  }
  data: Record<string, any>
}

// Chart type options
type ChartType = "bar" | "line" | "pie" | "area" | "radar" | "funnel" | "composed" | "treemap"

// Sort options
type SortOption = "date" | "value" | "name" | "none"

// View mode options
type ViewMode = "chart" | "table"

// Custom date range
interface CustomDateRange {
  startDate: string
  endDate: string
}


export default function AnalyticsDashboard() {
  const [data, setData] = useState<KPIResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeKpi, setActiveKpi] = useState<string>("ventaDiariaDelMes")
  const [dateRange, setDateRange] = useState({ startDate: "30daysAgo", endDate: "today" })
  const [chartTypes, setChartTypes] = useState<Record<string, ChartType>>({})
  const [sortOptions, setSortOptions] = useState<Record<string, SortOption>>({})
  const [fullscreen, setFullscreen] = useState<string | null>(null)
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showInfo, setShowInfo] = useState<Record<string, boolean>>({})
  const [viewModes, setViewModes] = useState<Record<string, ViewMode>>({})
  // Estados para caché de VTEX y paginación
  const [vtexCache, setVtexCache] = useState({
    products: null,
    orders: null,
    lastFetch: null,
    expiresAt: null
  });
  const [vtexPagination, setVtexPagination] = useState({
    products: { current: 1, total: 1, perPage: 50 },
    orders: { current: 1, total: 1, perPage: 20 }
  });
  const [vtexLoading, setVtexLoading] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  })
  const [summary, setSummary] = useState<any>(null)
  const [kpiCategories, setKpiCategories] = useState<string>("all")

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)


  const colors = {
    primary: "#0a5f70", // Teal blue
    secondary: "#1a2b32", // Dark navy
    accent: "#4ae3b5", // Neon cyan
    warning: "#ff7b00", // Orange
    danger: "#d62839", // Red
    success: "#00b894", // Green
    background: "rgba(16, 24, 32, 0.85)", // Dark translucent
    glass: "rgba(10, 25, 47, 0.65)", // Glassmorphic dark blue
    text: "#e0e7ff", // Light blue-white
    grid: "rgba(74, 227, 181, 0.15)", // Faint grid lines
    chartColors: [
      "#4ae3b5",
      "#0a5f70",
      "#ff7b00",
      "#d62839",
      "#7a04eb",
      "#3a86ff",
      "#8ac926",
      "#ffbe0b",
      "#fb5607",
      "#ff006e",
    ],
    tooltipBackground: "#1a2b32", // Dark background for tooltips
    tooltipBorder: "#4ae3b5", // Accent color for tooltip borders
    hoverHighlight: "rgba(74, 227, 181, 0.2)", // Subtle highlight for hover states
  }

  // Define chart type options
  const chartTypeOptions = [
    { id: "bar", label: "Barras", icon: <BarChart3 size={16} /> },
    { id: "line", label: "Líneas", icon: <LineChartIcon size={16} /> },
    { id: "pie", label: "Pastel", icon: <PieChartIcon size={16} /> },
    { id: "area", label: "Área", icon: <AreaChartIcon size={16} /> },
    { id: "radar", label: "Radar", icon: <RadarIcon size={16} /> },
    { id: "funnel", label: "Embudo", icon: <Filter size={16} /> },
    { id: "composed", label: "Compuesto", icon: <Layers size={16} /> },
    { id: "treemap", label: "Mapa de árbol", icon: <BarChart2 size={16} /> },
  ]

  // Define sort type options
  const sortTypeOptions = [
    { id: "date", label: "Fecha", icon: <Calendar size={16} /> },
    { id: "value", label: "Valor", icon: <SortDesc size={16} /> },
    { id: "name", label: "Nombre", icon: <SortAsc size={16} /> },
  ]

  // Define date range options
  const dateRangeOptions = [
    { id: "today", label: "Hoy", endDate: "today" },
    { id: "yesterday", label: "Ayer", endDate: "yesterday" },
    { id: "7daysAgo", label: "Últimos 7 días", endDate: "today" },
    { id: "30daysAgo", label: "Últimos 30 días", endDate: "today" },
    { id: "2025-01-01", label: "Este año", endDate: "today" },
    { id: "2020-01-01", label: "Últimos 5 años", endDate: "today" },
    { id: "custom", label: "Personalizado", endDate: "custom" },
  ]

  // Define KPI categories
  const kpiCategoryOptions = [
    { id: "all", label: "Todos los KPIs", icon: <Layers size={16} /> },
    { id: "ventas", label: "Ventas", icon: <DollarSign size={16} /> },
    { id: "productos", label: "Productos", icon: <Tag size={16} /> },
    { id: "conversion", label: "Conversión", icon: <Percent size={16} /> },
    { id: "trafico", label: "Tráfico", icon: <Users size={16} /> },
    { id: "marketing", label: "Marketing", icon: <TrendingUp size={16} /> },
  ]

  // Define KPI options with categories
  const kpiOptions = [
    // Ventas
    { id: "ventaDiariaDelMes", label: "Venta Diaria", category: "ventas", icon: <DollarSign size={16} /> },
    { id: "pedidosDiariosDelMes", label: "Pedidos Diarios", category: "ventas", icon: <ShoppingCart size={16} /> },
    { id: "ticketPromedioDelMes", label: "Ticket Promedio", category: "ventas", icon: <FileText size={16} /> },
    { id: "comparativos", label: "Comparativos", category: "ventas", icon: <BarChart2 size={16} /> },

    // Productos
    { id: "kpisDeProductos", label: "KPIs de Productos", category: "productos", icon: <Tag size={16} /> },
    { id: "kpisPorCategoria", label: "KPIs por Categoría", category: "productos", icon: <Layers size={16} /> },
    { id: "kpisPorMarca", label: "KPIs por Marca", category: "productos", icon: <Tag size={16} /> },
    {
      id: "vtexProductosStock",
      label: "Stock de Productos",
      category: "productos",
      icon: <Tag size={16} />,
    },

    // Conversión
    { id: "tasaConversionWeb", label: "Tasa de Conversión", category: "conversion", icon: <Percent size={16} /> },
    { id: "funnelConversiones", label: "Funnel de Conversiones", category: "conversion", icon: <Filter size={16} /> },
    {
      id: "carrosAbandonados",
      label: "Carritos Abandonados",
      category: "conversion",
      icon: <ShoppingCart size={16} />,
    },

    // Tráfico
    { id: "traficoPorFuente", label: "Tráfico por Fuente", category: "trafico", icon: <Activity size={16} /> },
    { id: "audiencia", label: "Audiencia", category: "trafico", icon: <Users size={16} /> },
    { id: "palabrasBuscadas", label: "Palabras Buscadas", category: "trafico", icon: <Search size={16} /> },

    // Marketing
    { id: "inversionMarketing", label: "Inversión Marketing", category: "marketing", icon: <DollarSign size={16} /> },
    { id: "campañas", label: "Campañas", category: "marketing", icon: <Zap size={16} /> },
    {
      id: "kpiContestabilidadCorus",
      label: "Contestabilidad Corus",
      category: "marketing",
      icon: <HelpCircle size={16} />,
    },
    { id: "clientesPerdidos", label: "Clientes Perdidos", category: "marketing", icon: <Users size={16} /> },
    { id: "tasaAperturaMails", label: "Tasa Apertura Mails", category: "marketing", icon: <Mail size={16} /> },
    { id: "sugerenciasMejora", label: "Sugerencias Mejora", category: "marketing", icon: <Zap size={16} /> },
  ]

  // Get default chart type for a KPI
  const getDefaultChartType = (kpiKey: string): ChartType => {
    switch (kpiKey) {
      case "ventaDiariaDelMes":
      case "pedidosDiariosDelMes":
        return "bar"
      case "ticketPromedioDelMes":
      case "comparativos":
        return "line"
      case "traficoPorFuente":
      case "kpisPorCategoria":
      case "kpisPorMarca":
        return "pie"
      case "carrosAbandonados":
      case "audiencia":
        return "area"
      case "tasaConversionWeb":
      case "kpiContestabilidadCorus":
        return "radar"
      case "funnelConversiones":
        return "funnel"
      case "inversionMarketing":
      case "campañas":
      case "tasaAperturaMails":
        return "composed"
      case "kpisDeProductos":
      case "palabrasBuscadas":
      case "clientesPerdidos":
      case "sugerenciasMejora":
        return "treemap"
      default:
        return "bar"
    }
  }

  // Initialize chart type for a KPI if not set
  const getChartType = (kpiKey: string): ChartType => {
    if (!chartTypes[kpiKey]) {
      const defaultType = getDefaultChartType(kpiKey)
      setChartTypes((prev) => ({ ...prev, [kpiKey]: defaultType }))
      return defaultType
    }
    return chartTypes[kpiKey]
  }

  // Initialize sort option for a KPI if not set
  const getSortOption = (kpiKey: string): SortOption => {
    if (!sortOptions[kpiKey]) {
      // Default to date sorting for time-series data, value for others
      const defaultSort = [
        "ventaDiariaDelMes",
        "pedidosDiariosDelMes",
        "ticketPromedioDelMes",
        "carrosAbandonados",
        "comparativos",
        "tasaAperturaMails",
      ].includes(kpiKey)
        ? "date"
        : "value"
      setSortOptions((prev) => ({ ...prev, [kpiKey]: defaultSort }))
      return defaultSort
    }
    return sortOptions[kpiKey]
  }

  // Initialize view mode for a KPI if not set
  const getViewMode = (kpiKey: string): ViewMode => {
    if (!viewModes[kpiKey]) {
      setViewModes((prev) => ({ ...prev, [kpiKey]: "chart" }))
      return "chart"
    }
    return viewModes[kpiKey]
  }

  // Toggle info panel for a KPI
  const toggleInfo = (kpiKey: string) => {
    setShowInfo((prev) => ({ ...prev, [kpiKey]: !prev[kpiKey] }))
  }

  // Handle custom date range selection
  const handleCustomDateSubmit = () => {
    setDateRange({
      startDate: customDateRange.startDate,
      endDate: customDateRange.endDate,
    })
    setShowCustomDatePicker(false)
  }

  // Fetch data from the API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/analitica/ga4-data?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        )

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const result = await response.json()
        setData(result)
        // Update summary when data is fetched
        setSummary(getSummary(activeKpi))
      } catch (err: any) {
        setError(err.message || "Failed to fetch analytics data")
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange, refreshKey, activeKpi])

  // Función para obtener lista de órdenes de VTEX con caché y paginación
  const fetchVtexOrdersList = async (startDate, endDate, page = 1, perPage = 20, forceRefresh = false) => {
    try {
      setVtexLoading(true);

      // Verificar caché si no se fuerza actualización
      const cacheKey = `orders_${startDate}_${endDate}_${page}_${perPage}`;
      const now = new Date().getTime();

      if (!forceRefresh &&
        vtexCache.orders &&
        vtexCache.lastFetch &&
        (now - vtexCache.lastFetch) < 5 * 60 * 1000 && // 5 minutos de validez
        vtexCache.orders[cacheKey]) {
        console.log("Usando caché para órdenes VTEX");
        setVtexLoading(false);
        return vtexCache.orders[cacheKey];
      }

      // Si no hay caché válida, hacer la petición
      const response = await fetch(
        `/api/vtex-orders-list?startDate=${startDate}&endDate=${endDate}&page=${page}&perPage=${perPage}`
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      // Actualizar caché
      setVtexCache(prev => ({
        ...prev,
        orders: {
          ...(prev.orders || {}),
          [cacheKey]: data
        },
        lastFetch: now,
        expiresAt: now + 5 * 60 * 1000 // 5 minutos
      }));

      // Actualizar info de paginación
      if (data.paging) {
        setVtexPagination(prev => ({
          ...prev,
          orders: {
            current: page,
            total: Math.ceil(data.paging.total / perPage) || 1,
            perPage: perPage
          }
        }));
      }

      setVtexLoading(false);
      return data;
    } catch (error) {
      console.error("Error fetching VTEX orders list:", error);
      setVtexLoading(false);
      return null;
    }
  };

  // Función para obtener productos de VTEX con caché y paginación
  const fetchVtexProducts = async (categoryId = "", brandId = "", page = 1, perPage = 50, forceRefresh = false) => {
    try {
      setVtexLoading(true);

      // Calcular valores from/to para la API de VTEX basado en la página
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      // Verificar caché si no se fuerza actualización
      const cacheKey = `products_${categoryId}_${brandId}_${from}_${to}`;
      const now = new Date().getTime();

      if (!forceRefresh &&
        vtexCache.products &&
        vtexCache.lastFetch &&
        (now - vtexCache.lastFetch) < 5 * 60 * 1000 && // 5 minutos de validez
        vtexCache.products[cacheKey]) {
        console.log("Usando caché para productos VTEX");
        setVtexLoading(false);
        return vtexCache.products[cacheKey];
      }

      // Si no hay caché válida, hacer la petición
      let url = `/api/vtex-products?from=${from}&to=${to}`;
      if (categoryId) url += `&categoryId=${categoryId}`;
      if (brandId) url += `&brandId=${brandId}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      // Actualizar caché
      setVtexCache(prev => ({
        ...prev,
        products: {
          ...(prev.products || {}),
          [cacheKey]: data
        },
        lastFetch: now,
        expiresAt: now + 5 * 60 * 1000 // 5 minutos
      }));

      // Actualizar info de paginación (estimada ya que VTEX no da total)
      const hasMorePages = data.length === perPage;
      setVtexPagination(prev => ({
        ...prev,
        products: {
          current: page,
          total: hasMorePages ? prev.products.total + 1 : page,
          perPage: perPage
        }
      }));

      setVtexLoading(false);
      return data;
    } catch (error) {
      console.error("Error fetching VTEX products:", error);
      setVtexLoading(false);
      return null;
    }
  };

  // Función para obtener datos de orden específica de VTEX con caché
  const fetchVtexOrderData = async (orderId, forceRefresh = false) => {
    try {
      // Verificar caché si no se fuerza actualización
      const cacheKey = `order_${orderId}`;
      const now = new Date().getTime();

      if (!forceRefresh &&
        vtexCache.orders &&
        vtexCache.lastFetch &&
        (now - vtexCache.lastFetch) < 5 * 60 * 1000 && // 5 minutos de validez
        vtexCache.orders[cacheKey]) {
        console.log("Usando caché para orden VTEX");
        return vtexCache.orders[cacheKey];
      }

      // Si no hay caché válida, hacer la petición
      const response = await fetch(`/api/vtex-order?orderId=${orderId}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      // Actualizar caché
      setVtexCache(prev => ({
        ...prev,
        orders: {
          ...(prev.orders || {}),
          [cacheKey]: data
        },
        lastFetch: now,
        expiresAt: now + 5 * 60 * 1000 // 5 minutos
      }));

      return data;
    } catch (error) {
      console.error("Error fetching VTEX order data:", error);
      return null;
    }
  };
  // Función para convertir fechas relativas a formato ISO
  const convertRelativeDateToISO = (dateStr) => {
    if (dateStr === "today") {
      return new Date().toISOString().split("T")[0];
    } else if (dateStr === "yesterday") {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      return date.toISOString().split("T")[0];
    } else if (dateStr === "7daysAgo") {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      return date.toISOString().split("T")[0];
    } else if (dateStr === "30daysAgo") {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      return date.toISOString().split("T")[0];
    } else if (dateStr === "2025-01-01") {
      return "2025-01-01";
    } else if (dateStr === "2020-01-01") {
      return "2020-01-01";
    }
    return dateStr; // Ya es ISO o formato personalizado
  };

  // Adaptador para transformar datos VTEX al formato de KPIs
  const adaptVtexDataToKpis = (productsData) => {
    if (!Array.isArray(productsData) || productsData.length === 0) {
      return {};
    }

    // Para kpisDeProductos
    const kpisDeProductos = {
      summary: {
        totalPurchases: productsData.length,
        totalRevenue: productsData.reduce((sum, product) => {
          const price = product.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || 0;
          return sum + price;
        }, 0),
        conversionRate: 0, // No tenemos estos datos directamente
        topProducts: productsData.map(product => ({
          name: product.productName || "Producto sin nombre",
          value: product.items?.[0]?.sellers?.[0]?.commertialOffer?.AvailableQuantity || 0,
          stock: product.items?.[0]?.sellers?.[0]?.commertialOffer?.AvailableQuantity || 0,
          price: product.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || 0,
          category: (product.categories?.[0] || "").split("/").filter(s => s).pop() || "Sin categoría",
          brand: product.brand || "Sin marca",
        }))
      }
    };

    // Para kpisPorCategoria
    const categoriesMap = new Map();
    productsData.forEach(product => {
      const categoryPath = product.categories?.[0] || "";
      const categoryParts = categoryPath.split("/").filter(s => s);
      const category = categoryParts.length > 0 ? categoryParts[categoryParts.length - 1] : "Sin categoría";

      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, {
          name: category,
          value: 0, // Contador de productos
          productos: 0, // Total de productos
          revenue: 0, // Ingresos totales de la categoría
          tasa: 0, // Para compatibilidad con el formato esperado
          métrica: "productos"
        });
      }

      const categoryData = categoriesMap.get(category);
      categoryData.productos += 1;
      categoryData.value += 1;
      categoryData.revenue += product.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || 0;
    });

    const kpisPorCategoria = {
      summary: {
        conversionRate: 0,
        topCategories: Array.from(categoriesMap.values())
      }
    };

    // Para kpisPorMarca
    const brandsMap = new Map();
    productsData.forEach(product => {
      const brand = product.brand || "Sin marca";

      if (!brandsMap.has(brand)) {
        brandsMap.set(brand, {
          name: brand,
          value: 0, // Contador de productos
          productos: 0, // Total de productos
          revenue: 0, // Ingresos totales de la marca
          tasa: 0, // Para compatibilidad con el formato esperado
          métrica: "productos"
        });
      }

      const brandData = brandsMap.get(brand);
      brandData.productos += 1;
      brandData.value += 1;
      brandData.revenue += product.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || 0;
    });

    const kpisPorMarca = {
      summary: {
        conversionRate: 0,
        topBrands: Array.from(brandsMap.values())
      }
    };

    // Para vtexProductosStock
    const vtexProductosStock = {
      vtexData: {
        products: productsData.map(product => {
          const stock = product.items?.[0]?.sellers?.[0]?.commertialOffer?.AvailableQuantity || 0;
          return {
            productName: product.productName || "Producto sin nombre",
            stock: stock,
            price: product.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || 0,
            category: (product.categories?.[0] || "").split("/").filter(s => s).pop() || "Sin categoría",
            brand: product.brand || "Sin marca",
            sku: product.productReference || "",
            value: stock // Para compatibilidad con el formato esperado
          };
        })
      }
    };

    return {
      kpisDeProductos,
      kpisPorCategoria,
      kpisPorMarca,
      vtexProductosStock
    };
  };


  // Cargar datos de VTEX cuando cambia el rango de fechas (optimizado)
  useEffect(() => {
    // Debounce para evitar múltiples llamadas a la API
    let debounceTimer;

    const loadVtexData = async () => {
      // Cancelar el temporizador si ya hay uno en curso
      clearTimeout(debounceTimer);

      // Solo ejecutar después de un breve retraso para evitar múltiples llamadas durante cambios rápidos
      debounceTimer = setTimeout(async () => {
        // Solo cargamos datos de VTEX para KPIs específicos que los necesitan
        if (
          ["ticketPromedioDelMes", "kpisDeProductos", "kpisPorCategoria", "kpisPorMarca", "vtexProductosStock"].includes(
            activeKpi,
          )
        ) {
          try {
            // Si hay una carga de VTEX en progreso, no iniciar otra
            if (vtexLoading) return;

            // Convertir formato de fecha para VTEX (YYYY-MM-DD)
            let startDateStr = convertRelativeDateToISO(dateRange.startDate);
            let endDateStr = convertRelativeDateToISO(dateRange.endDate);

            // Verificar si necesitamos actualizar la caché
            const now = new Date().getTime();
            const cacheExpired = !vtexCache.expiresAt || now > vtexCache.expiresAt;

            // Determinar si debemos forzar actualización
            const forceRefresh = cacheExpired || refreshKey > 0;

            // Cargar productos de VTEX (primera página)
            const productsData = await fetchVtexProducts("", "", 1, 50, forceRefresh);

            // Cargar órdenes de VTEX si son necesarias para el KPI actual
            let ordersData = null;
            if (activeKpi === "ticketPromedioDelMes") {
              ordersData = await fetchVtexOrdersList(startDateStr, endDateStr, 1, 20, forceRefresh);
            }

            // Si no hay productos, no hay nada que hacer
            if (!productsData || productsData.length === 0) {
              console.warn("No se obtuvieron productos VTEX");
              return;
            }

            // Adaptar los datos de VTEX al formato esperado por los KPIs
            const adaptedData = adaptVtexDataToKpis(productsData);

            // Actualizar los datos
            if (data && data.data) {
              // Crear una copia profunda (inmutable) de los datos
              const newData = {
                ...data,
                data: { ...data.data }
              };

              // Actualizar KPIs específicos

              // Para ticket promedio
              if (activeKpi === "ticketPromedioDelMes" && ordersData && newData.data.ticketPromedioDelMes) {
                newData.data.ticketPromedioDelMes.vtexData = {
                  orders: ordersData,
                  products: productsData
                };
              }

              // Para kpisDeProductos
              if ((activeKpi === "kpisDeProductos" || activeKpi === "all") &&
                adaptedData.kpisDeProductos && newData.data.kpisDeProductos) {
                newData.data.kpisDeProductos = {
                  ...newData.data.kpisDeProductos,
                  ...adaptedData.kpisDeProductos,
                  error: null // Eliminar error si existe
                };
              }

              // Para kpisPorCategoria
              if ((activeKpi === "kpisPorCategoria" || activeKpi === "all") &&
                adaptedData.kpisPorCategoria && newData.data.kpisPorCategoria) {
                newData.data.kpisPorCategoria = {
                  ...newData.data.kpisPorCategoria,
                  ...adaptedData.kpisPorCategoria,
                  error: null // Eliminar error si existe
                };
              }

              // Para kpisPorMarca
              if ((activeKpi === "kpisPorMarca" || activeKpi === "all") &&
                adaptedData.kpisPorMarca && newData.data.kpisPorMarca) {
                newData.data.kpisPorMarca = {
                  ...newData.data.kpisPorMarca,
                  ...adaptedData.kpisPorMarca,
                  error: null // Eliminar error si existe
                };
              }

              // Para vtexProductosStock
              if ((activeKpi === "vtexProductosStock" || activeKpi === "all") &&
                adaptedData.vtexProductosStock && newData.data.vtexProductosStock) {
                newData.data.vtexProductosStock = {
                  ...newData.data.vtexProductosStock,
                  ...adaptedData.vtexProductosStock,
                  error: null // Eliminar error si existe
                };
              }

              setData(newData);
            }
          } catch (error) {
            console.error("Error loading VTEX data:", error);
          }
        }
      }, 300); // 300ms de debounce
    };

    if (!loading && data) {
      loadVtexData();
    }

    // Limpiar el temporizador al desmontar
    return () => clearTimeout(debounceTimer);
  }, [dateRange, activeKpi, data, loading, refreshKey, vtexLoading, vtexCache.expiresAt]);

  // Update summary when active KPI changes
  useEffect(() => {
    if (data) {
      setSummary(getSummary(activeKpi))
    }
  }, [activeKpi, data])

  // Radar animation effect
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.offsetWidth
        canvas.height = parent.offsetHeight
      }
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Radar sweep animation
    let angle = 0
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const maxRadius = Math.min(centerX, centerY) * 0.9

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw circular grid
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath()
        ctx.arc(centerX, centerY, maxRadius * (i / 4), 0, Math.PI * 2)
        ctx.strokeStyle = colors.grid
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Draw crosshairs
      ctx.beginPath()
      ctx.moveTo(centerX - maxRadius, centerY)
      ctx.lineTo(centerX + maxRadius, centerY)
      ctx.moveTo(centerX, centerY - maxRadius)
      ctx.lineTo(centerX, centerY + maxRadius)
      ctx.strokeStyle = colors.grid
      ctx.lineWidth = 1
      ctx.stroke()

      // Draw radar sweep
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, maxRadius, angle - 0.1, angle)
      ctx.lineTo(centerX, centerY)
      ctx.fillStyle = `rgba(74, 227, 181, 0.3)`
      ctx.fill()

      // Draw radar line
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(centerX + Math.cos(angle) * maxRadius, centerY + Math.sin(angle) * maxRadius)
      ctx.strokeStyle = colors.accent
      ctx.lineWidth = 2
      ctx.stroke()

      // Update angle for next frame
      angle += 0.01
      if (angle > Math.PI * 2) angle = 0

      requestAnimationFrame(animate)
    }

    const animationId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
      cancelAnimationFrame(animationId)
    }
  }, [])

  // Handle fullscreen mode
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullscreen(null)
      }
    }

    if (fullscreen) {
      window.addEventListener("keydown", handleEsc)
    }

    return () => {
      window.removeEventListener("keydown", handleEsc)
    }
  }, [fullscreen])

  // Format data for charts based on KPI type
  const formatChartData = (kpiKey: string) => {
    if (!data || !data.data || !data.data[kpiKey]) return []

    const kpiData = data.data[kpiKey]

    // Handle error cases
    if (kpiData.error) {
      console.warn(`Error in KPI ${kpiKey}:`, kpiData.error)
      return []
    }

    switch (kpiKey) {
      case "ventaDiariaDelMes":
        return (
          kpiData.rows?.map((row: any) => ({
            date: formatDate(row.dimensionValues[0].value),
            value: Number(row.metricValues[0].value || 0), // Asegurar que siempre hay un valor numérico
            rawDate: row.dimensionValues[0].value, // Keep raw date for sorting
          })) || []
        )

      case "pedidosDiariosDelMes":
        return (
          kpiData.rows?.map((row: any) => ({
            date: formatDate(row.dimensionValues[0].value),
            value: Number(row.metricValues[0].value || 0),
            rawDate: row.dimensionValues[0].value, // Keep raw date for sorting
          })) || []
        )

      case "traficoPorFuente":
        return (
          kpiData.rows?.map((row: any) => ({
            name: row.dimensionValues[0].value,
            value: Number(row.metricValues[0].value),
            compras: row.metricValues[1] ? Number(row.metricValues[1].value) : 0,
            tasaConversion: row.metricValues[1]
              ? (Number(row.metricValues[1].value) / Number(row.metricValues[0].value)) * 100
              : 0,
            percentage: kpiData.summary?.totalSessions
              ? ((Number(row.metricValues[0].value) / kpiData.summary.totalSessions) * 100).toFixed(1) + "%"
              : "0%",
          })) || []
        )

      case "ticketPromedioDelMes":
        // Si tenemos datos de VTEX, los usamos para complementar
        if (kpiData.vtexData && kpiData.vtexData.orders) {
          const vtexOrders = kpiData.vtexData.orders
          // Combinar datos de GA4 con datos de VTEX
          return (
            kpiData.rows?.map((row: any) => ({
              date: formatDate(row.dimensionValues[0].value),
              revenue: Number(row.metricValues[0].value),
              purchases: Number(row.metricValues[1].value),
              average: Number(row.metricValues[0].value) / Number(row.metricValues[1].value),
              // Añadir datos de VTEX si están disponibles para esta fecha
              vtexRevenue: vtexOrders[row.dimensionValues[0].value]?.revenue || 0,
              vtexPurchases: vtexOrders[row.dimensionValues[0].value]?.purchases || 0,
              vtexAverage: vtexOrders[row.dimensionValues[0].value]?.average || 0,
              rawDate: row.dimensionValues[0].value, // Keep raw date for sorting
            })) || []
          )
        }
        // Si no hay datos de VTEX, seguimos con el comportamiento original
        return (
          kpiData.rows?.map((row: any) => ({
            date: formatDate(row.dimensionValues[0].value),
            revenue: Number(row.metricValues[0].value),
            purchases: Number(row.metricValues[1].value),
            average: Number(row.metricValues[0].value) / Number(row.metricValues[1].value),
            rawDate: row.dimensionValues[0].value, // Keep raw date for sorting
          })) || []
        )

      case "palabrasBuscadas":
        if (kpiData.summary?.términosMásUsados) {
          // Filter out empty search terms
          return kpiData.summary.términosMásUsados
            .filter((item: any) => item.término && item.término.trim() !== "")
            .map((item: any) => ({
              name: item.término,
              value: item.sesiones,
              compras: item.compras || 0,
              tasaConversion: item.tasaConversion || 0,
              percentage: item.porcentaje.toFixed(1) + "%",
            }))
        }
        return []

      case "carrosAbandonados":
        if (kpiData.summary?.abandonmentByDay) {
          return kpiData.summary.abandonmentByDay.map((day: any) => ({
            date: formatDate(day.date),
            addToCarts: day.addToCarts,
            purchases: day.purchases,
            abandoned: day.abandoned,
            abandonmentRate: day.abandonmentRate,
            rawDate: day.date,
          }))
        }
        return (
          kpiData.rows?.map((row: any) => ({
            date: formatDate(row.dimensionValues[0].value),
            addToCarts: Number(row.metricValues[0].value),
            purchases: Number(row.metricValues[1].value),
            abandoned: Number(row.metricValues[0].value) - Number(row.metricValues[1].value),
            abandonmentRate: Number(row.metricValues[0].value)
              ? ((Number(row.metricValues[0].value) - Number(row.metricValues[1].value)) /
                Number(row.metricValues[0].value)) *
              100
              : 0,
            rawDate: row.dimensionValues[0].value, // Keep raw date for sorting
          })) || []
        )

      case "tasaConversionWeb":
        if (kpiData.summary) {
          return [
            {
              name: "Conversiones",
              value: kpiData.summary.purchases,
              fullMark: kpiData.summary.sessions * 0.1, // 10% conversion would be perfect
            },
            {
              name: "Sesiones",
              value: kpiData.summary.sessions,
              fullMark: kpiData.summary.sessions,
            },
            {
              name: "Tasa",
              value: kpiData.summary.tasaConversion,
              fullMark: 10, // 10% conversion would be perfect
            },
          ]
        }
        return []

      case "audiencia":
        if (kpiData.summary) {
          return [
            {
              name: "Activos",
              value: kpiData.summary.activeUsers,
              fullMark: kpiData.summary.totalUsers,
            },
            {
              name: "Totales",
              value: kpiData.summary.totalUsers,
              fullMark: kpiData.summary.totalUsers,
            },
            {
              name: "Nuevos",
              value: kpiData.summary.newUsers,
              fullMark: kpiData.summary.totalUsers,
            },
            {
              name: "Recurrentes",
              value: kpiData.summary.returningUsers,
              fullMark: kpiData.summary.totalUsers,
            },
          ]
        }
        return []

      case "comparativos":
        if (kpiData.summary) {
          return [
            {
              name: "Usuarios",
              actual: kpiData.summary.usuarios.actual,
              anterior: kpiData.summary.usuarios.anterior,
              variacion: kpiData.summary.usuarios.variacion,
            },
            {
              name: "Sesiones",
              actual: kpiData.summary.sesiones.actual,
              anterior: kpiData.summary.sesiones.anterior,
              variacion: kpiData.summary.sesiones.variacion,
            },
            {
              name: "Compras",
              actual: kpiData.summary.compras.actual,
              anterior: kpiData.summary.compras.anterior,
              variacion: kpiData.summary.compras.variacion,
            },
            {
              name: "Ingresos",
              actual: kpiData.summary.ingresos.actual,
              anterior: kpiData.summary.ingresos.anterior,
              variacion: kpiData.summary.ingresos.variacion,
            },
          ]
        }
        return []

      case "funnelConversiones":
        if (kpiData.summary?.etapas) {
          return kpiData.summary.etapas
        }
        return []

      case "kpisDeProductos":
        // Complementar con datos de VTEX si están disponibles
        if (kpiData.vtexData && kpiData.vtexData.products) {
          return kpiData.vtexData.products.map((product: any) => ({
            name: product.productName,
            value: product.sales,
            stock: product.stock,
            price: product.price,
            category: product.category,
            brand: product.brand,
          }))
        }
        // Si no hay datos de VTEX, seguimos con el comportamiento original
        if (kpiData.summary?.topProducts) {
          return kpiData.summary.topProducts
        }
        return []

      case "kpisPorCategoria":
        if (kpiData.summary?.topCategories) {
          return kpiData.summary.topCategories
        }
        return []

      case "kpisPorMarca":
        if (kpiData.summary?.topBrands) {
          return kpiData.summary.topBrands
        }
        return []

      case "inversionMarketing":
        if (kpiData.summary?.campaigns) {
          return kpiData.summary.campaigns
        }
        return []

      case "campañas":
        if (kpiData.summary?.campaignPerformance) {
          return kpiData.summary.campaignPerformance
        }
        return []

      case "kpiContestabilidadCorus":
        if (kpiData.rows) {
          return kpiData.rows.map((row: any) => ({
            date: formatDate(row.dimensionValues[0].value),
            responses: Number(row.metricValues[0].value),
            rawDate: row.dimensionValues[0].value,
          }))
        }
        return []

      case "clientesPerdidos":
        if (kpiData.summary) {
          return [
            {
              name: "Activos",
              value: kpiData.summary.totalUsers - kpiData.summary.clientesEnRiesgo - kpiData.summary.clientesPerdidos,
            },
            { name: "En Riesgo", value: kpiData.summary.clientesEnRiesgo },
            { name: "Perdidos", value: kpiData.summary.clientesPerdidos },
          ]
        }
        return []

      case "tasaAperturaMails":
        if (kpiData.summary?.dailyData) {
          return kpiData.summary.dailyData
        }
        return []

      case "sugerenciasMejora":
        if (kpiData.summary?.sugerencias) {
          return kpiData.summary.sugerencias
        }
        return []

      case "vtexProductosStock":
        // Este KPI usa exclusivamente datos de VTEX
        if (kpiData.vtexData && kpiData.vtexData.products) {
          return kpiData.vtexData.products
            .filter((product: any) => product.stock !== undefined)
            .map((product: any) => ({
              name: product.productName,
              value: product.stock,
              price: product.price,
              category: product.category,
              brand: product.brand,
              sku: product.sku,
            }))
        }
        return []

      default:
        return []
    }
  }

  // Apply sorting to chart data
  const applySorting = (data: any[], kpiKey: string): any[] => {
    if (!data || data.length === 0) return []

    const sortOption = getSortOption(kpiKey)
    const dataCopy = [...data]

    switch (sortOption) {
      case "date":
        // Sort by date if available
        if (dataCopy[0]?.rawDate) {
          return dataCopy.sort((a, b) => {
            return String(a.rawDate).localeCompare(String(b.rawDate))
          })
        }
        return dataCopy

      case "value":
        // Sort by value (descending)
        return dataCopy.sort((a, b) => {
          const valueA =
            a.value !== undefined
              ? a.value
              : a.average !== undefined
                ? a.average
                : a.actual !== undefined
                  ? a.actual
                  : 0
          const valueB =
            b.value !== undefined
              ? b.value
              : b.average !== undefined
                ? b.average
                : b.actual !== undefined
                  ? b.actual
                  : 0
          return valueB - valueA
        })

      case "name":
        // Sort by name
        return dataCopy.sort((a, b) => {
          const nameA = a.name || a.date || ""
          const nameB = b.name || b.date || ""
          return String(nameA).localeCompare(String(nameB))
        })

      default:
        return dataCopy
    }
  }

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return ""

    // Format YYYYMMDD to MM/DD
    if (dateString.length === 8) {
      const year = dateString.substring(0, 4)
      const month = dateString.substring(4, 6)
      const day = dateString.substring(6, 8)
      return `${month}/${day}`
    }

    return dateString
  }

  // Get summary data for KPI
  const getSummary = (kpiKey: string) => {
    if (!data || !data.data || !data.data[kpiKey]) return null

    const kpiData = data.data[kpiKey]

    // Handle error cases
    if (kpiData.error) {
      return {
        title: "Error",
        value: "No disponible",
        subValue: kpiData.error,
        status: "error",
      }
    }

    switch (kpiKey) {
      case "ventaDiariaDelMes":
        if (kpiData.summary) {
          return {
            title: "Ventas Totales",
            value: formatCurrency(kpiData.summary.totalRevenue),
            subValue: `Promedio: ${formatCurrency(kpiData.summary.promedioDiario)}/día`,
            status: "success",
          }
        }
        break

      case "pedidosDiariosDelMes":
        if (kpiData.summary) {
          return {
            title: "Pedidos Totales",
            value: kpiData.summary.totalPurchases.toLocaleString(),
            subValue: `Promedio: ${(kpiData.summary.promedioDiario).toFixed(1)}/día`,
            status: "success",
          }
        }
        break

      case "ticketPromedioDelMes":
        if (kpiData.summary) {
          return {
            title: "Ticket Promedio",
            value: formatCurrency(kpiData.summary.ticketPromedio),
            subValue: `Total: ${formatCurrency(kpiData.summary.totalRevenue)}`,
            status: "success",
          }
        }
        break

      case "traficoPorFuente":
        if (kpiData.summary) {
          return {
            title: "Sesiones Totales",
            value: kpiData.summary.totalSessions.toLocaleString(),
            subValue: `Fuentes: ${kpiData.rows?.length || 0}`,
            status: "success",
          }
        }
        break

      case "carrosAbandonados":
        if (kpiData.summary) {
          const abandonmentRate = kpiData.summary.abandonmentRate
          return {
            title: "Tasa de Abandono",
            value: `${abandonmentRate.toFixed(1)}%`,
            subValue: `${kpiData.summary.abandonedCarts} carritos abandonados`,
            status: abandonmentRate > 75 ? "warning" : abandonmentRate > 90 ? "error" : "success",
          }
        }
        break

      case "palabrasBuscadas":
        if (kpiData.summary) {
          return {
            title: "Búsquedas Totales",
            value: kpiData.summary.totalBúsquedas.toLocaleString(),
            subValue: `Términos únicos: ${kpiData.summary.términosMásUsados?.length || 0}`,
            status: "success",
          }
        }
        break

      case "tasaConversionWeb":
        if (kpiData.summary) {
          const conversionRate = kpiData.summary.tasaConversion
          return {
            title: "Tasa de Conversión",
            value: `${conversionRate.toFixed(2)}%`,
            subValue: `${kpiData.summary.purchases} conversiones / ${kpiData.summary.sessions} sesiones`,
            status: conversionRate < 1 ? "warning" : conversionRate > 5 ? "success" : "normal",
          }
        }
        break

      case "audiencia":
        if (kpiData.summary) {
          const activityRate = kpiData.summary.activityRate
          return {
            title: "Actividad de Usuarios",
            value: `${activityRate.toFixed(1)}%`,
            subValue: `${kpiData.summary.activeUsers} activos / ${kpiData.summary.totalUsers} totales`,
            status: activityRate < 50 ? "warning" : activityRate > 80 ? "success" : "normal",
          }
        }
        break

      case "comparativos":
        if (kpiData.summary) {
          const ingresos = kpiData.summary.ingresos
          return {
            title: "Comparativa de Ingresos",
            value: `${ingresos.variacion > 0 ? "+" : ""}${ingresos.variacion.toFixed(1)}%`,
            subValue: `${formatCurrency(ingresos.actual)} vs ${formatCurrency(ingresos.anterior)}`,
            status: ingresos.variacion > 0 ? "success" : ingresos.variacion < -10 ? "error" : "warning",
          }
        }
        break

      case "funnelConversiones":
        if (kpiData.summary) {
          return {
            title: "Conversión Total",
            value: `${kpiData.summary.tasaConversionTotal.toFixed(2)}%`,
            subValue: `Abandono: ${kpiData.summary.abandonoCarrito.toFixed(1)}%`,
            status:
              kpiData.summary.tasaConversionTotal > 3
                ? "success"
                : kpiData.summary.tasaConversionTotal < 1
                  ? "error"
                  : "warning",
          }
        }
        break

      case "kpisDeProductos":
        if (kpiData.summary) {
          return {
            title: "Productos",
            value: `${kpiData.summary.totalPurchases.toLocaleString()} compras`,
            subValue: `Ingresos: ${formatCurrency(kpiData.summary.totalRevenue)}`,
            status: "success",
          }
        }
        break

      case "kpisPorCategoria":
        if (kpiData.summary) {
          return {
            title: "Categorías",
            value: `${kpiData.summary.conversionRate.toFixed(2)}% conversión`,
            subValue: `${kpiData.rows?.length || 0} categorías`,
            status: "success",
          }
        }
        break

      case "kpisPorMarca":
        if (kpiData.summary) {
          return {
            title: "Marcas",
            value: `${kpiData.summary.conversionRate.toFixed(2)}% conversión`,
            subValue: `${kpiData.rows?.length || 0} marcas`,
            status: "success",
          }
        }
        break

      case "inversionMarketing":
        if (kpiData.summary) {
          return {
            title: "Marketing",
            value: `${kpiData.summary.conversionRate.toFixed(2)}% conversión`,
            subValue: `${kpiData.summary.campaigns?.length || 0} campañas`,
            status: "success",
          }
        }
        break

      case "campañas":
        if (kpiData.summary) {
          return {
            title: "Campañas",
            value: `${kpiData.summary.totalCampañas} campañas`,
            subValue: `${kpiData.summary.conversionRateGlobal.toFixed(2)}% conversión global`,
            status: "success",
          }
        }
        break

      case "kpiContestabilidadCorus":
        if (kpiData.summary) {
          return {
            title: "Contestabilidad Corus",
            value: `${kpiData.summary.totalResponses.toLocaleString()} respuestas`,
            subValue: `Promedio: ${kpiData.summary.promedioDiario.toFixed(1)}/día`,
            status: "success",
          }
        }
        break

      case "clientesPerdidos":
        if (kpiData.summary) {
          return {
            title: "Clientes en Riesgo",
            value: `${kpiData.summary.porcentajeEnRiesgo.toFixed(1)}%`,
            subValue: `${kpiData.summary.clientesEnRiesgo} clientes`,
            status:
              kpiData.summary.porcentajeEnRiesgo > 20
                ? "error"
                : kpiData.summary.porcentajeEnRiesgo > 10
                  ? "warning"
                  : "success",
          }
        }
        break

      case "tasaAperturaMails":
        if (kpiData.summary) {
          return {
            title: "Apertura de Emails",
            value: `${kpiData.summary.avgOpenRate.toFixed(1)}%`,
            subValue: `Clics: ${kpiData.summary.avgClickRate.toFixed(1)}%`,
            status:
              kpiData.summary.avgOpenRate < 15 ? "error" : kpiData.summary.avgOpenRate < 25 ? "warning" : "success",
          }
        }
        break

      case "sugerenciasMejora":
        if (kpiData.summary) {
          return {
            title: "Sugerencias",
            value: `${kpiData.summary.sugerencias?.length || 0} oportunidades`,
            subValue: "Recomendaciones de mejora",
            status: "success",
          }
        }
        break

      case "vtexProductosStock":
        if (kpiData.vtexData && kpiData.vtexData.products) {
          const products = kpiData.vtexData.products
          const lowStockCount = products.filter((p: any) => p.stock < 10).length

          return {
            title: "Stock de Productos",
            value: `${products.length} productos`,
            subValue: `${lowStockCount} con stock bajo`,
            status: lowStockCount > products.length * 0.2 ? "warning" : "success",
          }
        }
        break
    }

    return {
      title: "Datos",
      value: "No disponible",
      subValue: "",
      status: "normal",
    }
  }

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Get KPI description
  const getKpiDescription = (kpiKey: string): string => {
    switch (kpiKey) {
      case "pedidosDiariosDelMes":
        return "Muestra el número total de pedidos realizados por día. Útil para identificar patrones de compra y días de mayor actividad comercial."
      case "ventaDiariaDelMes":
        return "Visualiza los ingresos diarios generados. Permite identificar tendencias de ventas y días de mayor rendimiento económico."
      case "ticketPromedioDelMes":
        return "Muestra el valor promedio de cada compra. Un indicador clave para entender el comportamiento de compra de los clientes."
      case "traficoPorFuente":
        return "Analiza el origen del tráfico web, mostrando qué canales generan más visitas. Ayuda a optimizar estrategias de marketing y adquisición."
      case "carrosAbandonados":
        return "Compara carritos añadidos vs. compras completadas. Una tasa alta de abandono puede indicar problemas en el proceso de checkout."
      case "palabrasBuscadas":
        return "Términos más buscados por los usuarios en el sitio. Revela intereses de los usuarios y oportunidades para mejorar el catálogo."
      case "tasaConversionWeb":
        return "Porcentaje de visitas que resultan en una compra. Métrica clave para evaluar la efectividad general del sitio."
      case "audiencia":
        return "Análisis de usuarios activos vs. totales. Indica el nivel de engagement y retención de la audiencia del sitio."
      case "comparativos":
        return "Compara métricas clave entre el período actual y el anterior. Permite identificar tendencias y evaluar el desempeño."
      case "funnelConversiones":
        return "Visualiza el recorrido del usuario desde la vista de producto hasta la compra. Identifica puntos de abandono en el proceso."
      case "kpisDeProductos":
        return "Analiza el rendimiento de productos individuales. Ayuda a identificar productos estrella y oportunidades de mejora."
      case "kpisPorCategoria":
        return "Evalúa el desempeño de las categorías de productos. Útil para optimizar la estructura del catálogo."
      case "kpisPorMarca":
        return "Muestra el rendimiento de las diferentes marcas. Permite identificar marcas con mejor conversión y potencial."
      case "inversionMarketing":
        return "Analiza el retorno de inversión de las campañas de marketing. Ayuda a optimizar la asignación de presupuesto."
      case "campañas":
        return "Evalúa el desempeño de campañas individuales. Permite identificar las estrategias más efectivas."
      case "kpiContestabilidadCorus":
        return "Mide la efectividad del sistema de atención Corus. Evalúa la capacidad de respuesta a consultas de clientes."
      case "clientesPerdidos":
        return "Identifica clientes en riesgo de abandono. Permite implementar estrategias de retención proactivas."
      case "tasaAperturaMails":
        return "Analiza la efectividad de las campañas de email marketing. Mide apertura, clics y conversiones."
      case "sugerenciasMejora":
        return "Recomendaciones basadas en el análisis de datos. Ofrece oportunidades concretas para mejorar el rendimiento."
      default:
        return "Información no disponible para este KPI."
    }
  }

  // Common tooltip style
  const tooltipStyle = {
    contentStyle: {
      backgroundColor: colors.tooltipBackground,
      borderColor: colors.tooltipBorder,
      color: colors.text,
      borderRadius: "4px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    },
    labelStyle: { color: colors.text },
    itemStyle: { color: colors.text },
    cursor: { fill: colors.accent, opacity: 0.3 },
  }

  // Custom tooltip for pie charts
  const renderCustomizedPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="custom-tooltip"
          style={{
            backgroundColor: colors.tooltipBackground,
            border: `1px solid ${colors.tooltipBorder}`,
            padding: "10px",
            borderRadius: "4px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          <p className="label" style={{ color: colors.text, fontWeight: "bold" }}>{`${payload[0].name}`}</p>
          <p className="value" style={{ color: colors.text }}>{`Valor: ${payload[0].value.toLocaleString()}`}</p>
          {payload[0].payload.tasaConversion !== undefined && (
            <p className="conversion" style={{ color: colors.accent }}>
              {`Conversión: ${payload[0].payload.tasaConversion.toFixed(2)}%`}
            </p>
          )}
          <p
            className="percent"
            style={{ color: colors.accent }}
          >{`${payload[0].payload.percentage || (payload[0].percent * 100).toFixed(1) + "%"}`}</p>
        </div>
      )
    }
    return null
  }

  // Custom active shape for pie charts
  const renderActiveShape = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props
    const RADIAN = Math.PI / 180
    const sin = Math.sin(-RADIAN * midAngle)
    const cos = Math.cos(-RADIAN * midAngle)
    const sx = cx + (outerRadius + 10) * cos
    const sy = cy + (outerRadius + 10) * sin
    const mx = cx + (outerRadius + 30) * cos
    const my = cy + (outerRadius + 30) * sin
    const ex = mx + (cos >= 0 ? 1 : -1) * 22
    const ey = my
    const textAnchor = cos >= 0 ? "start" : "end"

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke={colors.secondary}
          strokeWidth={2}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={colors.accent}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={colors.text} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={colors.accent} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          textAnchor={textAnchor}
          fill={colors.text}
          style={{ fontSize: "12px" }}
        >
          {payload.name}
        </text>
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          dy={18}
          textAnchor={textAnchor}
          fill={colors.accent}
          style={{ fontSize: "12px" }}
        >
          {`${value.toLocaleString()} (${(percent * 100).toFixed(1)}%)`}
        </text>
        {payload.tasaConversion !== undefined && (
          <text
            x={ex + (cos >= 0 ? 1 : -1) * 12}
            y={ey}
            dy={36}
            textAnchor={textAnchor}
            fill={colors.warning}
            style={{ fontSize: "12px" }}
          >
            {`Conversión: ${payload.tasaConversion.toFixed(2)}%`}
          </text>
        )}
      </g>
    )
  }

  // Export chart data to XLSX
  const exportToXLSX = (kpiKey: string) => {
    const chartData = formatChartData(kpiKey)
    if (chartData.length === 0) {
      alert("No hay datos disponibles para exportar")
      return
    }

    try {
      // Crear una hoja de trabajo
      const worksheet = XLSX.utils.json_to_sheet(chartData)

      // Crear un libro de trabajo y añadir la hoja
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, kpiKey)

      // Generar el archivo y descargarlo
      XLSX.writeFile(workbook, `${kpiKey}_${new Date().toISOString().split("T")[0]}.xlsx`)
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      alert("Error al exportar a Excel. Consulta la consola para más detalles.")
    }
  }

  // Export chart as PDF
  const exportToPDF = (kpiKey: string) => {
    const chartContainer = document.getElementById(`chart-${kpiKey}`)
    if (!chartContainer) {
      alert("No se pudo encontrar el gráfico para exportar")
      return
    }

    try {
      html2canvas(chartContainer).then((canvas) => {
        const imgData = canvas.toDataURL("image/png")
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4",
        })

        // Calcular dimensiones para mantener la proporción
        const imgProps = pdf.getImageProperties(imgData)
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

        // Añadir título
        pdf.setFontSize(16)
        pdf.text(`${kpiOptions.find((opt) => opt.id === kpiKey)?.label || kpiKey}`, 14, 15)

        // Añadir fecha de generación
        pdf.setFontSize(10)
        pdf.text(`Generado: ${new Date().toLocaleString()}`, 14, 22)

        // Añadir imagen del gráfico
        pdf.addImage(imgData, "PNG", 10, 30, pdfWidth - 20, pdfHeight - 20)

        // Guardar PDF
        pdf.save(`${kpiKey}_${new Date().toISOString().split("T")[0]}.pdf`)
      })
    } catch (error) {
      console.error("Error al exportar a PDF:", error)
      alert("Error al exportar a PDF. Consulta la consola para más detalles.")
    }
  }

  // Copy chart as image
  const copyChartAsImage = (kpiKey: string) => {
    const chartContainer = document.getElementById(`chart-${kpiKey}`)
    if (!chartContainer) {
      alert("No se pudo encontrar el gráfico para copiar")
      return
    }

    try {
      html2canvas(chartContainer).then((canvas) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const item = new ClipboardItem({ "image/png": blob })
            navigator.clipboard
              .write([item])
              .then(() => alert("Imagen copiada al portapapeles"))
              .catch((err) => {
                console.error("Error al copiar al portapapeles:", err)
                alert("No se pudo copiar la imagen. Intenta con el botón PDF en su lugar.")
              })
          }
        })
      })
    } catch (error) {
      console.error("Error al copiar como imagen:", error)
      alert("Error al copiar como imagen. Consulta la consola para más detalles.")
    }
  }

  // // Fetch order data from VTEX
  // const fetchVtexOrderData = async (orderId: string) => {
  //   try {
  //     const response = await fetch(`/api/vtex-order?orderId=${orderId}`)
  //     if (!response.ok) {
  //       throw new Error(`Error: ${response.status}`)
  //     }
  //     return await response.json()
  //   } catch (error) {
  //     console.error("Error fetching VTEX order data:", error)
  //     return null
  //   }
  // }

  // Render data as table
  const renderDataTable = (kpiKey: string) => {
    const chartData = formatChartData(kpiKey)
    const sortedData = applySorting(chartData, kpiKey)

    if (sortedData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-center" style={{ color: colors.text }}>
            No hay datos disponibles para mostrar en tabla
          </p>
        </div>
      )
    }

    // Get column headers from the first data item
    const columns = Object.keys(sortedData[0]).filter((col) => col !== "rawDate") // Exclude rawDate from display

    return (
      <div className="overflow-auto h-full max-h-[400px]">
        <table className="w-full border-collapse" style={{ color: colors.text }}>
          <thead>
            <tr style={{ backgroundColor: `${colors.secondary}90` }}>
              {columns.map((column) => (
                <th
                  key={column}
                  className="p-2 text-left border-b sticky top-0 z-10"
                  style={{
                    borderColor: colors.accent,
                    backgroundColor: colors.secondary,
                  }}
                >
                  {column === "date"
                    ? "Fecha"
                    : column === "value"
                      ? "Valor"
                      : column === "name"
                        ? "Nombre"
                        : column === "percentage"
                          ? "Porcentaje"
                          : column === "average"
                            ? "Promedio"
                            : column === "addToCarts"
                              ? "Añadidos al carrito"
                              : column === "purchases"
                                ? "Compras"
                                : column === "abandoned"
                                  ? "Abandonados"
                                  : column === "revenue"
                                    ? "Ingresos"
                                    : column === "fullMark"
                                      ? "Valor máximo"
                                      : column === "actual"
                                        ? "Actual"
                                        : column === "anterior"
                                          ? "Anterior"
                                          : column === "variacion"
                                            ? "Variación %"
                                            : column === "tasaConversion"
                                              ? "Tasa Conversión %"
                                              : column === "compras"
                                                ? "Compras"
                                                : column === "abandonmentRate"
                                                  ? "Tasa Abandono %"
                                                  : column === "responses"
                                                    ? "Respuestas"
                                                    : column === "openRate"
                                                      ? "Tasa Apertura %"
                                                      : column === "clickRate"
                                                        ? "Tasa Clics %"
                                                        : column === "conversions"
                                                          ? "Conversiones"
                                                          : column === "campaign"
                                                            ? "Campaña"
                                                            : column === "sessions"
                                                              ? "Sesiones"
                                                              : column === "area"
                                                                ? "Área"
                                                                : column === "métrica"
                                                                  ? "Métrica"
                                                                  : column === "sugerencia"
                                                                    ? "Sugerencia"
                                                                    : column === "impactoEstimado"
                                                                      ? "Impacto Estimado"
                                                                      : column === "producto"
                                                                        ? "Producto"
                                                                        : column === "categoria"
                                                                          ? "Categoría"
                                                                          : column === "marca"
                                                                            ? "Marca"
                                                                            : column === "vistas"
                                                                              ? "Vistas"
                                                                              : column === "eventos"
                                                                                ? "Eventos"
                                                                                : column === "ingresos"
                                                                                  ? "Ingresos"
                                                                                  : column === "nombre"
                                                                                    ? "Nombre"
                                                                                    : column === "valor"
                                                                                      ? "Valor"
                                                                                      : column === "tasa"
                                                                                        ? "Tasa %"
                                                                                        : column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-opacity-20 transition-colors"
                style={{
                  backgroundColor: rowIndex % 2 === 0 ? `${colors.glass}40` : "transparent",
                  borderBottom: `1px solid ${colors.glass}`,
                  ":hover": {
                    backgroundColor: colors.hoverHighlight,
                  },
                }}
              >
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column}`} className="p-2">
                    {typeof row[column] === "number"
                      ? column.includes("revenue") ||
                        column.includes("average") ||
                        column.includes("ingresos") ||
                        column === "actual" ||
                        column === "anterior"
                        ? formatCurrency(row[column])
                        : column.includes("Rate") || column.includes("tasa") || column === "variacion"
                          ? `${row[column].toFixed(2)}%`
                          : row[column].toLocaleString()
                      : row[column]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Render chart based on chart type
  const renderChart = (kpiKey: string) => {
    const chartType = getChartType(kpiKey)
    const chartData = formatChartData(kpiKey)
    const sortedData = applySorting(chartData, kpiKey)

    if (sortedData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-center" style={{ color: colors.text }}>
            No hay datos disponibles para mostrar en el gráfico
          </p>
        </div>
      )
    }

    // Common chart props
    const chartProps = {
      id: `chart-${kpiKey}`,
      className: "chart-container",
      onClick: (data: any) => {
        if (data && data.activeTooltipIndex !== undefined) {
          setActiveTooltipIndex(data.activeTooltipIndex === activeTooltipIndex ? null : data.activeTooltipIndex)
        }
      },
    }

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400} {...chartProps}>
            <BarChart data={sortedData}>
              <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey={sortedData[0]?.date ? "date" : "name"}
                style={{ fill: colors.text }}
                angle={sortedData.length > 10 ? -45 : 0}
                textAnchor={sortedData.length > 10 ? "end" : "middle"}
                height={sortedData.length > 10 ? 80 : 30}
              />
              <YAxis style={{ fill: colors.text }} />
              <Tooltip
                {...tooltipStyle}
                cursor={{ fill: colors.hoverHighlight }}
                formatter={(value: number, name: string) => {
                  if (name === "value" || name === "average") {
                    return [value.toLocaleString(), name === "value" ? "Valor" : "Promedio"]
                  }
                  if (name === "revenue" || name === "ingresos") {
                    return [formatCurrency(value), name === "revenue" ? "Ingresos" : "Ingresos"]
                  }
                  if (name.includes("Rate") || name.includes("tasa") || name === "variacion") {
                    return [`${value.toFixed(2)}%`, name]
                  }
                  return [value.toLocaleString(), name]
                }}
              />
              <Legend
                wrapperStyle={{ color: colors.text }}
                formatter={(value) => {
                  if (value === "value") return "Valor"
                  if (value === "average") return "Promedio"
                  if (value === "revenue") return "Ingresos"
                  if (value === "purchases") return "Compras"
                  if (value === "addToCarts") return "Añadidos al carrito"
                  if (value === "abandoned") return "Abandonados"
                  if (value === "responses") return "Respuestas"
                  if (value === "actual") return "Actual"
                  if (value === "anterior") return "Anterior"
                  if (value === "variacion") return "Variación %"
                  return value
                }}
              />
              {kpiKey === "carrosAbandonados" ? (
                <>
                  <Bar dataKey="addToCarts" name="Añadidos al carrito" fill={colors.primary} />
                  <Bar dataKey="purchases" name="Compras completadas" fill={colors.accent} />
                  <Bar dataKey="abandoned" name="Abandonados" fill={colors.danger} />
                </>
              ) : kpiKey === "comparativos" ? (
                <>
                  <Bar dataKey="actual" name="Actual" fill={colors.accent} />
                  <Bar dataKey="anterior" name="Anterior" fill={colors.primary} />
                </>
              ) : (
                <Bar
                  dataKey={
                    sortedData[0]?.average
                      ? "average"
                      : sortedData[0]?.value
                        ? "value"
                        : sortedData[0]?.responses
                          ? "responses"
                          : "value"
                  }
                  name={sortedData[0]?.average ? "Ticket Promedio" : sortedData[0]?.responses ? "Respuestas" : "Valor"}
                  fill={colors.accent}
                  radius={[4, 4, 0, 0]}
                  background={{ fill: "rgba(74, 227, 181, 0.05)" }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer width="100%" height={400} {...chartProps}>
            <LineChart data={sortedData}>
              <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey={sortedData[0]?.date ? "date" : "name"}
                style={{ fill: colors.text }}
                angle={sortedData.length > 10 ? -45 : 0}
                textAnchor={sortedData.length > 10 ? "end" : "middle"}
                height={sortedData.length > 10 ? 80 : 30}
              />
              <YAxis style={{ fill: colors.text }} />
              <Tooltip
                {...tooltipStyle}
                cursor={{ stroke: colors.accent, strokeWidth: 1 }}
                formatter={(value: number, name: string) => {
                  if (name === "value" || name === "average") {
                    return [value.toLocaleString(), name === "value" ? "Valor" : "Promedio"]
                  }
                  if (name === "revenue" || name === "ingresos" || name === "vtexRevenue") {
                    return [
                      formatCurrency(value),
                      name === "vtexRevenue" ? "Ingresos VTEX" : name === "revenue" ? "Ingresos GA4" : "Ingresos",
                    ]
                  }
                  if (name.includes("Rate") || name.includes("tasa") || name === "variacion") {
                    return [`${value.toFixed(2)}%`, name]
                  }
                  if (name === "vtexAverage") {
                    return [formatCurrency(value), "Ticket VTEX"]
                  }
                  return [value.toLocaleString(), name]
                }}
              />
              <Legend
                wrapperStyle={{ color: colors.text }}
                formatter={(value) => {
                  if (value === "value") return "Valor"
                  if (value === "average") return "Promedio GA4"
                  if (value === "vtexAverage") return "Promedio VTEX"
                  if (value === "revenue") return "Ingresos GA4"
                  if (value === "vtexRevenue") return "Ingresos VTEX"
                  if (value === "purchases") return "Compras GA4"
                  if (value === "vtexPurchases") return "Compras VTEX"
                  if (value === "addToCarts") return "Añadidos al carrito"
                  if (value === "abandoned") return "Abandonados"
                  if (value === "openRate") return "Tasa Apertura"
                  if (value === "clickRate") return "Tasa Clics"
                  if (value === "conversions") return "Conversiones"
                  return value
                }}
              />
              {kpiKey === "ticketPromedioDelMes" && sortedData[0]?.vtexAverage ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="average"
                    name="Promedio GA4"
                    stroke={colors.accent}
                    strokeWidth={2}
                    dot={{ fill: colors.secondary, stroke: colors.accent, strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: colors.accent, stroke: colors.secondary, strokeWidth: 2, r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="vtexAverage"
                    name="Promedio VTEX"
                    stroke={colors.warning}
                    strokeWidth={2}
                    dot={{ fill: colors.secondary, stroke: colors.warning, strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: colors.warning, stroke: colors.secondary, strokeWidth: 2, r: 6 }}
                    strokeDasharray="5 5"
                  />
                </>
              ) : kpiKey === "carrosAbandonados" ? (
                // Mantener el código original para carrosAbandonados
                <>
                  <Line
                    type="monotone"
                    dataKey="addToCarts"
                    name="Añadidos al carrito"
                    stroke={colors.primary}
                    strokeWidth={2}
                    dot={{ fill: colors.secondary, stroke: colors.primary, strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: colors.primary, stroke: colors.secondary, strokeWidth: 2, r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="purchases"
                    name="Compras completadas"
                    stroke={colors.accent}
                    strokeWidth={2}
                    dot={{ fill: colors.secondary, stroke: colors.accent, strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: colors.accent, stroke: colors.secondary, strokeWidth: 2, r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="abandoned"
                    name="Abandonados"
                    stroke={colors.danger}
                    strokeWidth={2}
                    dot={{ fill: colors.secondary, stroke: colors.danger, strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: colors.danger, stroke: colors.secondary, strokeWidth: 2, r: 6 }}
                  />
                </>
              ) : kpiKey === "tasaAperturaMails" ? (
                // Mantener el código original para tasaAperturaMails
                <>
                  <Line
                    type="monotone"
                    dataKey="openRate"
                    name="Tasa Apertura"
                    stroke={colors.accent}
                    strokeWidth={2}
                    dot={{ fill: colors.secondary, stroke: colors.accent, strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: colors.accent, stroke: colors.secondary, strokeWidth: 2, r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="clickRate"
                    name="Tasa Clics"
                    stroke={colors.primary}
                    strokeWidth={2}
                    dot={{ fill: colors.secondary, stroke: colors.primary, strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: colors.primary, stroke: colors.secondary, strokeWidth: 2, r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="conversions"
                    name="Conversiones"
                    stroke={colors.warning}
                    strokeWidth={2}
                    dot={{ fill: colors.secondary, stroke: colors.warning, strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: colors.warning, stroke: colors.secondary, strokeWidth: 2, r: 6 }}
                  />
                </>
              ) : (
                // Código original para otros casos
                <Line
                  type="monotone"
                  dataKey={
                    sortedData[0]?.average
                      ? "average"
                      : sortedData[0]?.value
                        ? "value"
                        : sortedData[0]?.abandonmentRate
                          ? "abandonmentRate"
                          : "value"
                  }
                  name={
                    sortedData[0]?.average
                      ? "Ticket Promedio"
                      : sortedData[0]?.abandonmentRate
                        ? "Tasa de Abandono"
                        : "Valor"
                  }
                  stroke={colors.accent}
                  strokeWidth={2}
                  dot={{ fill: colors.secondary, stroke: colors.accent, strokeWidth: 2, r: 4 }}
                  activeDot={{ fill: colors.accent, stroke: colors.secondary, strokeWidth: 2, r: 6 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400} {...chartProps}>
            <PieChart>
              <Pie
                data={sortedData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={160}
                fill="#8884d8"
                labelLine={false}
                activeIndex={activeTooltipIndex}
                activeShape={renderActiveShape}
                animationDuration={500}
                onClick={(_, index) => setActiveTooltipIndex(index === activeTooltipIndex ? null : index)}
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors.chartColors[index % colors.chartColors.length]} />
                ))}
              </Pie>
              <Tooltip content={renderCustomizedPieTooltip} {...tooltipStyle} />
              <Legend
                wrapperStyle={{ color: colors.text }}
                formatter={(value) => (value === "value" ? "Valor" : value)}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer width="100%" height={400} {...chartProps}>
            <AreaChart data={sortedData}>
              <defs>
                {kpiKey === "carrosAbandonados" ? (
                  <>
                    <linearGradient id="colorAddToCarts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.accent} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={colors.accent} stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorAbandoned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.danger} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={colors.danger} stopOpacity={0.1} />
                    </linearGradient>
                  </>
                ) : (
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.accent} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={colors.accent} stopOpacity={0.1} />
                  </linearGradient>
                )}
              </defs>
              <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey={sortedData[0]?.date ? "date" : "name"}
                style={{ fill: colors.text }}
                angle={sortedData.length > 10 ? -45 : 0}
                textAnchor={sortedData.length > 10 ? "end" : "middle"}
                height={sortedData.length > 10 ? 80 : 30}
              />
              <YAxis style={{ fill: colors.text }} />
              <Tooltip
                {...tooltipStyle}
                cursor={{ stroke: colors.accent, strokeWidth: 1 }}
                formatter={(value: number, name: string) => {
                  if (name === "value" || name === "average") {
                    return [value.toLocaleString(), name === "value" ? "Valor" : "Promedio"]
                  }
                  if (name === "revenue" || name === "ingresos") {
                    return [formatCurrency(value), name === "revenue" ? "Ingresos" : "Ingresos"]
                  }
                  if (name.includes("Rate") || name.includes("tasa") || name === "variacion") {
                    return [`${value.toFixed(2)}%`, name]
                  }
                  return [value.toLocaleString(), name]
                }}
              />
              <Legend
                wrapperStyle={{ color: colors.text }}
                formatter={(value) => {
                  if (value === "value") return "Valor"
                  if (value === "average") return "Promedio"
                  if (value === "revenue") return "Ingresos"
                  if (value === "purchases") return "Compras"
                  if (value === "addToCarts") return "Añadidos al carrito"
                  if (value === "abandoned") return "Abandonados"
                  return value
                }}
              />
              {kpiKey === "carrosAbandonados" ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="addToCarts"
                    name="Añadidos al carrito"
                    stroke={colors.primary}
                    fillOpacity={1}
                    fill="url(#colorAddToCarts)"
                  />
                  <Area
                    type="monotone"
                    dataKey="purchases"
                    name="Compras completadas"
                    stroke={colors.accent}
                    fillOpacity={1}
                    fill="url(#colorPurchases)"
                  />
                  <Area
                    type="monotone"
                    dataKey="abandoned"
                    name="Abandonados"
                    stroke={colors.danger}
                    fillOpacity={1}
                    fill="url(#colorAbandoned)"
                  />
                </>
              ) : (
                <Area
                  type="monotone"
                  dataKey={sortedData[0]?.average ? "average" : sortedData[0]?.value ? "value" : "value"}
                  name={sortedData[0]?.average ? "Ticket Promedio" : "Valor"}
                  stroke={colors.accent}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )

      case "radar":
        return (
          <ResponsiveContainer width="100%" height={400} {...chartProps}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={sortedData}>
              <PolarGrid stroke={colors.grid} />
              <PolarAngleAxis dataKey="name" tick={{ fill: colors.text, fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={{ fill: colors.text, fontSize: 12 }} />
              <Radar name="Valor" dataKey="value" stroke={colors.accent} fill={colors.accent} fillOpacity={0.6} />
              {sortedData[0]?.fullMark && (
                <Radar
                  name="Máximo"
                  dataKey="fullMark"
                  stroke={colors.primary}
                  fill={colors.primary}
                  fillOpacity={0.1}
                />
              )}
              <Legend
                wrapperStyle={{ color: colors.text }}
                formatter={(value) => (value === "value" ? "Valor" : value)}
              />
              <Tooltip {...tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        )

      case "funnel":
        return (
          <ResponsiveContainer width="100%" height={400} {...chartProps}>
            <FunnelChart>
              <Tooltip
                {...tooltipStyle}
                formatter={(value: number, name: string, props: any) => {
                  if (name === "valor") {
                    return [value.toLocaleString(), "Cantidad"]
                  }
                  if (name === "tasa") {
                    return [`${value.toFixed(2)}%`, "Tasa"]
                  }
                  return [value.toLocaleString(), name]
                }}
              />
              <Funnel dataKey="valor" data={sortedData} nameKey="nombre" fill={colors.accent}>
                <LabelList position="right" fill={colors.text} stroke="none" dataKey="nombre" />
                <LabelList
                  position="left"
                  fill={colors.text}
                  stroke="none"
                  dataKey={(entry: any) => `${entry.valor.toLocaleString()}`}
                />
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors.chartColors[index % colors.chartColors.length]} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        )

      case "composed":
        if (kpiKey === "inversionMarketing" || kpiKey === "campañas") {
          return (
            <ResponsiveContainer width="100%" height={400} {...chartProps}>
              <ComposedChart data={sortedData}>
                <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                <XAxis dataKey="campaign" style={{ fill: colors.text }} angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="left" style={{ fill: colors.text }} />
                <YAxis yAxisId="right" orientation="right" style={{ fill: colors.text }} />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value: number, name: string) => {
                    if (name === "sessions") {
                      return [value.toLocaleString(), "Sesiones"]
                    }
                    if (name === "purchases") {
                      return [value.toLocaleString(), "Compras"]
                    }
                    if (name === "revenue") {
                      return [formatCurrency(value), "Ingresos"]
                    }
                    if (name === "conversionRate") {
                      return [`${value.toFixed(2)}%`, "Tasa Conversión"]
                    }
                    return [value.toLocaleString(), name]
                  }}
                />
                <Legend
                  wrapperStyle={{ color: colors.text }}
                  formatter={(value) => {
                    if (value === "sessions") return "Sesiones"
                    if (value === "purchases") return "Compras"
                    if (value === "revenue") return "Ingresos"
                    if (value === "conversionRate") return "Tasa Conversión"
                    return value
                  }}
                />
                <Bar yAxisId="left" dataKey="sessions" name="Sesiones" fill={colors.primary} />
                <Bar yAxisId="left" dataKey="purchases" name="Compras" fill={colors.accent} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="conversionRate"
                  name="Tasa Conversión"
                  stroke={colors.warning}
                  strokeWidth={2}
                  dot={{ fill: colors.secondary, stroke: colors.warning, strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )
        } else if (kpiKey === "tasaAperturaMails") {
          return (
            <ResponsiveContainer width="100%" height={400} {...chartProps}>
              <ComposedChart data={sortedData}>
                <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  style={{ fill: colors.text }}
                  angle={sortedData.length > 10 ? -45 : 0}
                  textAnchor={sortedData.length > 10 ? "end" : "middle"}
                  height={sortedData.length > 10 ? 80 : 30}
                />
                <YAxis yAxisId="left" style={{ fill: colors.text }} />
                <YAxis yAxisId="right" orientation="right" style={{ fill: colors.text }} />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value: number, name: string) => {
                    if (name === "openRate" || name === "clickRate") {
                      return [`${value.toFixed(2)}%`, name === "openRate" ? "Tasa Apertura" : "Tasa Clics"]
                    }
                    if (name === "conversions") {
                      return [value.toLocaleString(), "Conversiones"]
                    }
                    return [value.toLocaleString(), name]
                  }}
                />
                <Legend
                  wrapperStyle={{ color: colors.text }}
                  formatter={(value) => {
                    if (value === "openRate") return "Tasa Apertura"
                    if (value === "clickRate") return "Tasa Clics"
                    if (value === "conversions") return "Conversiones"
                    return value
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="openRate"
                  name="Tasa Apertura"
                  stroke={colors.accent}
                  strokeWidth={2}
                  dot={{ fill: colors.secondary, stroke: colors.accent, strokeWidth: 2, r: 4 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="clickRate"
                  name="Tasa Clics"
                  stroke={colors.primary}
                  strokeWidth={2}
                  dot={{ fill: colors.secondary, stroke: colors.primary, strokeWidth: 2, r: 4 }}
                />
                <Bar yAxisId="right" dataKey="conversions" name="Conversiones" fill={colors.warning} />
              </ComposedChart>
            </ResponsiveContainer>
          )
        }
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-center" style={{ color: colors.text }}>
              Tipo de gráfico compuesto no disponible para este KPI
            </p>
          </div>
        )

      case "treemap":
        return (
          <ResponsiveContainer width="100%" height={400} {...chartProps}>
            <Treemap
              data={sortedData}
              dataKey="value"
              nameKey={
                sortedData[0]?.name
                  ? "name"
                  : sortedData[0]?.producto
                    ? "producto"
                    : sortedData[0]?.categoria
                      ? "categoria"
                      : sortedData[0]?.marca
                        ? "marca"
                        : sortedData[0]?.area
                          ? "area"
                          : "name"
              }
              aspectRatio={4 / 3}
              stroke={colors.secondary}
              fill={colors.accent}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors.chartColors[index % colors.chartColors.length]} />
              ))}
              <Tooltip
                {...tooltipStyle}
                formatter={(value: number, name: string, props: any) => {
                  const entry = props.payload
                  const items = []

                  if (entry.name) {
                    items.push([entry.name, "Nombre"])
                  }
                  if (entry.value) {
                    items.push([entry.value.toLocaleString(), "Valor"])
                  }
                  if (entry.tasaConversion) {
                    items.push([`${entry.tasaConversion.toFixed(2)}%`, "Conversión"])
                  }
                  if (entry.compras) {
                    items.push([entry.compras.toLocaleString(), "Compras"])
                  }
                  if (entry.sugerencia) {
                    items.push([entry.sugerencia, "Sugerencia"])
                  }
                  if (entry.impactoEstimado) {
                    items.push([entry.impactoEstimado, "Impacto"])
                  }

                  return items
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        )

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-center" style={{ color: colors.text }}>
              Tipo de gráfico no soportado
            </p>
          </div>
        )
    }
  }

  // Render chart with controls
  const renderChartWithControls = (kpiKey: string) => {
    const chartType = getChartType(kpiKey)
    const sortOption = getSortOption(kpiKey)
    const viewMode = getViewMode(kpiKey)

    return (
      <div
        className={`flex flex-col h-full ${fullscreen === kpiKey ? "fixed inset-0 z-50 p-4 bg-opacity-95" : ""}`}
        style={{
          backgroundColor: fullscreen === kpiKey ? colors.background : "transparent",
          transition: "all 0.3s ease",
        }}
        ref={fullscreen === kpiKey ? chartContainerRef : null}
      >
        {/* Chart controls */}
        <div
          className="mb-4 p-2 rounded-md flex flex-wrap gap-2 items-center"
          style={{ backgroundColor: `${colors.secondary}80` }}
        >
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

          {/* Export button */}
          <button
            className="px-2 py-1 text-xs rounded flex items-center gap-1"
            style={{
              backgroundColor: colors.glass,
              border: `1px solid ${colors.accent}`,
            }}
            onClick={() => exportToXLSX(kpiKey)}
            title="Exportar datos a XLSX"
          >
            <FileText size={12} />
            <span>XLSX</span>
          </button>

          {/* Chart export options (only show when in chart mode) */}
          {viewMode === "chart" && (
            <>
              <button
                className="px-2 py-1 text-xs rounded flex items-center gap-1"
                style={{
                  backgroundColor: colors.glass,
                  border: `1px solid ${colors.accent}`,
                }}
                onClick={() => exportToPDF(kpiKey)}
                title="Exportar gráfico como PDF"
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
                onClick={() => copyChartAsImage(kpiKey)}
                title="Copiar gráfico como imagen"
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

          {/* Refresh button */}
          <button
            className="px-2 py-1 text-xs rounded flex items-center gap-1"
            style={{
              backgroundColor: colors.glass,
              border: `1px solid ${colors.accent}`,
            }}
            onClick={() => setRefreshKey((prev) => prev + 1)}
            title="Actualizar datos"
          >
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
                  className={`p-1.5 rounded-md transition-all duration-200 flex items-center ${sortOption === option.id ? "bg-opacity-80" : "bg-opacity-20 hover:bg-opacity-40"
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

        {/* KPI info panel */}
        {showInfo[kpiKey] && (
          <div
            className="mb-4 p-3 rounded-md"
            style={{
              backgroundColor: `${colors.glass}`,
              border: `1px solid ${colors.accent}`,
              boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
            }}
          >
            <h3 className="text-sm font-bold mb-2" style={{ color: colors.accent }}>
              Acerca de este KPI
            </h3>
            <p className="text-sm" style={{ color: colors.text }}>
              {getKpiDescription(kpiKey)}
            </p>
          </div>
        )}

        {/* Chart or Table based on view mode */}
        <div className="flex-1 min-h-[300px]">
          {viewMode === "chart" ? renderChart(kpiKey) : renderDataTable(kpiKey)}
        </div>
      </div>
    )
  }

  // Custom date picker modal
  const renderCustomDatePicker = () => {
    if (!showCustomDatePicker) return null

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
    )
  }

  return (
    <div
      className="w-full h-full min-h-screen flex flex-col"
      style={{
        background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.background} 100%)`,
        color: colors.text,
      }}
    >
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
              {data?.metadata?.periodo.startDate} — {data?.metadata?.periodo.endDate}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {dateRangeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  if (option.id === "custom") {
                    setShowCustomDatePicker(true)
                  } else {
                    setDateRange({ startDate: option.id, endDate: option.endDate })
                  }
                }}
                className={`px-3 py-1 text-sm rounded transition-all duration-300 ${dateRange.startDate === option.id ||
                  (
                    option.id === "custom" &&
                    dateRange.startDate !== "today" &&
                    dateRange.startDate !== "yesterday" &&
                    dateRange.startDate !== "7daysAgo" &&
                    dateRange.startDate !== "30daysAgo" &&
                    dateRange.startDate !== "2025-01-01" &&
                    dateRange.startDate !== "2020-01-01"
                  )
                  ? "bg-opacity-90 shadow-lg"
                  : "bg-opacity-20 hover:bg-opacity-40"
                  }`}
                style={{
                  backgroundColor:
                    dateRange.startDate === option.id ||
                      (option.id === "custom" &&
                        dateRange.startDate !== "today" &&
                        dateRange.startDate !== "yesterday" &&
                        dateRange.startDate !== "7daysAgo" &&
                        dateRange.startDate !== "30daysAgo" &&
                        dateRange.startDate !== "2025-01-01" &&
                        dateRange.startDate !== "2020-01-01")
                      ? colors.accent
                      : colors.glass,
                  color:
                    dateRange.startDate === option.id ||
                      (option.id === "custom" &&
                        dateRange.startDate !== "today" &&
                        dateRange.startDate !== "yesterday" &&
                        dateRange.startDate !== "7daysAgo" &&
                        dateRange.startDate !== "30daysAgo" &&
                        dateRange.startDate !== "2025-01-01" &&
                        dateRange.startDate !== "2020-01-01")
                      ? colors.secondary
                      : colors.text,
                  border: `1px solid ${colors.accent}`,
                  boxShadow:
                    dateRange.startDate === option.id ||
                      (option.id === "custom" &&
                        dateRange.startDate !== "today" &&
                        dateRange.startDate !== "yesterday" &&
                        dateRange.startDate !== "7daysAgo" &&
                        dateRange.startDate !== "30daysAgo" &&
                        dateRange.startDate !== "2025-01-01" &&
                        dateRange.startDate !== "2020-01-01")
                      ? `0 0 15px ${colors.accent}40`
                      : "none",
                }}
              >
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
                  className={`px-2 py-1 text-xs rounded-md transition-all duration-300 flex items-center gap-1 ${kpiCategories === category.id ? "bg-opacity-90" : "bg-opacity-20 hover:bg-opacity-40"
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
                    className={`p-3 rounded-md text-left transition-all duration-300 flex items-center ${activeKpi === option.id ? "bg-opacity-20 shadow-inner" : "bg-opacity-5 hover:bg-opacity-10"
                      }`}
                    style={{
                      backgroundColor: activeKpi === option.id ? colors.accent : "transparent",
                      boxShadow:
                        activeKpi === option.id
                          ? `inset 0 0 10px ${colors.accent}30, 0 0 15px ${colors.accent}20`
                          : "none",
                      border: `1px solid ${activeKpi === option.id ? colors.accent : "transparent"}`,
                    }}
                  >
                    <span className="mr-2 text-lg" style={{ color: colors.accent }}>
                      {activeKpi === option.id ? "◉" : "○"}
                    </span>
                    <span className="mr-2">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
            </div>

            {/* Radar animation */}
            <div
              className="mt-6 relative h-48 rounded-full overflow-hidden border border-opacity-20"
              style={{ borderColor: colors.accent }}
            >
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
                  boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 2px ${summary?.status === "error"
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

              <div
                className="p-4 rounded-lg backdrop-blur-md border border-opacity-20"
                style={{
                  backgroundColor: colors.glass,
                  borderColor: error ? colors.danger : colors.accent,
                  boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 2px ${error ? colors.danger : colors.accent}40`,
                }}
              >
                <h3 className="text-sm font-semibold opacity-70">Estado del Sistema</h3>
                <div
                  className="text-3xl font-bold mt-2"
                  style={{ color: error ? colors.danger : loading ? colors.warning : colors.accent }}
                >
                  {loading ? "Cargando..." : error ? "Error" : "Operativo"}
                </div>
                <div className="text-sm mt-1 opacity-70">
                  {loading
                    ? "Obteniendo datos..."
                    : error
                      ? error
                      : `${data?.metadata?.kpisExitosos || 0} KPIs activos`}
                </div>
              </div>

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

          {/* Chart */}
          <div
            className="flex-1 p-4 rounded-lg backdrop-blur-md border border-opacity-20 min-h-[400px]"
            style={{
              backgroundColor: colors.glass,
              borderColor: colors.accent,
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 2px ${colors.accent}40`,
            }}
          >
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
                    <div
                      className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"
                      style={{ borderColor: `${colors.accent} transparent ${colors.accent} transparent` }}
                    ></div>
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
                  </div>
                </div>
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
          <div>ECOMMERCE ANALYTICS SYSTEM v1.0</div>
          <div>CLASIFICACIÓN: CONFIDENCIAL</div>
        </div>
      </footer>

      {/* Custom date picker modal */}
      {renderCustomDatePicker()}
    </div>
  )
}
