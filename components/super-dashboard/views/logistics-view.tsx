"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Card from "../ui/card"
import StatsCard from "../ui/stats-card"
import DataTable from "../ui/data-table"
import { formatCurrency } from "@/lib/utils"
import { exportToExcel } from "@/lib/export-utils"

export default function LogisticsView({ orders, isLoading }) {
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Estadísticas básicas
  const totalOrders = orders.length
  const pendingShipment = orders.filter(
    (order) => order.status === "ready-for-handling"
  ).length
  const inTransit = orders.filter(
    (order) => order.status === "shipped" || order.status === "out-for-delivery" || order.status === "handling"
  ).length
  const delivered = orders.filter((order) => order.status === "invoiced").length

  // Agrupación dinámica por transportista
  const courierStats = orders.reduce((acc, order) => {
    // Intenta obtener el transportista de las distintas ubicaciones posibles en el objeto
    let courier = "Desconocido"
    if (order.shippingData && order.shippingData.logisticsInfo && order.shippingData.logisticsInfo.length > 0) {
      courier = order.shippingData.logisticsInfo[0].deliveryCompany || "Desconocido"
    }
    
    acc[courier] = (acc[courier] || 0) + 1
    return acc
  }, {})

  // Columnas adaptadas para logística con todos los campos requeridos
  const columns = [
    // {
    //   key: "sequence",
    //   header: "Número de pedido",
    //   render: (value) => <span className="font-medium">{value || "N/A"}</span>,
    //   sortable: true,
    // },
    {
      key: "orderId",
      header: "ID del pedido",
      render: (value) => value || "N/A",
      sortable: true,
    },
    {
      key: "status",
      header: "Estado del pedido",
      render: (value, row) => {
        let color = "gray"
        switch (value) {
          case "handling":
            color = "blue"
            break
          case "invoiced":
            color = "green"
            break
          case "shipped":
            color = "purple"
            break
          case "delivered":
            color = "teal"
            break
          case "canceled":
            color = "red"
            break
          case "payment-pending":
            color = "yellow"
            break
          case "ready-for-handling":
            color = "indigo"
            break
          default:
            break
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs bg-${color}-500/20 text-${color}-300`}>
            {row.statusDescription || value || "desconocido"}
          </span>
        )
      },
      sortable: true,
    },
    {
      key: "creationDate",
      header: "Fecha del pedido",
      render: (value) => (value ? new Date(value).toLocaleDateString("es-CL") : "N/A"),
      sortable: true,
    },
    {
      key: "clientDocument",
      header: "RUT",
      render: (_, row) => row.clientProfileData?.document || "N/A",
      sortable: true,
    },
    {
      key: "clientName",
      header: "Nombre completo",
      render: (value) => value || "N/A",
      sortable: true,
    },
    {
      key: "shippingAddress",
      header: "Dirección de envío",
      render: (_, row) => {
        if (!row.shippingData || !row.shippingData.address) return "N/A";
        const addr = row.shippingData.address;
        return `${addr.street || ""} ${addr.number || ""}, ${addr.neighborhood || ""}`;
      },
    },
    {
      key: "shippingCity",
      header: "Ciudad de envío",
      render: (_, row) => row.shippingData?.address?.neighborhood || "N/A",
    },
    {
      key: "clientEmail",
      header: "Correo electrónico",
      render: (_, row) => {
        const email = row.clientProfileData?.email || "";
        // Eliminar el sufijo de VTEX si existe
        return email.split("-")[0] || "N/A";
      },
    },
    {
      key: "shippingMethod",
      header: "Método de envío",
      render: (_, row) => {
        if (!row.shippingData || !row.shippingData.logisticsInfo || row.shippingData.logisticsInfo.length === 0) {
          return "N/A";
        }
        return row.shippingData.logisticsInfo[0].selectedSla || "N/A";
      },
    },
    {
      key: "totalValue",
      header: "Importe total",
      render: (value) => {
        const numericValue = typeof value === "number" && !isNaN(value) ? value / 100 : 0
        return formatCurrency(numericValue)
      },
      sortable: true,
    },
    {
      key: "actions",
      header: "Acciones",
      render: (_, row) => (
        <button
          onClick={() => setSelectedOrder(row)}
          className="px-3 py-1 text-xs rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
        >
          Ver detalles
        </button>
      ),
    },
  ]

  const handleExport = () => {
    if (!orders || orders.length === 0) return

    const data = orders.map((order) => {
      // Obtener datos de envío si existen
      const shippingAddress = order.shippingData?.address || {};
      const logisticsInfo = order.shippingData?.logisticsInfo?.[0] || {};
      const clientProfile = order.clientProfileData || {};
      
      return {
        "Número de pedido": order.sequence || "N/A",
        "ID del pedido": order.orderId || "N/A",
        "Estado del pedido": order.statusDescription || order.status || "N/A",
        "Fecha del pedido": order.creationDate ? new Date(order.creationDate).toLocaleDateString("es-CL") : "N/A",
        "DTE": order.invoiceOutput || "N/A",
        "RUT": clientProfile.document || "N/A",
        "Nombre (facturación)": clientProfile.firstName || "N/A",
        "Apellidos (facturación)": clientProfile.lastName || "N/A",
        "Teléfono (facturación)": clientProfile.phone || "N/A",
        "Correo electrónico": clientProfile.email ? clientProfile.email.split("-")[0] : "N/A",
        "Nombre (envío)": shippingAddress.receiverName ? shippingAddress.receiverName.split(" ")[0] : "N/A",
        "Apellidos (envío)": shippingAddress.receiverName ? 
          shippingAddress.receiverName.split(" ").slice(1).join(" ") : "N/A",
        "Dirección de envío": `${shippingAddress.street || ""} ${shippingAddress.number || ""}`,
        "N° Dirección": shippingAddress.number || "N/A",
        "N° Dpto": shippingAddress.complement || "N/A",
        "Provincia (envío)": shippingAddress.state || "N/A",
        "Ciudad (envío)": shippingAddress.neighborhood || "N/A",
        "Título del método de envío": logisticsInfo.selectedSla || "N/A",
        "Transportista": logisticsInfo.deliveryCompany || "N/A",
        "Importe total del pedido": formatCurrency(order.totalValue ? order.totalValue / 100 : 0),
        "Última Actualización": order.lastChange ? new Date(order.lastChange).toLocaleDateString("es-CL") : "N/A",
      }
    })

    exportToExcel(data, "reporte_logistica")
  }

  return (
    <div className="space-y-6 m-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Vista de Logística</h2>

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
        />

        <StatsCard
          title="Pendientes de Envío"
          value={pendingShipment}
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
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          }
          trend={{ value: 5, isPositive: false }}
        />

        <StatsCard
          title="En Preparación"
          value={inTransit}
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
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
          }
          trend={{ value: 12, isPositive: true }}
        />

        <StatsCard
          title="Entregados"
          value={delivered}
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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          }
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card title="Pedidos" isLoading={isLoading}>
          <div className="data-table-container">
            <DataTable
              data={orders || []}
              columns={columns}
              emptyMessage="No hay pedidos que coincidan con los filtros seleccionados"
            />
          </div>
        </Card>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl max-w-5xl w-full max-h-[80vh] overflow-auto"
          >
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                Detalles del Pedido #{selectedOrder.orderId}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
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
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <h4 className="text-lg font-medium text-white mb-4">Información del Pedido</h4>
                  <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                    {/* <div>
                      <p className="text-sm text-gray-400">Número de Pedido</p>
                      <p className="text-white">{selectedOrder.sequence || "N/A"}</p>
                    </div> */}
                    <div>
                      <p className="text-sm text-gray-400">ID del Pedido</p>
                      <p className="text-white font-mono text-sm">{selectedOrder.orderId || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Estado</p>
                      <p className="text-white">
                        {selectedOrder.statusDescription || selectedOrder.status || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Fecha de Creación</p>
                      <p className="text-white">
                        {selectedOrder.creationDate
                          ? new Date(selectedOrder.creationDate).toLocaleString("es-CL")
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Última Actualización</p>
                      <p className="text-white">
                        {selectedOrder.lastChange
                          ? new Date(selectedOrder.lastChange).toLocaleString("es-CL")
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total</p>
                      <p className="text-white font-semibold">
                        {formatCurrency(
                          typeof selectedOrder.totalValue === "number" && !isNaN(selectedOrder.totalValue)
                            ? selectedOrder.totalValue / 100
                            : 0,
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-1">
                  <h4 className="text-lg font-medium text-white mb-4">Información del Cliente</h4>
                  <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Nombre Completo</p>
                      <p className="text-white">{selectedOrder.clientName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">RUT</p>
                      <p className="text-white">{selectedOrder.clientProfileData?.document || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="text-white">
                        {selectedOrder.clientProfileData?.email
                          ? selectedOrder.clientProfileData.email.split("-")[0]
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Teléfono</p>
                      <p className="text-white">{selectedOrder.clientProfileData?.phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Es Empresa</p>
                      <p className="text-white">
                        {selectedOrder.clientProfileData?.isCorporate ? "Sí" : "No"}
                      </p>
                    </div>
                    {selectedOrder.clientProfileData?.isCorporate && (
                      <div>
                        <p className="text-sm text-gray-400">Nombre Corporativo</p>
                        <p className="text-white">{selectedOrder.clientProfileData?.corporateName || "N/A"}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-1">
                  <h4 className="text-lg font-medium text-white mb-4">Información de Envío</h4>
                  <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Destinatario</p>
                      <p className="text-white">{selectedOrder.shippingData?.address?.receiverName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Dirección</p>
                      <p className="text-white">
                        {selectedOrder.shippingData?.address ? (
                          `${selectedOrder.shippingData.address.street || ""} ${
                            selectedOrder.shippingData.address.number || ""
                          }${
                            selectedOrder.shippingData.address.complement
                              ? `, ${selectedOrder.shippingData.address.complement}`
                              : ""
                          }`
                        ) : (
                          "N/A"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Comuna</p>
                      <p className="text-white">
                        {selectedOrder.shippingData?.address?.neighborhood || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Región</p>
                      <p className="text-white">{selectedOrder.shippingData?.address?.state || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Código Postal</p>
                      <p className="text-white">
                        {selectedOrder.shippingData?.address?.postalCode || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Método de Envío</p>
                      <p className="text-white">
                        {selectedOrder.shippingData?.logisticsInfo?.[0]?.selectedSla || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Transportista</p>
                      <p className="text-white">
                        {selectedOrder.shippingData?.logisticsInfo?.[0]?.deliveryCompany || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-white mb-4">Información de Pago</h4>
                <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Método de Pago</p>
                      <p className="text-white">{selectedOrder.paymentNames || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Valor Total</p>
                      <p className="text-white font-semibold">
                        {formatCurrency(
                          typeof selectedOrder.totalValue === "number"
                            ? selectedOrder.totalValue / 100
                            : 0
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Fecha de Aprobación</p>
                      <p className="text-white">
                        {selectedOrder.paymentApprovedDate
                          ? new Date(selectedOrder.paymentApprovedDate).toLocaleString("es-CL")
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Productos (si están disponibles) */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Productos</h4>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 text-gray-400">SKU</th>
                          <th className="text-left py-2 text-gray-400">Producto</th>
                          <th className="text-center py-2 text-gray-400">Cantidad</th>
                          <th className="text-right py-2 text-gray-400">Precio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-700/50">
                            <td className="py-2 text-white">{item.sellerSku || item.id || "N/A"}</td>
                            <td className="py-2 text-white">{item.name || "N/A"}</td>
                            <td className="py-2 text-center text-white">{item.quantity || 1}</td>
                            <td className="py-2 text-right text-white">
                              {formatCurrency(item.price ? item.price / 100 : 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}