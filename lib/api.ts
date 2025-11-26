// lib/fetch-all-orders.ts

interface FetchAllOrdersParams {
  daysBack?: number;
  view?: string;
  status?: string;
  courier?: string;        // deliveryCompany (transportista)
  paymentType?: string;    // paymentNames en la API
  deliveryType?: string;   // selectedDeliveryChannel en logisticsInfo
  dateStart?: string | Date | null;
  dateEnd?: string | Date | null;
  brand?: string;          // '' para usar apiVTEXRobots (default), 'blanik' para Blanik, 'bbq' para BBQ, 'all' para ambas (Blanik y BBQ)
}

// Cache para evitar sobrecargar la API (separado por marca)
let orderCache = {
  "": { // Default/imegab2c
    timestamp: 0,
    data: null,
    filters: {},
    expiryTimeMs: 5 * 60 * 1000, // 5 minutos
  },
  blanik: {
    timestamp: 0,
    data: null,
    filters: {},
    expiryTimeMs: 5 * 60 * 1000,
  },
  bbq: {
    timestamp: 0,
    data: null,
    filters: {},
    expiryTimeMs: 5 * 60 * 1000,
  },
  all: { // Combinación de Blanik y BBQ
    timestamp: 0,
    data: null,
    filters: {},
    expiryTimeMs: 5 * 60 * 1000,
  }
};

// Función para obtener los detalles completos de un pedido específico
interface FetchOrderDetailsParams {
  orderId: string;
  brand?: string;  // '' para apiVTEXRobots, 'blanik' para Blanik, 'bbq' para BBQ, 'all' para buscar en todas
}

