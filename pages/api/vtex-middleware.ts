import type { NextApiRequest, NextApiResponse } from "next"
import { getVtexOrders, processVtexDailySales } from "../../utils/vtex-helpers"

export async function enrichWithVtexData(ga4Data: any, startDate: string, endDate: string) {
  try {
    // Convertir fechas relativas a formato ISO para VTEX
    let vtexStartDate = startDate
    let vtexEndDate = endDate

    if (startDate === "30daysAgo") {
      const date = new Date()
      date.setDate(date.getDate() - 30)
      vtexStartDate = date.toISOString().split("T")[0]
    } else if (startDate === "7daysAgo") {
      const date = new Date()
      date.setDate(date.getDate() - 7)
      vtexStartDate = date.toISOString().split("T")[0]
    } else if (startDate === "today") {
      vtexStartDate = new Date().toISOString().split("T")[0]
    } else if (startDate === "yesterday") {
      const date = new Date()
      date.setDate(date.getDate() - 1)
      vtexStartDate = date.toISOString().split("T")[0]
    }

    if (endDate === "today") {
      vtexEndDate = new Date().toISOString().split("T")[0]
    }

    // Obtener datos de VTEX
    const vtexOrders = await getVtexOrders(vtexStartDate, vtexEndDate)
    
    if (!vtexOrders || !vtexOrders.list) {
      console.warn("No se pudieron obtener datos de VTEX")
      return ga4Data
    }

    // Procesar datos de ventas diarias
    const vtexDailySales = processVtexDailySales(vtexOrders)
    
    // Calcular totales
    const vtexTotalRevenue = vtexDailySales.reduce((sum, day) => sum + day.value, 0)
    const vtexTotalOrders = vtexDailySales.reduce((sum, day) => sum + day.orders, 0)
    
    // Enriquecer datos de GA4 con datos de VTEX
    const enrichedData = { ...ga4Data }
    
    // Enriquecer venta diaria
    if (enrichedData.ventaDiariaDelMes) {
      enrichedData.ventaDiariaDelMes.vtexData = {
        dailySales: vtexDailySales,
        totalRevenue: vtexTotalRevenue,
        promedioDiario: vtexDailySales.length > 0 ? vtexTotalRevenue / vtexDailySales.length : 0,
      }
    }
    
    // Enriquecer pedidos diarios
    if (enrichedData.pedidosDiariosDelMes) {
      enrichedData.pedidosDiariosDelMes.vtexData = {
        dailyOrders: vtexDailySales,
        totalOrders: vtexTotalOrders,
        promedioDiario: vtexDailySales.length > 0 ? vtexTotalOrders / vtexDailySales.length : 0,
      }
    }
    
    // Enriquecer ticket promedio
    if (enrichedData.ticketPromedioDelMes) {
      const vtexTicketPromedio = vtexTotalOrders > 0 ? vtexTotalRevenue / vtexTotalOrders : 0
      
      enrichedData.ticketPromedioDelMes.vtexData = {
        ticketPromedio: vtexTicketPromedio,
        totalRevenue: vtexTotalRevenue,
        totalOrders: vtexTotalOrders,
      }
    }
    
    return enrichedData
  } catch (error) {
    console.error("Error al enriquecer datos con VTEX:", error)
    return ga4Data
  }
}
