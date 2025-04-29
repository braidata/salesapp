// pages/api/apiVTEXRobots.ts

import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const {
    daysBack,
    startDate,
    endDate,
    paymentMethod,
    shippingMethod,
    status,
    origin,
    page,
    perPage,
    getAllPages,
  } = req.query;

  console.log("API request received with params:", req.query);

  const filters: string[] = [];
  const today = new Date();

  // Filtrado por rango de fechas
  if (daysBack) {
    const days = parseInt(daysBack as string, 10);
    if (!isNaN(days)) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - days);
      filters.push(
        `f_creationDate=creationDate:[${pastDate.toISOString()} TO ${today.toISOString()}]`
      );
    }
  } else if (startDate && endDate) {
    filters.push(`f_creationDate=creationDate:[${startDate} TO ${endDate}]`);
  }

  // Filtrar por método de pago
  if (paymentMethod) {
    filters.push(`f_paymentNames=${paymentMethod}`);
  }

  // Filtrar por estado del pedido
  if (status) {
    filters.push(`f_status=${status}`);
  }

  // Filtrar por origen (si lo usas)
  if (origin) {
    filters.push(`f_origin=${origin}`);
  }

  // Paginación - usando los parámetros correctos
  const perPageNum = parseInt(perPage as string) || 15;
  
  // Ordenamiento - usando el formato correcto
  filters.push(`orderBy=creationDate,desc`);

  const API_VTEX_TOKEN_BBQ = process.env.API_VTEX_TOKEN_BBQ;

  if (!API_VTEX_TOKEN_BBQ) {
    return res
      .status(500)
      .json({ message: "API_VTEX_TOKEN_BBQ no está configurada en las variables de entorno" });
  }

  try {
    // Si se solicita obtener todas las páginas
    if (getAllPages === 'true') {
      // Como la API no permite una buena paginación, usaremos un enfoque alternativo:
      // Dividir el rango de fechas en múltiples solicitudes más pequeñas
      
      console.log("Using time windows approach to get all orders");
      
      // Determinar el rango de fechas total
      let startDateTime: Date;
      let endDateTime: Date = new Date();
      
      if (startDate && endDate) {
        startDateTime = new Date(startDate as string);
        endDateTime = new Date(endDate as string);
      } else if (daysBack) {
        const days = parseInt(daysBack as string, 10);
        startDateTime = new Date();
        startDateTime.setDate(endDateTime.getDate() - days);
      } else {
        // Por defecto, últimos 30 días si no se especifica
        startDateTime = new Date();
        startDateTime.setDate(endDateTime.getDate() - 30);
      }
      
      // Calcular la diferencia en días
      const diffTime = Math.abs(endDateTime.getTime() - startDateTime.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      console.log(`Total date range: ${diffDays} days from ${startDateTime.toISOString()} to ${endDateTime.toISOString()}`);
      
      // Dividir en ventanas de tiempo más pequeñas (por ejemplo, 7 días cada una)
      const windowSize = 7; // días por ventana
      const numWindows = Math.ceil(diffDays / windowSize);
      
      console.log(`Dividing into ${numWindows} time windows of ${windowSize} days each`);
      
      const allOrders: any[] = [];
      const seenOrderIds = new Set<string>();
      
      // Procesar cada ventana de tiempo
      for (let i = 0; i < numWindows; i++) {
        const windowStart = new Date(startDateTime);
        windowStart.setDate(startDateTime.getDate() + (i * windowSize));
        
        const windowEnd = new Date(windowStart);
        // Si es la última ventana, usar la fecha final exacta
        if (i === numWindows - 1) {
          windowEnd.setTime(endDateTime.getTime());
        } else {
          windowEnd.setDate(windowStart.getDate() + windowSize - 1);
          // Establecer al final del día
          windowEnd.setHours(23, 59, 59, 999);
        }
        
        console.log(`Processing window ${i+1}/${numWindows}: ${windowStart.toISOString()} to ${windowEnd.toISOString()}`);
        
        // Construir los filtros para esta ventana
        const windowFilters = [...filters.filter(f => !f.startsWith('f_creationDate'))];
        windowFilters.push(`f_creationDate=creationDate:[${windowStart.toISOString()} TO ${windowEnd.toISOString()}]`);
        windowFilters.push(`per_page=${perPageNum}`);
        windowFilters.push(`page=1`);
        
        const queryString = windowFilters.length ? `?${windowFilters.join("&")}` : "";
        const url = `https://bbqgrill.myvtex.com/api/oms/pvt/orders${queryString}`;
        
        console.log(`Requesting orders for window ${i+1}: ${url}`);
        
        // Hacer la solicitud a la API
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-VTEX-API-AppKey": process.env.API_VTEX_KEY_BBQ || "",
            "X-VTEX-API-AppToken": process.env.API_VTEX_TOKEN_BBQ || "",
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error in window ${i+1}: ${errorText}`);
          continue; // Continuar con la siguiente ventana en caso de error
        }
        
        const data = await response.json();
        const windowOrders = data.list || [];
        
        console.log(`Window ${i+1}: found ${windowOrders.length} orders`);
        
        // Filtrar pedidos duplicados
        let newOrdersCount = 0;
        for (const order of windowOrders) {
          if (!seenOrderIds.has(order.orderId)) {
            order._sourceWindow = i + 1;
            allOrders.push(order);
            seenOrderIds.add(order.orderId);
            newOrdersCount++;
          }
        }
        
        console.log(`Window ${i+1}: added ${newOrdersCount} unique orders`);
        
        // Verificar si hay paginación y procesarla
        if (data.paging && data.paging.pages > 1) {
          const totalPages = Math.min(data.paging.pages, 30); // Máximo 30 páginas según la documentación
          
          for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
            const pageFilters = [...windowFilters.filter(f => !f.startsWith('page='))];
            pageFilters.push(`page=${pageNum}`);
            
            const pageQueryString = pageFilters.length ? `?${pageFilters.join("&")}` : "";
            const pageUrl = `https://bbqgrill.myvtex.com/api/oms/pvt/orders${pageQueryString}`;
            
            console.log(`Requesting window ${i+1}, page ${pageNum}: ${pageUrl}`);
            
            try {
              const pageResponse = await fetch(pageUrl, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "X-VTEX-API-AppKey": process.env.API_VTEX_KEY_BBQ || "",
                  "X-VTEX-API-AppToken": process.env.API_VTEX_TOKEN_BBQ || "",
                },
              });
              
              if (!pageResponse.ok) {
                const errorText = await pageResponse.text();
                console.error(`Error in window ${i+1}, page ${pageNum}: ${errorText}`);
                continue;
              }
              
              const pageData = await pageResponse.json();
              const pageOrders = pageData.list || [];
              
              console.log(`Window ${i+1}, Page ${pageNum}: found ${pageOrders.length} orders`);
              
              // Filtrar pedidos duplicados
              let newPageOrdersCount = 0;
              for (const order of pageOrders) {
                if (!seenOrderIds.has(order.orderId)) {
                  order._sourceWindow = i + 1;
                  order._sourcePage = pageNum;
                  allOrders.push(order);
                  seenOrderIds.add(order.orderId);
                  newPageOrdersCount++;
                }
              }
              
              console.log(`Window ${i+1}, Page ${pageNum}: added ${newPageOrdersCount} unique orders`);
            } catch (error) {
              console.error(`Error processing window ${i+1}, page ${pageNum}:`, error);
            }
          }
        }
      }
      
      // Si necesitamos obtener detalles de cada pedido para filtrar
      let filteredOrders = allOrders;
      
      if (shippingMethod || paymentMethod) {
        console.log("Fetching detailed order data for filtering...");
        filteredOrders = await getDetailedOrders(allOrders, shippingMethod as string, paymentMethod as string);
      }
      
      // Análisis final de los datos
      const ordersByWindow: Record<number, number> = {};
      filteredOrders.forEach(order => {
        const sourceWindow = order._sourceWindow || 0;
        ordersByWindow[sourceWindow] = (ordersByWindow[sourceWindow] || 0) + 1;
      });
      
      console.log(`Distribution of orders by time window: ${JSON.stringify(ordersByWindow)}`);
      console.log(`Total unique orders: ${filteredOrders.length}`);
      
      // Construir respuesta
      const result = {
        list: filteredOrders,
        paging: {
          total: filteredOrders.length,
          pages: 1,
          currentPage: 1,
          perPage: filteredOrders.length,
        }
      };
      
      return res.status(200).json(result);
    } else {
      // Comportamiento original - una sola página
      const pageNum = parseInt(page as string) || 1;
      filters.push(`page=${pageNum}`);
      filters.push(`per_page=${perPageNum}`);
      
      const queryString = filters.length ? `?${filters.join("&")}` : "";
      const VTEX_API_URL = `https://bbqgrill.myvtex.com/api/oms/pvt/orders${queryString}`;
      
      console.log("Requesting VTEX orders with URL:", VTEX_API_URL);
      
      const response = await fetch(VTEX_API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-VTEX-API-AppKey": process.env.API_VTEX_KEY_BBQ || "",
          "X-VTEX-API-AppToken": process.env.API_VTEX_TOKEN_BBQ || "",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en la API de VTEX: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Aseguramos que data.list sea un array
      if (!Array.isArray(data.list)) {
        data.list = [];
        return res.status(200).json(data);
      }

      // Si se solicita filtrar por shippingMethod o paymentMethod, obtenemos detalles de cada pedido
      if (shippingMethod || paymentMethod) {
        data.list = await getDetailedOrders(data.list, shippingMethod as string, paymentMethod as string);
      }

      data.paging = {
        total: data.paging?.total || data.list.length,
        pages:
          data.paging?.pages ||
          Math.ceil((data.paging?.total || data.list.length) / perPageNum),
        currentPage: pageNum,
        perPage: perPageNum,
      };

      console.log(`Returning ${data.list.length} orders`);
      return res.status(200).json(data);
    }
  } catch (error) {
    console.error("Error al obtener las órdenes de VTEX:", error);
    return res.status(500).json({ message: "Error al obtener las órdenes de VTEX" });
  }
}

