// Función para obtener órdenes de VTEX
export async function getVtexOrders(startDate: string, endDate: string, page = 1, perPage = 50) {
  try {
    const VTEX_API_URL = `https://imegab2c.myvtex.com/api/oms/pvt/orders?f_creationDate=creationDate:[${startDate}T00:00:00.000Z TO ${endDate}T23:59:59.999Z]&page=${page}&per_page=${perPage}`

    const response = await fetch(VTEX_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VTEX-API-AppKey": process.env.API_VTEX_KEY || "",
        "X-VTEX-API-AppToken": process.env.API_VTEX_TOKEN || "",
      },
    })

    if (!response.ok) {
      throw new Error(`Error en la API de VTEX: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error al obtener órdenes de VTEX:", error)
    return null
  }
}

// Función para obtener productos de VTEX
export async function getVtexProducts(categoryId?: string, brandId?: string, from = 0, to = 49) {
  try {
    let VTEX_API_URL = `https://imegab2c.myvtex.com/api/catalog_system/pvt/products/search?_from=${from}&_to=${to}`

    if (categoryId) {
      VTEX_API_URL += `&fq=C:/${categoryId}/`
    }

    if (brandId) {
      VTEX_API_URL += `&fq=B:${brandId}`
    }

    const response = await fetch(VTEX_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VTEX-API-AppKey": process.env.API_VTEX_KEY || "",
        "X-VTEX-API-AppToken": process.env.API_VTEX_TOKEN || "",
      },
    })

    if (!response.ok) {
      throw new Error(`Error en la API de VTEX: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error al obtener productos de VTEX:", error)
    return null
  }
}

// Función para obtener detalles de una orden específica
export async function getVtexOrderDetails(orderId: string) {
  try {
    const VTEX_API_URL = `https://imegab2c.myvtex.com/api/oms/pvt/orders/${orderId}`

    const response = await fetch(VTEX_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VTEX-API-AppKey": process.env.API_VTEX_KEY || "",
        "X-VTEX-API-AppToken": process.env.API_VTEX_TOKEN || "",
      },
    })

    if (!response.ok) {
      throw new Error(`Error en la API de VTEX: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error al obtener detalles de la orden de VTEX:", error)
    return null
  }
}

// Función para procesar datos de ventas diarias de VTEX
export function processVtexDailySales(orders: any) {
  if (!orders || !orders.list) return []

  // Agrupar órdenes por fecha
  const ordersByDate: Record<string, { count: number; totalValue: number }> = {}

  orders.list.forEach((order: any) => {
    // Extraer fecha (YYYY-MM-DD)
    const orderDate = order.creationDate.split("T")[0]
    // Convertir a formato YYYYMMDD para compatibilidad con GA4
    const formattedDate = orderDate.replace(/-/g, "")

    if (!ordersByDate[formattedDate]) {
      ordersByDate[formattedDate] = {
        count: 0,
        totalValue: 0,
      }
    }

    // Solo contar órdenes con pagos aprobados o en proceso de entrega
    if (order.status === "handling" || order.status === "ready-for-handling" || order.paymentApprovedDate) {
      ordersByDate[formattedDate].count += 1
      // El valor viene en centavos, lo convertimos a unidades
      ordersByDate[formattedDate].totalValue += order.totalValue / 100
    }
  })

  // Convertir a formato de array para gráficos
  return Object.entries(ordersByDate).map(([date, data]) => ({
    date,
    value: data.totalValue,
    orders: data.count,
    rawDate: date,
  }))
}