export async function fetchOrderDetails({ orderId, brand = "" }: FetchOrderDetailsParams) {
  if (!orderId) {
    throw new Error("Se requiere orderId para fetchOrderDetails");
  }

  console.log(`Fetching detailed order for ${orderId}, brand: ${brand || 'default'}`);

  // Si brand es "all", intentamos buscar en todas las APIs
  if (brand === "all") {
    try {
      // Primero intentamos en Blanik
      const blanikResponse = await fetch(`/api/apiVTEXRobotsBlanik?orderId=${orderId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (blanikResponse.ok) {
        const data = await blanikResponse.json();
        if (data && Object.keys(data).length > 0) {
          console.log(`Found order ${orderId} in Blanik`);
          // Agregar marca a la respuesta
          return { ...data, marca: "blanik" };
        }
      }

      // Si no se encontró en Blanik, intentamos en BBQ
      const bbqResponse = await fetch(`/api/apiVTEXRobotsBBQ?orderId=${orderId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (bbqResponse.ok) {
        const data = await bbqResponse.json();
        if (data && Object.keys(data).length > 0) {
          console.log(`Found order ${orderId} in BBQ`);
          // Agregar marca a la respuesta
          return { ...data, marca: "bbq" };
        }
      }

      // Si no se encontró en ninguna de las anteriores, intentamos en default
      const defaultResponse = await fetch(`/api/apiVTEXRobots?orderId=${orderId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (defaultResponse.ok) {
        const data = await defaultResponse.json();
        if (data && Object.keys(data).length > 0) {
          console.log(`Found order ${orderId} in default (imegab2c)`);
          // Agregar marca a la respuesta
          return { ...data, marca: "imegab2c" };
        }
      }

      throw new Error(`No se encontró la orden ${orderId} en ninguna marca`);
    } catch (error) {
      console.error(`Error fetching order details for ${orderId}:`, error);
      throw error;
    }
  } else {
    // Seleccionar endpoint según el valor de brand
    let endpoint = "/api/apiVTEXRobots"; // Default endpoint (imegab2c)
    let marcaValue = "imegab2c";

    if (brand) {
      if (brand.toLowerCase() === "blanik") {
        endpoint = "/api/apiVTEXRobotsBlanik";
        marcaValue = "blanik";
      } else if (brand.toLowerCase() === "bbq") {
        endpoint = "/api/apiVTEXRobotsBBQ";
        marcaValue = "bbq";
      }
    }

    try {
      const response = await fetch(`${endpoint}?orderId=${orderId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Fetched detailed order data for ${orderId} from ${marcaValue}`);

      // Agregar marca a la respuesta
      return { ...data, marca: marcaValue };
    } catch (error) {
      console.error(`Error fetching order details for ${orderId} from ${brand}:`, error);
      throw error;
    }
  }
}

/**
 * Formatea una fecha para la API de VTEX
 */
function formatDate(date: string | Date | null) {
  if (!date) return null;
  if (typeof date === "string") {
    if (date.includes("T") && date.includes("Z")) return date;
    date = new Date(date);
  }
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error("Fecha inválida:", date);
    return null;
  }
  return date.toISOString();
}

/**
 * Verifica si los filtros relevantes son iguales (para usar caché)
 */
function areFiltersEqual(filters1: any, filters2: any) {
  const relevantKeys = [
    "daysBack",
    "view",
    "status",
    "paymentType",
    "deliveryType",
    "dateStart",
    "dateEnd",
  ];
  for (const key of relevantKeys) {
    if (!(key in filters1) || !(key in filters2)) continue;
    const val1 = filters1[key];
    const val2 = filters2[key];
    if (key === "dateStart" || key === "dateEnd") {
      const d1 = formatDate(val1);
      const d2 = formatDate(val2);
      if (d1 !== d2) return false;
    } else if (val1 !== val2) {
      return false;
    }
  }
  return true;
}

/**
 * Construye los parámetros base para una solicitud a la API
 */
function buildApiParams(params: FetchAllOrdersParams) {
  const needsDetailedData =
    params.view === "logistica" ||
    params.deliveryType ||
    params.paymentType ||
    params.courier;

  const baseParams: any = {};
  if (params.status) baseParams["status"] = params.status;
  if (params.paymentType) baseParams["paymentMethod"] = params.paymentType;
  if (params.deliveryType) baseParams["shippingMethod"] = params.deliveryType;
  if (params.view) baseParams["view"] = params.view;
  if (needsDetailedData) baseParams["detailed"] = "true";

  // Usar el nuevo parámetro getAllPages
  baseParams["getAllPages"] = "true";

  // Manejo de fechas
  if (params.dateStart && params.dateEnd) {
    const formattedStart = formatDate(params.dateStart);
    const formattedEnd = formatDate(params.dateEnd);
    if (formattedStart && formattedEnd) {
      baseParams["startDate"] = formattedStart;
      baseParams["endDate"] = formattedEnd;
    }
  } else if (params.daysBack) {
    baseParams["daysBack"] = params.daysBack;
  }

  // Configuramos perPage en 100 (máximo) para traer la mayor cantidad de órdenes por request
  baseParams["perPage"] = "100";

  return baseParams;
}

/**
 * Construye la URL con los parámetros
 */
function buildApiUrl(endpoint: string, baseParams: any) {
  const queryParams = new URLSearchParams();
  Object.entries(baseParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  return `${endpoint}?${queryParams.toString()}`;
}

/**
 * Aplica filtros manuales a una lista de órdenes
 */
function applyManualFilters(orders: any[], params: FetchAllOrdersParams) {
  let filteredOrders = [...orders];

  // Filtrado manual por courier
  if (params.courier) {
    console.log(`Filtering orders by courier: ${params.courier}`);
    filteredOrders = filteredOrders.filter((order: any) => {
      if (!order.shippingData?.logisticsInfo?.length) return false;
      return order.shippingData.logisticsInfo.some((info: any) =>
        info.deliveryCompany &&
        info.deliveryCompany.toLowerCase().trim() === params.courier!.toLowerCase().trim()
      );
    });
  }

  // Filtrado manual por deliveryType
  if (params.deliveryType) {
    console.log(`Filtering orders by deliveryType: ${params.deliveryType}`);
    filteredOrders = filteredOrders.filter((order: any) => {
      if (!order.shippingData?.logisticsInfo?.length) return false;
      return order.shippingData.logisticsInfo.some((info: any) =>
        info.selectedDeliveryChannel &&
        info.selectedDeliveryChannel.toLowerCase().trim() === params.deliveryType!.toLowerCase().trim()
      );
    });
  }

  return filteredOrders;
}

/**
 * Realiza una solicitud a la API y retorna las órdenes
 */
async function fetchOrdersFromApi(endpoint: string, baseParams: any, brandName: string) {
  const apiUrl = buildApiUrl(endpoint, baseParams);
  console.log(`Fetching ${brandName} orders with request:`, apiUrl);

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    let orders = data.list || [];

    // Agregar marca a cada orden para identificación
    orders = orders.map((order: any) => ({
      ...order,
      marca: brandName,
      _sourceBrand: brandName
    }));

    console.log(`Total ${brandName} orders fetched: ${orders.length}`);
    return orders;
  } catch (error) {
    console.error(`Error fetching ${brandName} orders:`, error);
    return [];
  }
}

/**
 * Obtiene todos los pedidos
 */
export async function fetchAllOrders(params: FetchAllOrdersParams) {
  const brandToUse = params.brand || "";
  console.log(`fetchAllOrders called with brand: ${brandToUse || 'default'}, params:`, params);

  // Verificar si podemos usar caché
  const now = Date.now();
  const cacheEntry = orderCache[brandToUse] || orderCache[""];
  const cacheIsValid =
    cacheEntry.data !== null &&
    now - cacheEntry.timestamp < cacheEntry.expiryTimeMs &&
    areFiltersEqual(params, cacheEntry.filters);

  if (cacheIsValid) {
    console.log(`Using cached ${brandToUse || 'default'} orders data`);
    let filteredCacheData = applyManualFilters(cacheEntry.data, params);
    console.log(`Filtered cached data length: ${filteredCacheData.length}`);

    return {
      success: true,
      list: filteredCacheData,
      pagination: {
        page: 1,
        perPage: filteredCacheData.length,
        total: filteredCacheData.length,
        pages: 1,
      },
    };
  }

  // Construir parámetros base
  const baseParams = buildApiParams(params);
  let allOrders = [];

  if (brandToUse === "all") {
    // Consultar Blanik, BBQ y Ventus (imegab2c) y combinar resultados
    console.log("Fetching orders from Blanik, BBQ and Ventus");
    const [blanikOrders, bbqOrders, ventusOrders] = await Promise.all([
      fetchOrdersFromApi("/api/apiVTEXRobotsBlanik", baseParams, "blanik"),
      fetchOrdersFromApi("/api/apiVTEXRobotsBBQ", baseParams, "bbq"),
      fetchOrdersFromApi("/api/apiVTEXRobots", baseParams, "imegab2c") // AGREGAR ESTA LÍNEA
    ]);

    allOrders = [...blanikOrders, ...bbqOrders, ...ventusOrders]; // ACTUALIZAR ESTA LÍNEA
    console.log(`Combined orders from all brands: ${allOrders.length}`);
  } else {
    // Consultar la API correspondiente a la marca especificada
    let endpoint = "/api/apiVTEXRobots"; // Default endpoint (imegab2c)
    let marcaValue = "imegab2c";

    if (brandToUse === "blanik") {
      endpoint = "/api/apiVTEXRobotsBlanik";
      marcaValue = "blanik";
    } else if (brandToUse === "bbq") {
      endpoint = "/api/apiVTEXRobotsBBQ";
      marcaValue = "bbq";
    }

    allOrders = await fetchOrdersFromApi(endpoint, baseParams, marcaValue);
  }

  // Verificar duplicados
  const uniqueOrderIds = new Set(allOrders.map((order: any) => order.orderId));
  console.log(`Número total de órdenes: ${allOrders.length}`);
  console.log(`Número de IDs únicos: ${uniqueOrderIds.size}`);

  if (allOrders.length > uniqueOrderIds.size) {
    console.warn(`¡Atención! Se encontraron ${allOrders.length - uniqueOrderIds.size} órdenes duplicadas`);

    // Deduplicar pedidos por orderId, priorizando Blanik sobre BBQ y ambos sobre imegab2c
    const orderMap = new Map();
    allOrders.forEach((order: any) => {
      const existingOrder = orderMap.get(order.orderId);

      if (!existingOrder) {
        orderMap.set(order.orderId, order);
      } else if (order.marca === "blanik" && existingOrder.marca !== "blanik") {
        // Priorizar Blanik sobre otras marcas
        orderMap.set(order.orderId, order);
      } else if (order.marca === "bbq" && existingOrder.marca === "imegab2c") {
        // Priorizar BBQ sobre imegab2c
        orderMap.set(order.orderId, order);
      }
    });

    allOrders = Array.from(orderMap.values());
    console.log(`After deduplication: ${allOrders.length} orders`);
  }

  // Guardar en caché
  if (orderCache[brandToUse]) {
    orderCache[brandToUse] = {
      timestamp: now,
      data: allOrders,
      filters: { ...params, courier: null, deliveryType: null },
      expiryTimeMs: orderCache[brandToUse].expiryTimeMs,
    };
  } else {
    orderCache[""] = {
      timestamp: now,
      data: allOrders,
      filters: { ...params, courier: null, deliveryType: null },
      expiryTimeMs: orderCache[""].expiryTimeMs,
    };
  }

  // Aplicar filtros manuales
  const filteredOrders = applyManualFilters(allOrders, params);
  console.log(`Final filtered orders count: ${filteredOrders.length}`);

  // Información de diagnóstico
  if (filteredOrders.length > 15) {
    console.log("Muestra de IDs de órdenes (primeras 5):", filteredOrders.slice(0, 5).map((o: any) => o.orderId));
    console.log("Muestra de IDs de órdenes (últimas 5):", filteredOrders.slice(-5).map((o: any) => o.orderId));
  }

  return {
    success: true,
    list: filteredOrders,
    pagination: {
      page: 1,
      perPage: filteredOrders.length,
      total: filteredOrders.length,
      pages: 1,
    },
  };
}