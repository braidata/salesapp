"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import Card from "../ui/card"
import StatsCard from "../ui/stats-card"
import { formatCurrency } from "@/lib/utils"
import { exportToExcel } from "@/lib/export-utils"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function AnalyticsView({ orders, isLoading }) {
  // Group orders by date
  const ordersByDate = useMemo(() => {
    const grouped = orders.reduce((acc, order) => {
      const date = new Date(order.creationDate).toLocaleDateString("es-CL")
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0,
          revenue: 0,
          items: 0,
        }
      }
      acc[date].count++

      // Validar el valor antes de sumarlo
      const value = order.value || order.totalValue
      acc[date].revenue += typeof value === "number" && !isNaN(value) ? value / 100 : 0

      // Validar los items antes de sumarlos
      const itemsCount =
        order.items?.reduce((sum, item) => {
          return sum + (typeof item.quantity === "number" && !isNaN(item.quantity) ? item.quantity : 0)
        }, 0) || 0

      acc[date].items += itemsCount
      return acc
    }, {})

    return Object.values(grouped).sort(
      (a, b) => new Date(a.date.split("/").reverse().join("-")) - new Date(b.date.split("/").reverse().join("-")),
    )
  }, [orders])

  // Calculate trends
  const calculateTrend = (data, key) => {
    if (data.length < 2) return { value: 0, isPositive: true }

    const firstHalf = data.slice(0, Math.floor(data.length / 2))
    const secondHalf = data.slice(Math.floor(data.length / 2))

    const firstAvg = firstHalf.reduce((sum, item) => sum + item[key], 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, item) => sum + item[key], 0) / secondHalf.length

    const percentChange = firstAvg === 0 ? 100 : ((secondAvg - firstAvg) / firstAvg) * 100

    return {
      value: Math.abs(Math.round(percentChange)),
      isPositive: percentChange >= 0,
    }
  }

  const ordersTrend = calculateTrend(ordersByDate, "count")
  const revenueTrend = calculateTrend(ordersByDate, "revenue")
  const itemsTrend = calculateTrend(ordersByDate, "items")

  // Calculate totals
  const totalOrders = orders.length
  // Modificar el cálculo de totalRevenue para evitar NaN
  const totalRevenue = orders.reduce((sum, order) => {
    const value = order.value || order.totalValue
    return sum + (typeof value === "number" && !isNaN(value) ? value / 100 : 0)
  }, 0)
  // Modificar el cálculo de totalItems para evitar NaN
  const totalItems = orders.reduce((sum, order) => {
    const itemsCount =
      order.items?.reduce((itemSum, item) => {
        return itemSum + (typeof item.quantity === "number" && !isNaN(item.quantity) ? item.quantity : 0)
      }, 0) || 0
    return sum + itemsCount
  }, 0)

  // Status distribution
  const statusDistribution = useMemo(() => {
    const grouped = orders.reduce((acc, order) => {
      if (!acc[order.status]) {
        acc[order.status] = 0
      }
      acc[order.status]++
      return acc
    }, {})

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }))
  }, [orders])

  const handleExport = () => {
    const data = [
      ...ordersByDate.map((item) => ({
        Fecha: item.date,
        Pedidos: item.count,
        Ingresos: formatCurrency(item.revenue),
        Productos: item.items,
      })),
      {
        Fecha: "TOTAL",
        Pedidos: totalOrders,
        Ingresos: formatCurrency(totalRevenue),
        Productos: totalItems,
      },
    ]

    exportToExcel(data, "reporte_analitico")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Análisis Comercial</h2>

        <motion.button
          onClick={handleExport}
          disabled={isLoading || orders.length === 0}
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
          title="Total Pedidos"
          value={totalOrders}
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
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          }
          trend={ordersTrend}
        />

        <StatsCard
          title="Ingresos Totales"
          value={formatCurrency(totalRevenue)}
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
          trend={revenueTrend}
        />

        <StatsCard
          title="Productos Vendidos"
          value={totalItems}
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
          trend={itemsTrend}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Tendencia de Ventas" isLoading={isLoading}>
          {ordersByDate.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ordersByDate} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="date" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "revenue") return formatCurrency(value)
                      return value
                    }}
                    contentStyle={{
                      backgroundColor: "rgba(22, 27, 34, 0.9)",
                      border: "1px solid #30363d",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Ingresos"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Pedidos"
                    stroke="#82ca9d"
                    fillOpacity={1}
                    fill="url(#colorOrders)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-gray-400">No hay datos disponibles</p>
          )}
        </Card>

        <Card title="Distribución por Estado" isLoading={isLoading}>
          {statusDistribution.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(22, 27, 34, 0.9)",
                      border: "1px solid #30363d",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="value" name="Pedidos" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
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

      <Card title="Evolución de Ventas Diarias" isLoading={isLoading}>
        {ordersByDate.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ordersByDate} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "revenue") return formatCurrency(value)
                    return value
                  }}
                  contentStyle={{
                    backgroundColor: "rgba(22, 27, 34, 0.9)",
                    border: "1px solid #30363d",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Ingresos"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line type="monotone" dataKey="items" name="Productos" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-gray-400">No hay datos disponibles</p>
        )}
      </Card>
    </div>
  )
}

