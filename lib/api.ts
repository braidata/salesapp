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
  brand?: string;          // 'blanik' para usar el endpoint de Blanik, de lo contrario se usa el otro
}

// Cache para evitar sobrecargar la API
let orderCache = {
  timestamp: 0,
  data: null,
  filters: {},
  expiryTimeMs: 5 * 60 * 1000, // 5 minutos
};

// Función para obtener los detalles completos de un pedido específico
// Agregar esta función a tu archivo lib/api.ts

interface FetchOrderDetailsParams {
  orderId: string;
  brand?: string;  // 'blanik' para usar el endpoint de Blanik
}

export async function fetchOrderDetails({ orderId, brand }: FetchOrderDetailsParams) {
  if (!orderId) {
    throw new Error("Se requiere orderId para fetchOrderDetails");
  }

  console.log(`Fetching detailed order for ${orderId}, brand: ${brand || 'default'}`);

  // Seleccionar endpoint según el valor de brand
  const endpoint =
    brand && brand.toLowerCase() === "blanik"
      ? "/api/apiVTEXRobotsBlanik"
      : "/api/apiVTEXRobots";

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
    console.log(`Fetched detailed order data for ${orderId}: ${JSON.stringify(data)}`);
    
    return data;
  } catch (error) {
    console.error(`Error fetching order details for ${orderId}:`, error);
    throw error;
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
    "brand", // se incluye brand para que la caché respete la marca
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
 * Obtiene todos los pedidos usando el nuevo parámetro getAllPages
 */
export async function fetchAllOrders(params: FetchAllOrdersParams) {
  console.log("fetchAllOrders called with params:", params);

  // Para la vista de logística, se requieren datos detallados
  const needsDetailedData =
    params.view === "logistica" ||
    params.deliveryType ||
    params.paymentType ||
    params.courier;

  // Verificar si podemos usar caché
  const now = Date.now();
  const cacheIsValid =
    orderCache.data !== null &&
    now - orderCache.timestamp < orderCache.expiryTimeMs &&
    areFiltersEqual(params, orderCache.filters);

  if (cacheIsValid) {
    console.log("Using cached orders data");
    let filteredCacheData = orderCache.data;

    // Filtro manual por courier
    if (params.courier) {
      console.log(`Filtering cached data by courier: ${params.courier}`);
      filteredCacheData = filteredCacheData.filter((order: any) => {
        if (!order.shippingData?.logisticsInfo?.length) return false;
        return order.shippingData.logisticsInfo.some((info: any) =>
          info.deliveryCompany &&
          info.deliveryCompany.toLowerCase().trim() === params.courier!.toLowerCase().trim()
        );
      });
    }

    // Filtro manual por deliveryType
    if (params.deliveryType) {
      console.log(`Filtering cached data by deliveryType: ${params.deliveryType}`);
      filteredCacheData = filteredCacheData.filter((order: any) => {
        if (!order.shippingData?.logisticsInfo?.length) return false;
        return order.shippingData.logisticsInfo.some((info: any) =>
          info.selectedDeliveryChannel &&
          info.selectedDeliveryChannel.toLowerCase().trim() === params.deliveryType!.toLowerCase().trim()
        );
      });
    }

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

  // Construir parámetros para la API interna
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

  // Construir URL con todos los parámetros
  const queryParams = new URLSearchParams();
  Object.entries(baseParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  // Seleccionar endpoint según el valor de brand
  const endpoint =
    params.brand && params.brand.toLowerCase() === "blanik"
      ? "/api/apiVTEXRobotsBlanik"
      : "/api/apiVTEXRobots";

  const apiUrl = `${endpoint}?${queryParams.toString()}`;
  console.log("Fetching all orders with single request:", apiUrl);

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
    let allOrders = data.list || [];
    
    console.log(`Total orders fetched: ${allOrders.length}`);

    // Guardamos en caché los resultados originales, incluyendo brand
    orderCache = {
      timestamp: now,
      data: allOrders,
      filters: { ...params, courier: null, deliveryType: null },
      expiryTimeMs: orderCache.expiryTimeMs,
    };

    // Filtrado manual final por courier
    if (params.courier) {
      console.log(`Filtering all orders by courier: ${params.courier}`);
      allOrders = allOrders.filter((order: any) => {
        if (!order.shippingData?.logisticsInfo?.length) return false;
        return order.shippingData.logisticsInfo.some((info: any) =>
          info.deliveryCompany &&
          info.deliveryCompany.toLowerCase().trim() === params.courier!.toLowerCase().trim()
        );
      });
    }
    
    // Filtrado manual final por deliveryType
    if (params.deliveryType) {
      console.log(`Filtering all orders by deliveryType: ${params.deliveryType}`);
      allOrders = allOrders.filter((order: any) => {
        if (!order.shippingData?.logisticsInfo?.length) return false;
        return order.shippingData.logisticsInfo.some((info: any) =>
          info.selectedDeliveryChannel &&
          info.selectedDeliveryChannel.toLowerCase().trim() === params.deliveryType!.toLowerCase().trim()
        );
      });
    }

    // Verificar que los datos sean realmente únicos
    const uniqueOrderIds = new Set(allOrders.map((order: any) => order.orderId));
    console.log(`Número total de órdenes: ${allOrders.length}`);
    console.log(`Número de IDs únicos: ${uniqueOrderIds.size}`);

    if (allOrders.length > uniqueOrderIds.size) {
      console.warn(`¡Atención! Se encontraron ${allOrders.length - uniqueOrderIds.size} órdenes duplicadas`);
    }

    // Información de diagnóstico para verificar la paginación
    if (allOrders.length > 15) {
      console.log("Muestra de IDs de órdenes (primeras 5):", allOrders.slice(0, 5).map((o: any) => o.orderId));
      console.log("Muestra de IDs de órdenes (últimas 5):", allOrders.slice(-5).map((o: any) => o.orderId));
    }

    // Validar distribución por página
    const ordersByPage: Record<string, number> = {};
    allOrders.forEach((order: any) => {
      if (order._sourcePage) {
        ordersByPage[order._sourcePage] = (ordersByPage[order._sourcePage] || 0) + 1;
      }
    });
    console.log("Distribución de órdenes por página:", ordersByPage);

    // Deduplicar pedidos por orderId para evitar repeticiones
    allOrders = Array.from(
      new Map(allOrders.map((order: any) => [order.orderId, order])).values()
    );
    console.log(`After deduplication: ${allOrders.length} orders`);

    return {
      success: true,
      list: allOrders,
      pagination: {
        page: 1,
        perPage: allOrders.length,
        total: allOrders.length,
        pages: 1,
      },
    };
  } catch (error) {
    console.error("Error fetching all orders:", error);
    throw error;
  }
}
