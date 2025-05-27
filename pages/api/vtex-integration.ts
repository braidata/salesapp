// pages/api/vtex-integration.ts
import type { NextApiRequest, NextApiResponse } from 'next'

// Variables de entorno para la conexión a VTEX
const VTEX_API_BASE = process.env.VTEX_API_BASE_URL || ''
const VTEX_ORDERS_ENDPOINT = '/api/oms/pvt/orders'
const VTEX_PRODUCTS_ENDPOINT = '/api/catalog_system/pub/products'

// Tipos de respuesta
interface Order {
  orderId: string
  creationDate: string
  totalValue: number
  [key: string]: any
}

interface Product {
  productId: string
  productName: string
  stock?: number
  price?: number
  [key: string]: any
}

interface VTEXIntegrationResponse {
  orders: Order[] | null
  products: Product[] | null
  dailySales: { date: string; value: number }[]
  totalRevenue: number
}

async function fetchVtexOrdersList(
  startDate: string,
  endDate: string,
  page = 1,
  perPage = 50
): Promise<Order[] | null> {
  try {
    const url = `${VTEX_API_BASE}${VTEX_ORDERS_ENDPOINT}?f_creationDate=creationDate:[${startDate} TO ${endDate}]&page=${page}&per_page=${perPage}`
    const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
    if (!response.ok) throw new Error(`VTEX orders fetch error: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('fetchVtexOrdersList error', error)
    return null
  }
}

async function fetchVtexProducts(
  categoryId?: string,
  brandId?: string
): Promise<Product[] | null> {
  try {
    let url = `${VTEX_API_BASE}${VTEX_PRODUCTS_ENDPOINT}/search?_from=0&_to=49`
    if (categoryId) url += `&fq=C:/${categoryId}/`
    if (brandId) url += `&fq=brand:${brandId}`
    const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
    if (!response.ok) throw new Error(`VTEX products fetch error: ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('fetchVtexProducts error', error)
    return null
  }
}

function processDailySales(orders: Order[] | null) {
  if (!orders) return []
  const salesByDate: Record<string, number> = {}
  orders.forEach(order => {
    const d = new Date(order.creationDate)
    const key = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
    const value = order.totalValue / 100
    salesByDate[key] = (salesByDate[key] || 0) + value
  })
  return Object.entries(salesByDate).map(([date, value]) => ({ date, value }))
}

function calculateTotalRevenue(orders: Order[] | null) {
  if (!orders) return 0
  return orders.reduce((sum, o) => sum + o.totalValue / 100, 0)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VTEXIntegrationResponse>
) {
  const { startDate, endDate, page, perPage, categoryId, brandId } = req.query
  // Validar fechas
  if (typeof startDate !== 'string' || typeof endDate !== 'string') {
    return res.status(400).json({ orders: null, products: null, dailySales: [], totalRevenue: 0 })
  }

  const orders = await fetchVtexOrdersList(startDate, endDate, Number(page) || 1, Number(perPage) || 50)
  const products = await fetchVtexProducts(
    typeof categoryId === 'string' ? categoryId : undefined,
    typeof brandId === 'string' ? brandId : undefined
  )
  const dailySales = processDailySales(orders)
  const totalRevenue = calculateTotalRevenue(orders)

  res.status(200).json({ orders, products, dailySales, totalRevenue })
}
