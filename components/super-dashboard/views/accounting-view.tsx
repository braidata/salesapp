"use client"
import { motion } from "framer-motion"
import Card from "../ui/card"
import StatsCard from "../ui/stats-card"
import DataTable from "../ui/data-table"
import { formatCurrency } from "@/lib/utils"
import { exportToExcel } from "@/lib/export-utils"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

export default function AccountingView({ orders, isLoading }) {
  // Calculate statistics
  const totalRevenue = orders.reduce((sum, order) => {
    const value = order.value || order.totalValue
    return sum + (typeof value === "number" && !isNaN(value) ? value / 100 : 0)
  }, 0)
  const totalTax = orders.reduce((sum, order) => {
    const taxTotal = order.totals?.find((t) => t.id === "Tax")?.value || 0
    return sum + (typeof taxTotal === "number" && !isNaN(taxTotal) ? taxTotal / 100 : 0)
  }, 0)

  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0

  // Group by payment method
  const paymentMethodStats = orders.reduce((acc, order) => {
    const paymentMethod = order.paymentData?.transactions?.[0]?.payments?.[0]?.paymentSystemName || "No disponible"
    if (!acc[paymentMethod]) {
      acc[paymentMethod] = {
        count: 0,
        value: 0,
      }
    }
    acc[paymentMethod].count++
    acc[paymentMethod].value += order.value / 100
    return acc
  }, {})

  const paymentChartData = Object.entries(paymentMethodStats).map(([name, data]) => ({
    name,
    value: data.value,
  }))

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE"]

  const columns = [
    {
      key: "orderId",
      header: "ID Pedido",
      render: (value) => <span className="font-medium">{value}</span>,
      sortable: true,
    },
    {
      key: "creationDate",
      header: "Fecha",
      render: (value) => new Date(value).toLocaleDateString("es-CL"),
      sortable: true,
    },
    {
      key: "clientName",
      header: "Cliente",
      render: (_, row) => `${row.clientProfileData?.firstName} ${row.clientProfileData?.lastName}`,
      sortable: true,
    },
    {
      key: "paymentMethod",
      header: "Método de Pago",
      render: (_, row) => row.paymentData?.transactions?.[0]?.payments?.[0]?.paymentSystemName || "No disponible",
      sortable: true,
    },
    {
      key: "status",
      header: "Estado de Pago",
      render: (_, row) => {
        const paymentStatus = row.paymentData?.transactions?.[0]?.payments?.[0]?.status || "unknown"
        let color = "gray"
        switch (paymentStatus) {
          case "approved":
            color = "green"
            break
          case "pending":
            color = "yellow"
            break
          case "denied":
            color = "red"
            break
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs bg-${color}-500/20 text-${color}-300`}>{paymentStatus}</span>
        )
      },
      sortable: true,
    },
    {
      key: "subtotal",
      header: "Subtotal",
      render: (_, row) => {
        const itemsTotal = row.totals?.find((t) => t.id === "Items")?.value || 0
        return formatCurrency(itemsTotal / 100)
      },
      sortable: true,
    },
    {
      key: "tax",
      header: "Impuestos",
      render: (_, row) => {
        const taxTotal = row.totals?.find((t) => t.id === "Tax")?.value || 0
        return formatCurrency(taxTotal / 100)
      },
      sortable: true,
    },
    {
      key: "value",
      header: "Total",
      render: (value) => {
        const numericValue = typeof value === "number" && !isNaN(value) ? value / 100 : 0
        return formatCurrency(numericValue)
      },
      sortable: true,
    },
    {
      key: "invoiceNumber",
      header: "Factura",
      render: (_, row) => row.packageAttachment?.packages?.[0]?.invoiceNumber || "No facturado",
      sortable: true,
    },
  ]

  const handleExport = () => {
    const data = orders.map((order) => {
      const itemsTotal = order.totals?.find((t) => t.id === "Items")?.value || 0
      const taxTotal = order.totals?.find((t) => t.id === "Tax")?.value || 0

      return {
        "ID Pedido": order.orderId,
        Fecha: new Date(order.creationDate).toLocaleDateString("es-CL"),
        Cliente: `${order.clientProfileData?.firstName} ${order.clientProfileData?.lastName}`,
        "Método de Pago": order.paymentData?.transactions?.[0]?.payments?.[0]?.paymentSystemName || "No disponible",
        "Estado de Pago": order.paymentData?.transactions?.[0]?.payments?.[0]?.status || "unknown",
        Subtotal: formatCurrency(itemsTotal / 100),
        Impuestos: formatCurrency(taxTotal / 100),
        Total: formatCurrency(order.value / 100),
        Factura: order.packageAttachment?.packages?.[0]?.invoiceNumber || "No facturado",
      }
    })

    exportToExcel(data, "reporte_contabilidad")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Vista de Contabilidad</h2>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          trend={{ value: 15, isPositive: true }}
        />

        <StatsCard
          title="Valor Promedio"
          value={formatCurrency(averageOrderValue)}
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
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          }
          trend={{ value: 3, isPositive: true }}
        />

        <StatsCard
          title="Total Impuestos"
          value={formatCurrency(totalTax)}
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          }
        />

        <StatsCard
          title="Pedidos"
          value={orders.length}
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
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          }
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Transacciones" isLoading={isLoading}>
            <div className="data-table-container">
              <DataTable
                data={orders}
                columns={columns}
                emptyMessage="No hay transacciones que coincidan con los filtros seleccionados"
              />
            </div>
          </Card>
        </div>

        <div>
          <Card title="Distribución por Método de Pago" isLoading={isLoading}>
            {paymentChartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "rgba(22, 27, 34, 0.9)",
                        border: "1px solid #30363d",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-gray-400">No hay datos disponibles</p>
            )}

            <div className="mt-4 space-y-2">
              {Object.entries(paymentMethodStats).map(([method, data], index) => (
                <div key={method} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-gray-300">{method}</span>
                  </div>
                  <span className="text-white">{formatCurrency(data.value)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