// Función para obtener detalles de las órdenes y aplicar filtros adicionales
async function getDetailedOrders(ordersList: any[], shippingMethod?: string, paymentMethod?: string) {
  console.log("Fetching detailed order data for filtering...");
  const detailedOrders = await Promise.all(
    ordersList.map(async (order: any) => {
      try {
        const detailUrl = `https://bbqgrill.myvtex.com/api/oms/pvt/orders/${order.orderId}`;
        const detailResponse = await fetch(detailUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-VTEX-API-AppKey": process.env.API_VTEX_KEY_BBQ || "",
            "X-VTEX-API-AppToken": process.env.API_VTEX_TOKEN_BBQ || "",
          },
        });
        
        if (!detailResponse.ok) {
          console.warn(`Error fetching details for order ${order.orderId}: ${detailResponse.status}`);
          return order;
        }
        
        const detailData = await detailResponse.json();
        
        const enhancedOrder = {
          ...order,
          shippingData: {
            address: detailData.shippingData?.address,
            logisticsInfo: detailData.shippingData?.logisticsInfo?.map((item: any) => ({
              itemIndex: item.itemIndex,
              selectedSla: item.selectedSla,
              selectedDeliveryChannel: item.selectedDeliveryChannel,
              deliveryChannel: item.deliveryChannel,
              deliveryCompany: item.deliveryCompany,
              shippingEstimate: item.shippingEstimate,
            })),
          },
          paymentData: {
            transactions: detailData.paymentData?.transactions?.map((t: any) => ({
              transactionId: t.transactionId,
              payments: t.payments?.map((p: any) => ({
                paymentSystem: p.paymentSystem,
                paymentSystemName: p.paymentSystemName,
                value: p.value,
                installments: p.installments,
                connectorResponses: p.connectorResponses,
              })),
            })),
          },
          customData: detailData.customData,
          clientProfileData: detailData.clientProfileData,
          marketingData: detailData.marketingData,
          isDetailedOrder: true,
        };
        
        return enhancedOrder;
      } catch (err) {
        console.error(`Error processing order ${order.orderId}:`, err);
        return order;
      }
    })
  );
  
  let filteredOrders = detailedOrders;
  
  if (shippingMethod) {
    console.log(`Filtering by delivery channel: ${shippingMethod}`);
    filteredOrders = filteredOrders.filter((order: any) => {
      if (!order.shippingData?.logisticsInfo) return false;
      return order.shippingData.logisticsInfo.some((item: any) =>
        item.selectedDeliveryChannel === shippingMethod
      );
    });
    console.log(`Filtered to ${filteredOrders.length} orders with delivery channel ${shippingMethod}`);
  }
  
  if (paymentMethod) {
    console.log(`Applying detailed payment method filter: ${paymentMethod}`);
    filteredOrders = filteredOrders.filter((order: any) => {
      if (!order.isDetailedOrder || !order.paymentData) {
        return order.paymentNames === paymentMethod;
      }
      return order.paymentData.transactions?.some((t: any) =>
        t.payments?.some((p: any) => p.paymentSystemName === paymentMethod)
      );
    });
    console.log(`Filtered to ${filteredOrders.length} orders with payment method ${paymentMethod}`);
  }
  
  return filteredOrders;
}