// components/Dashboard/services/dataServices.ts
import { ChartType, SortOption } from "../types";

// Get default chart type for a KPI
export const getDefaultChartType = (kpiKey: string): ChartType => {
  switch (kpiKey) {
    case "ventaDiariaDelMes":
    case "pedidosDiariosDelMes":
      return "bar";
    case "ticketPromedioDelMes":
    case "comparativos":
      return "line";
    case "traficoPorFuente":
    case "kpisPorCategoria":
    case "kpisPorMarca":
      return "pie";
    case "carrosAbandonados":
    case "audiencia":
      return "area";
    case "tasaConversionWeb":
    case "kpiContestabilidadCorus":
      return "radar";
    case "funnelConversiones":
      return "funnel";
    case "inversionMarketing":
    case "campañas":
    case "tasaAperturaMails":
      return "composed";
    case "kpisDeProductos":
    case "palabrasBuscadas":
    case "clientesPerdidos":
    case "sugerenciasMejora":
      return "treemap";
    default:
      return "bar";
  }
};

// Función para obtener lista de órdenes de VTEX con caché y paginación
export const fetchVtexOrdersList = async (
  startDate: string, 
  endDate: string, 
  page: number = 1, 
  perPage: number = 20, 
  forceRefresh: boolean = false,
  vtexCache: any,
  setVtexCache: Function,
  setVtexPagination: Function,
  setVtexLoading: Function
) => {
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
    setVtexCache((prev: any) => ({
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
      setVtexPagination((prev: any) => ({
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
export const fetchVtexProducts = async (
  categoryId: string = "", 
  brandId: string = "", 
  page: number = 1, 
  perPage: number = 50, 
  forceRefresh: boolean = false,
  vtexCache: any,
  setVtexCache: Function,
  setVtexPagination: Function,
  setVtexLoading: Function
) => {
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
    setVtexCache((prev: any) => ({
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
    setVtexPagination((prev: any) => ({
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
export const fetchVtexOrderData = async (
  orderId: string, 
  forceRefresh: boolean = false,
  vtexCache: any,
  setVtexCache: Function
) => {
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
    setVtexCache((prev: any) => ({
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
export const convertRelativeDateToISO = (dateStr: string): string => {
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
export const adaptVtexDataToKpis = (productsData: any[]) => {
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
      topProducts: productsData.map((product: any) => ({
        name: product.productName || "Producto sin nombre",
        value: product.items?.[0]?.sellers?.[0]?.commertialOffer?.AvailableQuantity || 0,
        stock: product.items?.[0]?.sellers?.[0]?.commertialOffer?.AvailableQuantity || 0,
        price: product.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || 0,
        category: (product.categories?.[0] || "").split("/").filter((s: string) => s).pop() || "Sin categoría",
        brand: product.brand || "Sin marca",
      }))
    }
  };

  // Para kpisPorCategoria
  const categoriesMap = new Map();
  productsData.forEach(product => {
    const categoryPath = product.categories?.[0] || "";
    const categoryParts = categoryPath.split("/").filter((s: string) => s);
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
          category: (product.categories?.[0] || "").split("/").filter((s: string) => s).pop() || "Sin categoría",
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

// Helper functions for dates and formatting
export const formatDate = (dateString: string): string => {
  if (!dateString) return "";

  // Format YYYYMMDD to DD/MM
  if (dateString.length === 8) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return `${day}/${month}`;
  }
  
  // Si es una fecha ISO (YYYY-MM-DD)
  if (dateString.includes('-') && dateString.split('-').length === 3) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}`;
  }
  
  // Si es una fecha con barras (MM/DD/YYYY o similar)
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length >= 2) {
      // Asumiendo que el formato original es MM/DD
      return `${parts[1]}/${parts[0]}`;
    }
  }

  return dateString;
};

// Format currency values
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};