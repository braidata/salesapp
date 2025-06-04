"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Card from "../ui/card"
import StatsCard from "../ui/stats-card"
import DataTable from "../ui/data-table"
import { formatCurrency } from "@/lib/utils"
import { exportToExcel } from "@/lib/export-utils"

interface Order {
  orderId?: string;
  sequence?: string;
  status?: string;
  statusDescription?: string;
  creationDate?: string;
  lastChange?: string;
  totalValue?: number;
  value?: number;
  invoiceOutput?: string;
  clientProfileData?: {
    document?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    isCorporate?: boolean;
    corporateName?: string;
  };
  shippingData?: {
    address?: {
      receiverName?: string;
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      state?: string;
      postalCode?: string;
    };
    logisticsInfo?: Array<{
      selectedSla?: string;
      deliveryCompany?: string;
    }>;
  };
  paymentData?: {
    transactions?: Array<{
      payments?: Array<{
        paymentSystemName?: string;
      }>;
    }>;
  };
  paymentApprovedDate?: string;
  items?: Array<{
    id?: string;
    name?: string;
    price?: number;
    quantity?: number;
    sellerSku?: string;
    refId?: string;
    imageUrl?: string;
    detailUrl?: string;
  }>;
  sapData?: {
    otDeliveryCompany?: string;
    FebosFC?: string;
    urlDeliveryCompany?: string;
    sapOrder?: string;
    status?: string;
    documentType?: string;
    document?: string;
  };
  clientName?: string;
  paymentNames?: string;
}

interface Filters {
  orderId?: string;
  [key: string]: any;
}

interface LabelPreview {
  message: string;
  data: string[];
  status: number;
}

interface LogisticsViewProps {
  orders: Order[];
  isLoading: boolean;
  brand?: string;
  filters?: Filters;
}

