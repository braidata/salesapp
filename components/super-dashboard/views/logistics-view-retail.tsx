"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Card from "../ui/card"
import StatsCard from "../ui/stats-card"
import DataTable from "../ui/data-table"
import { formatCurrency } from "@/lib/utils"
import { exportToExcel } from "@/lib/export-utils"

export default function LogisticsView({ orders, isLoading, brandFilter }) {
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loadingOrder, setLoadingOrder] = useState(false)

  // Estadísticas básicas
  const totalOrders = orders.length
  const pendingShipment = orders.filter(
    (order) => order.status === "ready-for-handling"
  ).length
  const inTransit = orders.filter(
    (order) =>
      order.status === "shipped" ||
      order.status === "out-for-delivery" ||
      order.status === "handling"
  ).length
  const delivered = orders.filter((order) => order.status === "invoiced").length

  // Estadísticas por marca (contando órdenes por marca)
  const brandStats = orders.reduce((stats, order) => {
    const marca = order.marca || "desconocida";
    stats[marca] = (stats[marca] || 0) + 1;
    return stats;
  }, {});

  // Columnas para la tabla de pedidos (agregando columna de marca)
  const columns = [
    {
      key: "orderId",
      header: "ID del pedido",
      render: (value) => value || "N/A",
      sortable: true,
    },
    // Nueva columna para mostrar la marca
    {
      key: "marca",
      header: "Marca",
      render: (value) => {
        let color;
        switch (value) {
          case "blanik":
            color = "purple";
            break;
          case "bbq":
            color = "red";
            break;
          case "imegab2c":
            color = "green";
            break;
          default:
            color = "gray";
        }
        // Mostrar la marca con un color distinto según el valor
        return (
          <span className={`px-2 py-1 rounded-full text-xs bg-${color}-500/20 text-${color}-300`}>
            {value === "blanik" ? "Blanik" : value === "bbq" ? "BBQ" : value === "imegab2c" ? "IMEGA" : value || "N/A"}
          </span>
        );
      },
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
        if (!row.shippingData || !row.shippingData.address) return "N/A"
        const addr = row.shippingData.address
        return `${addr.street || ""} ${addr.number || ""}, ${addr.neighborhood || ""}`
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
        const email = row.clientProfileData?.email || ""
        return email.split("-")[0] || "N/A"
      },
    },
    {
      key: "shippingMethod",
      header: "Método de envío",
      render: (_, row) => {
        if (!row.shippingData || !row.shippingData.logisticsInfo || row.shippingData.logisticsInfo.length === 0) {
          return "N/A"
        }
        return row.shippingData.logisticsInfo[0].selectedSla || "N/A"
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
          onClick={() => handleViewDetails(row)}
          className="px-3 py-1 text-xs rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
        >
          Ver detalles
        </button>
      ),
    },
  ]

  // Función para mapear los detalles del pedido
  function mapOrderDetails(raw, marca) {
    const client = raw.clientProfileData || {}
    const items = raw.items || []
    return {
      ...raw,
      clientName: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
      totalValue: raw.value ?? 0,
      paymentNames:
        raw.paymentData?.transactions
          ?.flatMap((t) => t.payments?.map((p) => p.paymentSystemName))
          .join(", ") || "N/A",
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        sellerSku: item.sellerSku || item.id,
        refId: item.refId || "",
        imageUrl: item.imageUrl || "",
        detailUrl: item.detailUrl || "",
      })),
      // Asegurar que el campo marca se mantenga
      marca: marca || raw.marca
    }
  }

  // Función para obtener y mostrar los detalles del pedido usando el endpoint adecuado según la marca
  const handleViewDetails = async (order) => {
    try {
      setLoadingOrder(true)
      let endpoint = "";
      
      // Usar la marca de la orden si existe, de lo contrario usar el filtro actual
      const orderMarca = order.marca || brandFilter;
      
      // Determinar el endpoint según la marca
      if (orderMarca === "blanik") {
        endpoint = `/api/apiVTEXBlanik?orderId=${order.orderId}`;
      } else if (orderMarca === "bbq") {
        endpoint = `/api/apiVTEXBBQ?orderId=${order.orderId}`;
      } else {
        // Si es "imegab2c" o cualquier otro valor (incluido "all"), usar el endpoint default
        endpoint = `/api/apiVTEX?orderId=${order.orderId}`;
      }
  
      console.log(`Obteniendo detalles para la orden ${order.orderId} desde ${endpoint}`);
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const raw = await response.json();
      console.log("Order details received:", raw);
      
      // Preservar la marca al mapear los detalles
      const mapped = mapOrderDetails(raw, orderMarca);
      setSelectedOrder(mapped);
    } catch (error) {
      console.error("Error al obtener detalles del pedido:", error);
      alert("No se pudo cargar la información completa del pedido.");
    } finally {
      setLoadingOrder(false);
    }
  };
  

  const handleExport = async () => {
    if (!orders || orders.length === 0) return;
    
    console.log(`Iniciando exportación a Excel. Cantidad de órdenes recibidas: ${orders.length}`);
    
    // Paso 1: Asegurarse de que cada orden tenga la información de productos.
    const detailedOrders = await Promise.all(
      orders.map(async (order) => {
        // Si la orden no tiene ítems, se solicita el detalle.
        if (!order.items || order.items.length === 0) {
          console.log(`La orden ${order.orderId} no trae productos; se solicitarán detalles.`);
          try {
            // Usar la marca de la orden para determinar el endpoint correcto
            let endpoint;
            if (order.marca === "blanik") {
              endpoint = `/api/apiVTEXRobotsBlanik?orderId=${order.orderId}`;
            } else if (order.marca === "bbq") {
              endpoint = `/api/apiVTEXRobotsBBQ?orderId=${order.orderId}`;
            } else {
              endpoint = `/api/apiVTEXRobots?orderId=${order.orderId}`;
            }
            
            const response = await fetch(endpoint);
            if (!response.ok) {
              console.error(
                `Error al obtener detalles para la orden ${order.orderId}. Status: ${response.status}`
              );
              return order;
            }
            const raw = await response.json();
            const mapped = mapOrderDetails(raw, order.marca);
            console.log(
              `Orden ${order.orderId} detallada. Productos encontrados: ${mapped.items.length}`
            );
            return mapped;
          } catch (error) {
            console.error(`Error al obtener detalle para la orden ${order.orderId}:`, error);
            return order;
          }
        } else {
          console.log(`La orden ${order.orderId} ya trae información de productos.`);
          return order;
        }
      })
    );
    
    // Paso 2: Construir el arreglo "data" para exportar.
    // Se genera una fila por cada producto en cada orden, y se incluyen los campos generales.
    const data = [];
    detailedOrders.forEach((order) => {
      const clientProfile = order.clientProfileData || {};
      const shippingAddress = order.shippingData?.address || {};
      const logisticsInfo = order.shippingData?.logisticsInfo?.[0] || {};
      
      // Formateo de fechas
      const creationDateStr = order.creationDate
        ? new Date(order.creationDate).toLocaleDateString("es-CL")
        : "N/A";
      const lastChangeStr = order.lastChange
        ? new Date(order.lastChange).toLocaleDateString("es-CL")
        : "N/A";
      
      // Datos de facturación
      const billingFirstName = clientProfile.firstName || "N/A";
      const billingLastName = clientProfile.lastName || "N/A";
      const billingPhone = clientProfile.phone || "N/A";
      
      // Datos de envío basados en receiverName
      let shippingFullName = shippingAddress.receiverName || "N/A";
      let shippingName = "N/A";
      let shippingLastName = "N/A";
      if (shippingFullName !== "N/A") {
        const split = shippingFullName.trim().split(" ");
        shippingName = split[0] || "N/A";
        shippingLastName = split.slice(1).join(" ") || "N/A";
      }
      
      // Construir dirección completa
      const street = shippingAddress.street || "";
      const number = shippingAddress.number || "";
      const complement = shippingAddress.complement || "";
      const addressLine = street 
        ? `${street} ${number}${complement ? `, ${complement}` : ""}`
        : "N/A";
      const province = shippingAddress.state || "N/A";
      const city = shippingAddress.neighborhood || "N/A";
      const postalCode = shippingAddress.postalCode || "N/A";
      
      // Otros datos generales
      const shippingMethodTitle = logisticsInfo.selectedSla || "N/A";
      const courier = logisticsInfo.deliveryCompany || "N/A";
      const totalValue = typeof order.value === "number" ? order.value / 100 : 0;
      const dteValue = order.invoiceOutput || "N/A";
      
      // Si la orden tiene productos
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          data.push({
            // Agregar campo de marca en la exportación
            "Marca": order.marca || "N/A",
            "Número de pedido": order.sequence || "N/A",
            "ID del pedido": order.orderId || "N/A",
            "Estado del pedido": order.statusDescription || order.status || "N/A",
            "Fecha del pedido": creationDateStr,
            "DTE": dteValue,
            "RUT": clientProfile.document || "N/A",
            "Nombre (facturación)": billingFirstName,
            "Apellidos (facturación)": billingLastName,
            "Teléfono (facturación)": billingPhone,
            "Correo electrónico": clientProfile.email
              ? clientProfile.email.split("-")[0]
              : "N/A",
            "Nombre (envío)": shippingName,
            "Apellidos (envío)": shippingLastName,
            "Dirección de envío": addressLine,
            "N° Dirección": number || "N/A",
            "N° Dpto": complement || "N/A",
            "Provincia (envío)": province,
            "Ciudad (envío)": city,
            "Título del método de envío": shippingMethodTitle,
            "Transportista": courier,
            "Importe total del pedido": formatCurrency(totalValue),
            "Última Actualización": lastChangeStr,
            // Datos del producto:
            "SKU VTEX": item.sellerSku || item.id || "N/A",
            "SKU Local": item.refId || "N/A",
            "Producto": item.name || "N/A",
            "Cantidad": item.quantity || 1,
            "Precio Unitario": formatCurrency(
              item.price && !isNaN(item.price) ? item.price / 100 : 0
            ),
            "Precio Total": formatCurrency(
              item.price && item.quantity ? (item.price * item.quantity) / 100 : 0
            ),
          });
        });
      } else {
        // Si la orden no trae productos, genera una fila "vacía" para la parte de ítems.
        data.push({
          // Agregar campo de marca en la exportación
          "Marca": order.marca || "N/A",
          "Número de pedido": order.sequence || "N/A",
          "ID del pedido": order.orderId || "N/A",
          "Estado del pedido": order.statusDescription || order.status || "N/A",
          "Fecha del pedido": creationDateStr,
          "DTE": dteValue,
          "RUT": clientProfile.document || "N/A",
          "Nombre (facturación)": billingFirstName,
          "Apellidos (facturación)": billingLastName,
          "Teléfono (facturación)": billingPhone,
          "Correo electrónico": clientProfile.email
            ? clientProfile.email.split("-")[0]
            : "N/A",
          "Nombre (envío)": shippingName,
          "Apellidos (envío)": shippingLastName,
          "Dirección de envío": addressLine,
          "N° Dirección": number || "N/A",
          "N° Dpto": complement || "N/A",
          "Provincia (envío)": province,
          "Ciudad (envío)": city,
          "Título del método de envío": shippingMethodTitle,
          "Transportista": courier,
          "Importe total del pedido": formatCurrency(totalValue),
          "Última Actualización": lastChangeStr,
          // Campos de producto vacíos:
          "SKU VTEX": "N/A",
          "SKU Local": "N/A",
          "Producto": "N/A",
          "Cantidad": "N/A",
          "Precio Unitario": "N/A",
          "Precio Total": "N/A",
        });
      }
    });
    
    console.log(`Exportación completada. Filas generadas para Excel: ${data.length}`);
    exportToExcel(data, "reporte_productos");
  };
  
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

      {/* Tarjeta de resumen por marca (nueva) */}
      {Object.keys(brandStats).length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          <Card title="Distribución por Marca">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(brandStats).map(([marca, count]) => {
                let color = "gray";
                if (marca === "blanik") color = "blue";
                else if (marca === "bbq") color = "red";
                else if (marca === "imegab2c") color = "green";
                
                return (
                  <div key={marca} className={`bg-${color}-500/10 rounded-lg p-4 flex flex-col items-center`}>
                    <span className={`text-${color}-400 text-lg font-bold`}>
                      {marca === "blanik" ? "Blanik" : marca === "bbq" ? "BBQ" : marca === "imegab2c" ? "IMEGA" : marca}
                    </span>
                    <span className="text-3xl font-bold text-white mt-2">{count}</span>
                    <span className="text-sm text-gray-400 mt-1">
                      {((count / totalOrders) * 100).toFixed(1)}% del total
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

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
              <h3 className="text-xl font-bold text-white flex items-center">
                Detalles del Pedido #{selectedOrder.orderId}
                {/* Mostrar la marca en el encabezado del modal */}
                {selectedOrder.marca && (
                  <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                    selectedOrder.marca === "blanik" ? "bg-blue-500/20 text-blue-300" :
                    selectedOrder.marca === "bbq" ? "bg-red-500/20 text-red-300" :
                    selectedOrder.marca === "imegab2c" ? "bg-green-500/20 text-green-300" :
                    "bg-gray-500/20 text-gray-300"
                  }`}>
                    {selectedOrder.marca === "blanik" ? "Blanik" : 
                     selectedOrder.marca === "bbq" ? "BBQ" : 
                     selectedOrder.marca === "imegab2c" ? "IMEGA" : 
                     selectedOrder.marca}
                  </span>
                )}
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
                    {/* Mostrar marca en los detalles del cliente */}
                    <div>
                      <p className="text-sm text-gray-400">Marca</p>
                      <p className="text-white">{selectedOrder.marca || "N/A"}</p>
                    </div>
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
              
              {/* Sección de Productos con tabla mejorada */}
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">
                    Productos ({selectedOrder.items.length})
                  </h4>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 text-gray-400">SKU</th>
                          <th className="text-left py-2 text-gray-400">Producto</th>
                          <th className="text-center py-2 text-gray-400">Cantidad</th>
                          <th className="text-right py-2 text-gray-400">Precio Unit.</th>
                          <th className="text-right py-2 text-gray-400">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-700/50">
                            <td className="py-2 text-white">{item.sellerSku || item.id || "N/A"}</td>
                            <td className="py-2 text-white">
                              <div className="flex items-center">
                                {item.imageUrl && (
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.name} 
                                    className="w-10 h-10 object-contain mr-2 bg-white rounded" 
                                  />
                                )}
                                <div>
                                  {item.name || "N/A"}
                                  {item.refId && (
                                    <span className="text-xs text-gray-400 ml-2">({item.refId})</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-2 text-center text-white">{item.quantity || 1}</td>
                            <td className="py-2 text-right text-white">
                              {formatCurrency(item.price ? item.price / 100 : 0)}
                            </td>
                            <td className="py-2 text-right text-white font-medium">
                              {formatCurrency((item.price ? item.price / 100 : 0) * (item.quantity || 1))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                  {loadingOrder ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                      <p className="text-gray-400">Cargando productos...</p>
                    </div>
                  ) : (
                    <p className="text-gray-400">
                      No hay información de productos disponible para este pedido.
                    </p>
                  )}
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