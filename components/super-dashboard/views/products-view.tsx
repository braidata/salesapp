"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import Card from "../ui/card"
import StatsCard from "../ui/stats-card"
import DataTable from "../ui/data-table"
import { formatCurrency } from "@/lib/utils"
import { exportToExcel } from "@/lib/export-utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function ProductsView({ orders, isLoading }) {
  // Extract all products from orders
  const allProducts = useMemo(() => {
    const products = []
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        products.push({
          ...item,
          orderId: order.orderId,
          orderDate: order.creationDate,
          // Adjust prices with validation
          price: typeof item.price === "number" && !isNaN(item.price) ? item.price / 100 : 0,
          listPrice: typeof item.listPrice === "number" && !isNaN(item.listPrice) ? item.listPrice / 100 : 0,
          sellingPrice:
            typeof item.sellingPrice === "number" && !isNaN(item.sellingPrice) ? item.sellingPrice / 100 : 0,
        })
      })
    })
    return products
  }, [orders])

  // Calculate product statistics
  const totalProducts = allProducts.length
  const totalQuantity = allProducts.reduce((sum, product) => sum + product.quantity, 0)
  const totalValue = allProducts.reduce((sum, product) => {
    const price = typeof product.price === "number" && !isNaN(product.price) ? product.price : 0
    const quantity = typeof product.quantity === "number" && !isNaN(product.quantity) ? product.quantity : 0
    return sum + price * quantity
  }, 0)

  // Group products by category or brand
  const productsByCategory = allProducts.reduce((acc, product) => {
    const category = product.additionalInfo?.brandName || "Sin categoría"
    if (!acc[category]) {
      acc[category] = {
        count: 0,
        quantity: 0,
        value: 0,
      }
    }
    acc[category].count++
    acc[category].quantity += product.quantity
    acc[category].value += product.price * product.quantity
    return acc
  }, {})

  // Prepare data for chart
  const categoryChartData = Object.entries(productsByCategory)
    .map(([name, data]) => ({
      name,
      value: data.value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) // Top 10 categories

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (value) => <span className="font-medium">{value}</span>,
      sortable: true,
    },
    {
      key: "name",
      header: "Producto",
      render: (value, row) => (
        <div className="flex items-center">
          {row.imageUrl && (
            <img
              src={row.imageUrl || "/placeholder.svg"}
              alt={value}
              className="w-10 h-10 rounded-md mr-3 object-cover bg-gray-800"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=40&width=40"
              }}
            />
          )}
          <span>{value}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "refId",
      header: "SKU",
      sortable: true,
    },
    {
      key: "brandName",
      header: "Marca",
      render: (_, row) => row.additionalInfo?.brandName || "-",
      sortable: true,
    },
    {
      key: "quantity",
      header: "Cantidad",
      sortable: true,
    },
    {
      key: "price",
      header: "Precio",
      render: (value) => formatCurrency(value),
      sortable: true,
    },
    {
      key: "total",
      header: "Total",
      render: (_, row) => formatCurrency(row.price * row.quantity),
      sortable: true,
    },
    {
      key: "orderId",
      header: "Pedido",
      render: (value) => (
        <a
          href={`/orders/${value}`}
          className="text-blue-400 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {value}
        </a>
      ),
      sortable: true,
    },
  ]

  const handleExport = () => {
    const data = allProducts.map((product) => ({
      ID: product.id,
      Producto: product.name,
      SKU: product.refId,
      Marca: product.additionalInfo?.brandName || "-",
      Cantidad: product.quantity,
      Precio: formatCurrency(product.price),
      Total: formatCurrency(product.price * product.quantity),
      Pedido: product.orderId,
      Fecha: new Date(product.orderDate).toLocaleDateString("es-CL"),
    }))

    exportToExcel(data, "reporte_productos")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Vista de Productos</h2>

        <motion.button
          onClick={handleExport}
          disabled={isLoading || allProducts.length === 0}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white border border-blue-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Exportar a Excel
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Productos"
          value={totalProducts}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          }
        />

        <StatsCard
          title="Unidades Vendidas"
          value={totalQuantity}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          }
          trend={{ value: 12, isPositive: true }}
        />

        <StatsCard
          title="Valor Total"
          value={formatCurrency(totalValue)}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          }
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Productos Vendidos" isLoading={isLoading}>
            <div className="data-table-container">
              <DataTable
                data={allProducts}
                columns={columns}
                emptyMessage="No hay productos que coincidan con los filtros seleccionados"
              />
            </div>
          </Card>
        </div>

        <div>
          <Card title="Top Categorías por Ventas" isLoading={isLoading}>
            {categoryChartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis type="number" stroke="#888" tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#888"
                      width={100}
                      tickFormatter={(value) => (value.length > 12 ? `${value.substring(0, 12)}...` : value)}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "rgba(22, 27, 34, 0.9)",
                        border: "1px solid #30363d",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="value" fill="url(#colorGradient)" radius={[0, 4, 4, 0]} />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-gray-400">No hay datos disponibles</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