export default function LogisticsView({ orders, isLoading, brand, filters }: LogisticsViewProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loadingOrder, setLoadingOrder] = useState(false)

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const [labelPreview, setLabelPreview] = useState<LabelPreview | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [pdfBlobUrls, setPdfBlobUrls] = useState<{ [key: string]: string }>({});

  // NUEVO: Filtrado por ID de pedido
  const filteredOrders = orders.filter(order => {
    // DEBUG: Agregar logs para diagnosticar
    console.log('🔍 Filters recibidos:', filters);
    console.log('🔍 orders.length:', orders.length);

    if (!filters?.orderId) {
      console.log('✅ No hay filtro de ID, mostrando todos los pedidos');
      return true; // Si no hay filtro, mostrar todos
    }

    const orderId = order.orderId?.toLowerCase() || '';
    const sequence = order.sequence?.toLowerCase() || '';
    const searchTerm = filters.orderId.toLowerCase();

    console.log('🔍 Comparando:', {
      orderId,
      sequence,
      searchTerm,
      matches: orderId.includes(searchTerm) || sequence.includes(searchTerm)
    });

    return orderId.includes(searchTerm) || sequence.includes(searchTerm);
  });

  // DEBUG: Log del resultado del filtrado
  console.log('📊 Resultado del filtrado:', {
    totalOrders: orders.length,
    filteredOrders: filteredOrders.length,
    filterValue: filters?.orderId
  });

  const viewDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/febos?id=${id}`);
      const data = await response.json();
      window.open(data.imagenLink, '_blank');
    } catch (error) {
      console.error('Error al obtener el documento de Febos:', error);
    }
  };

  const loadPdfAsBlob = async (url: string): Promise<string | null> => {
    if (pdfBlobUrls[url]) return pdfBlobUrls[url];

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${Buffer.from('crm:crm2019').toString('base64')}`
        }
      });

      if (!response.ok) throw new Error('Error al cargar PDF');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      setPdfBlobUrls(prev => ({ ...prev, [url]: blobUrl }));
      return blobUrl;
    } catch (error) {
      console.error('Error al cargar PDF:', error);
      return null;
    }
  };

  useEffect(() => {
    return () => {
      // Limpiar todas las URLs de blob al desmontar
      Object.values(pdfBlobUrls).forEach(url => {
        window.URL.revokeObjectURL(url);
      });
    };
  }, [pdfBlobUrls]);

  const handleLabelPreview = async (ordenFlete: string) => {
    try {
      const response = await fetch('/api/starken/etiquetaAPI', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from('crm:crm2019').toString('base64')}`
        },
        body: JSON.stringify({
          ordenFlete,
          tipoSalida: 4 // Formato PDF
        })
      });

      if (!response.ok) {
        throw new Error('Error al obtener etiqueta');
      }

      const data = await response.json();
      setLabelPreview(data);
      setIsLabelModalOpen(true);
    } catch (error) {
      console.error('Error al obtener etiqueta:', error);
      alert('No se pudo obtener la etiqueta');
    }
  };

  const downloadPDF = async (url: string, index: number) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${Buffer.from('crm:crm2019').toString('base64')}`
        }
      });
      const blob = await response.blob();
      const pdfUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `etiqueta_${index + 1}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(pdfUrl);
    } catch (error) {
      console.error('Error al descargar la etiqueta:', error);
      alert('Error al descargar la etiqueta');
    }
  };

  // Función para imprimir múltiples etiquetas
  const printLabels = (urls: string[]) => {
    setLabelPreview({
      message: "Etiquetas PDF",
      data: urls,
      status: 200
    });
    setIsLabelModalOpen(true);
  };

  // ACTUALIZADO: Usar filteredOrders en lugar de orders para las estadísticas
  const totalOrders = filteredOrders.length
  const pendingShipment = filteredOrders.filter(
    (order) => order.status === "ready-for-handling"
  ).length
  const inTransit = filteredOrders.filter(
    (order) =>
      order.status === "shipped" ||
      order.status === "out-for-delivery" ||
      order.status === "handling"
  ).length
  const delivered = filteredOrders.filter((order) => order.status === "invoiced").length

  // Columnas para la tabla de pedidos
  const columns = [
    {
      key: "orderId",
      header: "ID del pedido",
      render: (value: any) => value || "N/A",
      sortable: true,
    },
    {
      key: "status",
      header: "Estado del pedido",
      render: (value: any, row: Order) => {
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
      render: (value: any) => (value ? new Date(value).toLocaleDateString("es-CL") : "N/A"),
      sortable: true,
    },
    {
      key: "clientDocument",
      header: "RUT",
      render: (_: any, row: Order) => row.clientProfileData?.document || "N/A",
      sortable: true,
    },
    {
      key: "clientName",
      header: "Nombre completo",
      render: (value: any) => value || "N/A",
      sortable: true,
    },
    {
      key: "shippingAddress",
      header: "Dirección de envío",
      render: (_: any, row: Order) => {
        if (!row.shippingData || !row.shippingData.address) return "N/A"
        const addr = row.shippingData.address
        return `${addr.street || ""} ${addr.number || ""}, ${addr.neighborhood || ""}`
      },
    },
    {
      key: "shippingCity",
      header: "Ciudad de envío",
      render: (_: any, row: Order) => row.shippingData?.address?.neighborhood || "N/A",
    },
    {
      key: "clientEmail",
      header: "Correo electrónico",
      render: (_: any, row: Order) => {
        const email = row.clientProfileData?.email || ""
        return email.split("-")[0] || "N/A"
      },
    },
    {
      key: "totalValue",
      header: "Importe total",
      render: (value: any) => {
        const numericValue = typeof value === "number" && !isNaN(value) ? value / 100 : 0
        return formatCurrency(numericValue)
      },
      sortable: true,
    },
    {
      key: "actions",
      header: "Acciones",
      render: (_: any, row: Order) => (
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
  function mapOrderDetails(raw: any): Order {
    const client = raw.clientProfileData || {}
    const items = raw.items || []
    return {
      ...raw,
      clientName: `${client.firstName || ""} ${client.lastName || ""}`.trim(),
      totalValue: raw.value ?? 0,
      paymentNames:
        raw.paymentData?.transactions
          ?.flatMap((t: any) => t.payments?.map((p: any) => p.paymentSystemName))
          .join(", ") || "N/A",
      items: items.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        sellerSku: item.sellerSku || item.id,
        refId: item.refId || "",
        imageUrl: item.imageUrl || "",
        detailUrl: item.detailUrl || "",
      })),
    }
  }

  const idSapExtractor = async (orderId: string) => {
    try {
      const params = new URLSearchParams({
        purchaseOrder: orderId,
        includeItems: 'false'
      });

      const response = await fetch(`/api/sap-orders-db?${params}`);
      if (!response.ok) {
        throw new Error('Error al obtener datos de SAP');
      }

      const { data } = await response.json();
      if (!data || data.length === 0) {
        return null;
      }

      // Retorna el primer resultado encontrado
      const sapOrder = data[0];
      return {
        sapOrder: sapOrder.sapOrder || null,
        febosFC: sapOrder.febosFC || null,
        status: sapOrder.status || null,
        documentType: sapOrder.documentType || null,
        document: sapOrder.document || null
      };
    } catch (error) {
      console.error('Error extracting SAP ID:', error);
      return null;
    }
  };

  const fetchSAPData = async (orderId: string) => {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const params = new URLSearchParams({
        from: thirtyDaysAgo.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
        ecommerce: 'VENTUSCORP_VTEX'
      });

      const response = await fetch(`/api/sqlConnectorSimply?${params}`);
      if (!response.ok) throw new Error('Error al obtener datos de SAP');

      const { pedidos } = await response.json();
      // Buscar el pedido por CodigoExterno que coincida con orderId
      return pedidos.find((p: any) => p.CodigoExterno === orderId);
    } catch (error) {
      console.error('Error fetching SAP data:', error);
      return null;
    }
  };

  // Función para obtener y mostrar los detalles del pedido usando el endpoint adecuado según la marca
  const handleViewDetails = async (order: Order) => {
    try {
      setLoadingOrder(true);

      // Obtener datos de VTEX
      let endpoint = brand === "blanik"
        ? `/api/apiVTEXBlanik?orderId=${order.orderId}`
        : `/api/apiVTEX?orderId=${order.orderId}`;

      const [vtexResponse, sapData, sapOrderData] = await Promise.all([
        fetch(endpoint),
        fetchSAPData(order.orderId!),
        idSapExtractor(order.orderId!)
      ]);

      if (!vtexResponse.ok) {
        throw new Error(`Error: ${vtexResponse.status}`);
      }

      const vtexData = await vtexResponse.json();
      console.log("VTEX details received:", vtexData);
      console.log("SAP details received:", sapData);

      // Combinar datos de VTEX y SAP
      const mappedData = mapOrderDetails({
        ...vtexData,
        sapData: {
          otDeliveryCompany: sapData?.otDeliveryCompany || 'N/A',
          FebosFC: sapData?.FebosFC || sapOrderData?.febosFC || 'N/A',
          urlDeliveryCompany: sapData?.urlDeliveryCompany || null,
          sapOrder: sapOrderData?.sapOrder || 'N/A',
          status: sapOrderData?.status || 'N/A',
          documentType: sapOrderData?.documentType || 'N/A',
          document: sapOrderData?.document || 'N/A'
        }
      });

      setSelectedOrder(mappedData);
    } catch (error) {
      console.error("Error al obtener detalles del pedido:", error);
      alert("No se pudo cargar la información completa del pedido.");
    } finally {
      setLoadingOrder(false);
    }
  };

  // ACTUALIZADO: Usar filteredOrders para la exportación
  const handleExport = async () => {
    if (!filteredOrders || filteredOrders.length === 0) return;

    setIsExporting(true); // Activar estado de exportación
    try {
      // Primero, obtener los datos de SAP para todas las órdenes filtradas
      const sapDataPromises = filteredOrders.map(order => fetchSAPData(order.orderId!));
      const sapDataResults = await Promise.all(sapDataPromises);

      // Crear un mapa para acceder fácilmente a los datos de SAP por orderId
      const sapDataMap = sapDataResults.reduce((acc: any, sapData) => {
        if (sapData) {
          acc[sapData.CodigoExterno] = sapData;
        }
        return acc;
      }, {});

      const data = filteredOrders.map((order) => {
        const shippingAddress = order.shippingData?.address || {};
        const logisticsInfo = order.shippingData?.logisticsInfo?.[0] || {};
        const clientProfile = order.clientProfileData || {};
        const sapData = sapDataMap[order.orderId!] || {};

        return {
          "Número de pedido": order.sequence || "N/A",
          "ID del pedido": order.orderId || "N/A",
          "ID SAP": sapData?.sapOrder || "N/A",
          "Estado del pedido": order.statusDescription || order.status || "N/A",
          "Fecha del pedido": order.creationDate
            ? new Date(order.creationDate).toLocaleDateString("es-CL")
            : "N/A",
          "DTE": order.invoiceOutput || "N/A",
          "RUT": clientProfile.document || "N/A",
          "Nombre (facturación)": clientProfile.firstName || "N/A",
          "Apellidos (facturación)": clientProfile.lastName || "N/A",
          "Teléfono (facturación)": clientProfile.phone || "N/A",
          "Correo electrónico": clientProfile.email ? clientProfile.email.split("-")[0] : "N/A",
          "Nombre (envío)": shippingAddress.receiverName ? shippingAddress.receiverName.split(" ")[0] : "N/A",
          "Apellidos (envío)":
            shippingAddress.receiverName
              ? shippingAddress.receiverName.split(" ").slice(1).join(" ")
              : "N/A",
          "Dirección de envío": `${shippingAddress.street || ""} ${shippingAddress.number || ""}`,
          "N° Dirección": shippingAddress.number || "N/A",
          "N° Dpto": shippingAddress.complement || "N/A",
          "Provincia (envío)": shippingAddress.state || "N/A",
          "Ciudad (envío)": shippingAddress.neighborhood || "N/A",
          "Título del método de envío": logisticsInfo.selectedSla || "N/A",
          "Transportista": logisticsInfo.deliveryCompany || "N/A",
          "Importe total del pedido": formatCurrency(order.totalValue ? order.totalValue / 100 : 0),
          "N° Seguimiento": sapData.otDeliveryCompany || "N/A",
          "ID Febos": sapData.FebosFC || "N/A",
          "URL Seguimiento": sapData.urlDeliveryCompany || "N/A",
          "Última Actualización": order.lastChange
            ? new Date(order.lastChange).toLocaleDateString("es-CL")
            : "N/A",
        }
      })

      exportToExcel(data, "reporte_logistica");
    } catch (error) {
      console.error("Error al exportar datos:", error);
      alert("Hubo un error al exportar los datos. Por favor, intente nuevamente.");
    } finally {
      setIsExporting(false); // Desactivar estado de exportación
    }
  };

  return (
    <div className="space-y-6 m-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Vista de Logística</h2>
        <motion.button
          onClick={handleExport}
          disabled={isLoading || filteredOrders.length === 0 || isExporting}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white border border-blue-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              Exportando...
            </>
          ) : (
            <>
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
            </>
          )}
        </motion.button>
      </div>

      {/* NUEVO: Mostrar información sobre el filtro activo */}
      {filters?.orderId && (
        <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-3">
          <p className="text-blue-300 text-sm">
            🔍 Mostrando {filteredOrders.length} pedido(s) que coinciden con: "{filters.orderId}"
          </p>
        </div>
      )}

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
        <Card title="Pedidos" isLoading={isLoading || isExporting}>
          <div className="data-table-container">
            <DataTable
              data={filteredOrders.map(order => ({
                ...order,
                sapData: order.sapData || {},
                sapOrder: order.sapData?.sapOrder || order.sapOrder || "N/A"
              }))}
              columns={columns}
              emptyMessage={
                filters?.orderId
                  ? `No hay pedidos que coincidan con "${filters.orderId}"`
                  : "No hay pedidos que coincidan con los filtros seleccionados"
              }
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
                    <div>
                      <p className="text-sm text-gray-400">ID del Pedido</p>
                      <p className="text-white font-mono text-sm">{selectedOrder.orderId || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">ID SAP</p>
                      <p className="text-white font-mono text-sm">{selectedOrder.sapData?.sapOrder || "N/A"}</p>
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
                          `${selectedOrder.shippingData.address.street || ""} ${selectedOrder.shippingData.address.number || ""
                          }${selectedOrder.shippingData.address.complement
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

              <div>
                <h4 className="text-lg font-medium text-white mb-4">Información de Seguimiento</h4>
                <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">N° de Seguimiento</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white">{selectedOrder.sapData?.otDeliveryCompany || "N/A"}</p>
                      {selectedOrder.sapData?.otDeliveryCompany && (
                        <button
                          onClick={() => handleLabelPreview(selectedOrder.sapData!.otDeliveryCompany!)}
                          className="px-3 py-1 text-sm rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors flex items-center gap-1"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M6 2L2 6v14a2 2 0 002 2h16a2 2 0 002-2V6l-4-4H6z" />
                            <path d="M6 2v4h12V2" />
                            <path d="M8 12h8" />
                            <path d="M8 16h8" />
                          </svg>
                          Ver Etiqueta
                        </button>
                      )}


                    </div>
                  </div>
                  {selectedOrder.sapData?.urlDeliveryCompany && (
                    <div>
                      <p className="text-sm text-gray-400">Seguimiento</p>
                      <a
                        href={selectedOrder.sapData.urlDeliveryCompany}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 w-36 text-sm rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors flex items-center gap-1"
                      >
                        Ver seguimiento →
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-400">Ver DTE</p>
                    <div className="flex items-center gap-2">
                      {/* <p className="text-white">{selectedOrder.sapData?.FebosFC || "N/A"}</p> */}
                      {selectedOrder.sapData?.FebosFC && (
                        <button
                          onClick={() => viewDocument(selectedOrder.sapData!.FebosFC!)}
                          className="px-3 py-1 text-sm rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors flex items-center gap-1"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                          Ver Factura
                        </button>
                      )}
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

      {/* Modal de Etiquetas */}
      {isLabelModalOpen && labelPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl max-w-4xl w-full h-[80vh]">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">
                Etiquetas Disponibles ({labelPreview.data.length})
              </h3>
              <button
                onClick={() => {
                  setIsLabelModalOpen(false);
                  setSelectedPdfUrl(null);
                }}
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

            <div className="p-4 grid grid-cols-4 gap-4 border-b border-gray-700">
              {labelPreview.data.map((url, index) => (
                <button
                  key={index}
                  onClick={async () => {
                    setSelectedPdfUrl(url);
                    await loadPdfAsBlob(url);
                  }}
                  className={`p-2 rounded ${selectedPdfUrl === url
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                  Etiqueta {index + 1}
                </button>
              ))}
            </div>

            <div className="flex-1 h-[calc(80vh-220px)] p-4">
              {selectedPdfUrl ? (
                <div className="relative w-full h-full bg-white rounded-lg overflow-hidden">
                  {pdfBlobUrls[selectedPdfUrl] ? (
                    <iframe
                      src={pdfBlobUrls[selectedPdfUrl]}
                      className="w-full h-full"
                      style={{
                        border: 'none',
                        backgroundColor: 'white'
                      }}
                      title="PDF Viewer"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Selecciona una etiqueta para visualizarla
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 flex justify-between items-center">
              <div className="flex gap-2">
                {selectedPdfUrl && (
                  <button
                    onClick={() => {
                      const index = labelPreview.data.indexOf(selectedPdfUrl);
                      if (index >= 0) downloadPDF(selectedPdfUrl, index);
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors flex items-center gap-2"
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
                    Descargar Etiqueta Actual
                  </button>
                )}
                <button
                  onClick={() => labelPreview.data.forEach((url, index) => downloadPDF(url, index))}
                  className="px-4 py-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors flex items-center gap-2"
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
                  Descargar Todas
                </button>
              </div>
              <button
                onClick={() => {
                  setIsLabelModalOpen(false);
                  setSelectedPdfUrl(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}