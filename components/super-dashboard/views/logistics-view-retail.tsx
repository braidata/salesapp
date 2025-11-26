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
  // 👇 visor
  const [labelPreview, setLabelPreview] = useState<{ message?: string; data: string[]; status: number; combined?: boolean } | null>(null)
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false)
  const [isLoadingLabel, setIsLoadingLabel] = useState(false)
  const [isLoadingAllLabels, setIsLoadingAllLabels] = useState(false)
  const [allUrl, setAllUrl] = useState<string | null>(null)
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null)
  const [pdfBlobUrls, setPdfBlobUrls] = useState<Record<string, string>>({})


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
            {value === "blanik" ? "Blanik" : value === "bbq" ? "BBQ" : value === "imegab2c" ? "VENTUS" : value || "N/A"}
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



  const fetchSAPData = async (orderId: string) => {
    try {
      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)

      const params = new URLSearchParams({
        from: thirtyDaysAgo.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
        ecommerce: "*",
      })

      const response = await fetch(`/api/sqlConnectorSimply?${params}`)
      if (!response.ok) throw new Error("Error al obtener datos de SAP")

      const { pedidos } = await response.json()
      return pedidos.find((p: any) => p.CodigoExterno === orderId)
    } catch (error) {
      console.error("Error fetching SAP data:", error)
      return null
    }
  }

  async function idSapExtractor(orderId) {
    try {
      const params = new URLSearchParams({
        purchaseOrder: orderId,
        includeItems: "false",
      })
      const response = await fetch(`/api/sap-orders-db?${params}`)
      if (!response.ok) throw new Error("Error al obtener datos de SAP")

      const { data } = await response.json()
      if (!data || data.length === 0) return null

      const s = data[0]
      return {
        sapOrder: s.sapOrder || null,
        FebosFC: s.febosFC || null,
        status: s.status || null,
        documentType: s.documentType || null,
        document: s.document || null,
      }
    } catch (error) {
      console.error("Error extracting SAP ID:", error)
      return null
    }
  }

  // Preview de etiqueta por tracking (Starken o Samex)
  const handleLabelPreview = async (ordenFlete: string) => {
    try {
      setIsLoadingLabel(true)
      const transportista = selectedOrder?.shippingData?.logisticsInfo?.[0]?.deliveryCompany?.toLowerCase() || ""
      const isSamex = transportista.includes("samex") || transportista.includes("alertran")

      if (isSamex) {
        // SAMEX
        const res = await fetch("/api/samex/etiquetar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expedicion: ordenFlete }),
        })
        if (!res.ok) throw new Error("Error al obtener etiquetas de SAMEX")
        const data = await res.json()

        let etiquetaUrls: string[] = []
        if (data.samexExtras?.etiquetaUrl) {
          etiquetaUrls = [data.samexExtras.etiquetaUrl] // URL firmada S3
        } else if (data["0"]?.respuestaEtiquetar?.etiqueta) {
          etiquetaUrls = [`data:application/pdf;base64,${data["0"].respuestaEtiquetar.etiqueta}`]
        } else {
          throw new Error("No se recibió etiqueta de SAMEX")
        }

        setLabelPreview({ message: `Etiqueta SAMEX`, data: etiquetaUrls, status: 200, combined: true })
      } else {
        // STARKEN
        const res = await fetch("/api/starken/processEtiqueta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ordenFlete, tipoSalida: 3, combineAll: false }),
        })
        if (!res.ok) throw new Error("Error al obtener etiquetas de Starken")
        const data = await res.json()
        setLabelPreview(data) // {data: string[], status, message}
      }

      setIsLabelModalOpen(true)
    } catch (e: any) {
      console.error(e)
      alert(`Error al obtener etiquetas: ${e.message || e}`)
    } finally {
      setIsLoadingLabel(false)
    }
  }

  // Cuando hay preview, preparar "Todas las etiquetas"
  useEffect(() => {
    if (!labelPreview || !selectedOrder) return
      ; (async () => {
        try {
          setIsLoadingAllLabels(true)
          const transportista = selectedOrder?.shippingData?.logisticsInfo?.[0]?.deliveryCompany?.toLowerCase() || ""
          const isSamex = transportista.includes("samex") || transportista.includes("alertran")
          if (isSamex) {
            setAllUrl(labelPreview.data[0]) // Samex ya viene combinado
          } else {
            const res = await fetch("/api/starken/processEtiqueta", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ordenFlete: selectedOrder!.sapData?.otDeliveryCompany, tipoSalida: 3, combineAll: true }),
            })
            const json = await res.json()
            setAllUrl(json.data?.[0] || null)
          }
        } catch {
          setAllUrl(null)
        } finally {
          setIsLoadingAllLabels(false)
        }
      })()
  }, [labelPreview, selectedOrder])

  // Descargar una etiqueta
  const downloadPDF = async (url: string, index: number) => {
    try {
      const transportista = selectedOrder?.shippingData?.logisticsInfo?.[0]?.deliveryCompany?.toLowerCase() || ""
      const isSamex = transportista.includes("samex") || transportista.includes("alertran")

      const isS3 = url.includes("amazonaws.com") || url.includes("X-Amz-Signature") || url.includes("AWSAccessKeyId")
      const isData = url.startsWith("data:application/pdf;base64,")

      if (isS3) {
        window.open(url, "_blank")
        return
      }
      if (isData) {
        const base64 = url.split(",")[1]
        const binary = atob(base64)
        const buffer = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i)
        const blob = new Blob([buffer], { type: "application/pdf" })
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = blobUrl
        a.download = isSamex ? `etiqueta_samex_${selectedOrder?.sapData?.otDeliveryCompany || index}.pdf` : `etiqueta_${index + 1}.pdf`
        document.body.appendChild(a); a.click(); a.remove()
        URL.revokeObjectURL(blobUrl)
        return
      }

      // Otras URLs (Starken con Basic Auth)
      let blobUrl = url
      if (!url.startsWith("blob:")) {
        const res = await fetch(url, { headers: { Authorization: `Basic ${btoa("crm:crm2019")}` } })
        const blob = await res.blob()
        blobUrl = URL.createObjectURL(blob)
      }
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = `etiqueta_${index + 1}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
      if (blobUrl.startsWith("blob:")) URL.revokeObjectURL(blobUrl)
    } catch (e) {
      console.error("Error al descargar etiqueta:", e)
      alert("Error al descargar la etiqueta")
    }
  }

  // Abrir DTE (Febos)
  const viewDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/febos?id=${id}`)
      const data = await response.json()
      window.open(data.imagenLink, "_blank")
    } catch (error) {
      console.error("Error al obtener el documento de Febos:", error)
    }
  }

  // Cargar PDF como Blob/data/S3 presigned
  const loadPdfAsBlob = async (url: string): Promise<string | null> => {
    try {
      if (url.startsWith("blob:")) return url
      const isS3 = url.includes("amazonaws.com") || url.includes("X-Amz-Signature") || url.includes("AWSAccessKeyId")
      const isData = url.startsWith("data:application/pdf;base64,")
      if (isS3 || isData) return url

      if (!pdfBlobUrls[url]) {
        const response = await fetch(url, {
          headers: { Authorization: `Basic ${btoa("crm:crm2019")}` }, // 👈 usar btoa en browser
        })
        if (!response.ok) throw new Error(`Error al cargar PDF: ${response.status}`)
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        setPdfBlobUrls(prev => ({ ...prev, [url]: blobUrl }))
        return blobUrl
      }
      return pdfBlobUrls[url]
    } catch (e) {
      console.error("Error al cargar PDF:", e)
      return null
    }
  }

  // Limpieza blobs
  useEffect(() => {
    return () => Object.values(pdfBlobUrls).forEach(URL.revokeObjectURL)
  }, [pdfBlobUrls])

  // Función para obtener y mostrar los detalles del pedido usando el endpoint adecuado según la marca
  // 👉 Reemplazá tu handleViewDetails por esta versión
  const handleViewDetails = async (order) => {
    try {
      setLoadingOrder(true)

      // Detectar endpoint por marca (conserva tu lógica)
      const orderMarca = order.marca || brandFilter
      let endpoint = ""
      if (orderMarca === "blanik") {
        endpoint = `/api/apiVTEXBlanik?orderId=${order.orderId}`
      } else if (orderMarca === "bbq") {
        endpoint = `/api/apiVTEXBBQ?orderId=${order.orderId}`
      } else {
        endpoint = `/api/apiVTEX?orderId=${order.orderId}`
      }

      console.log(`Obteniendo detalles para la orden ${order.orderId} desde ${endpoint}`)

      // Pedí VTEX + SAP en paralelo
      const [vtexRes, sapData, sapId] = await Promise.all([
        fetch(endpoint),
        fetchSAPData(order.orderId),
        idSapExtractor(order.orderId),
      ])

      if (!vtexRes.ok) throw new Error(`Error: ${vtexRes.status}`)

      const vtex = await vtexRes.json()
      console.log("Order details VTEX:", vtex)
      console.log("Order details SAP (sqlConnectorSimply):", sapData)
      console.log("Order details SAP (sap-orders-db):", sapId)

      // Inyectar sapData para que aparezcan los botones del visor
      const mapped = mapOrderDetails(
        {
          ...vtex,
          sapData: {
            otDeliveryCompany: sapData?.otDeliveryCompany || "N/A",
            FebosFC: sapData?.FebosFC || sapId?.FebosFC || "N/A",
            urlDeliveryCompany: sapData?.urlDeliveryCompany || null,
            sapOrder: sapId?.sapOrder || "N/A",
            status: sapId?.status || "N/A",
            documentType: sapId?.documentType || "N/A",
            document: sapId?.document || "N/A",
          },
        },
        orderMarca // 👈 preserva la marca en el mapeo
      )

      setSelectedOrder(mapped)
    } catch (error) {
      console.error("Error al obtener detalles del pedido:", error)
      alert("No se pudo cargar la información completa del pedido.")
    } finally {
      setLoadingOrder(false)
    }
  }



  // Reemplazar la función handleExport existente con esta versión modificada:

  const handleExport = async () => {
    if (!orders || orders.length === 0) return;

    console.log(`Iniciando exportación a Excel. Cantidad de órdenes recibidas: ${orders.length}`);

    // Paso 1: Obtener detalles de VTEX (igual que antes)
    const detailedOrders = await Promise.all(
      orders.map(async (order) => {
        if (!order.items || order.items.length === 0) {
          console.log(`La orden ${order.orderId} no trae productos; se solicitarán detalles.`);
          try {
            let endpoint;
            if (order.marca === "blanik") {
              endpoint = `/api/apiVTEXBlanik?orderId=${order.orderId}`;
            } else if (order.marca === "bbq") {
              endpoint = `/api/apiVTEXBBQ?orderId=${order.orderId}`;
            } else {
              endpoint = `/api/apiVTEX?orderId=${order.orderId}`;
            }

            const response = await fetch(endpoint);
            if (!response.ok) {
              console.error(`Error al obtener detalles para la orden ${order.orderId}. Status: ${response.status}`);
              return order;
            }
            const raw = await response.json();
            const mapped = mapOrderDetails(raw, order.marca);
            console.log(`Orden ${order.orderId} detallada. Productos encontrados: ${mapped.items.length}`);
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


    // Paso 2: Obtener datos de SAP para cada orden (NUEVO)
    const ordersWithSAP = await Promise.all(
      detailedOrders.map(async (order) => {
        try {
          console.log(`Consultando SAP para orden ${order.orderId}`);
          const sapResponse = await fetch(`/api/apiSAPSalesEcommerce?limit=1&purchaseOrder=${order.orderId}`);

          if (!sapResponse.ok) {
            console.error(`Error al consultar SAP para orden ${order.orderId}`);
            return { ...order, sapData: null };
          }

          const sapResult = await sapResponse.json();

          if (sapResult.success && sapResult.data && sapResult.data.length > 0) {
            console.log(`Datos SAP encontrados para orden ${order.orderId}`);
            return { ...order, sapData: sapResult.data[0] };
          } else {
            console.log(`No se encontraron datos SAP para orden ${order.orderId}`);
            return { ...order, sapData: null };
          }
        } catch (error) {
          console.error(`Error al obtener datos SAP para orden ${order.orderId}:`, error);
          return { ...order, sapData: null };
        }
      })
    );

    // Paso 3: Construir el arreglo "data" para exportar (modificado para incluir SAP)
    const data = [];
    ordersWithSAP.forEach((order) => {
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

      // Datos de envío
      let shippingFullName = shippingAddress.receiverName || "N/A";
      let shippingName = "N/A";
      let shippingLastName = "N/A";
      if (shippingFullName !== "N/A") {
        const split = shippingFullName.trim().split(" ");
        shippingName = split[0] || "N/A";
        shippingLastName = split.slice(1).join(" ") || "N/A";
      }

      // Dirección
      const street = shippingAddress.street || "";
      const number = shippingAddress.number || "";
      const complement = shippingAddress.complement || "";
      const addressLine = street
        ? `${street} ${number}${complement ? `, ${complement}` : ""}`
        : "N/A";
      const province = shippingAddress.state || "N/A";
      const city = shippingAddress.neighborhood || "N/A";
      const postalCode = shippingAddress.postalCode || "N/A";

      // Otros datos
      const shippingMethodTitle = logisticsInfo.selectedSla || "N/A";
      const courier = logisticsInfo.deliveryCompany || "N/A";
      const totalValue = typeof order.value === "number" ? order.value / 100 : 0;
      const dteValue = order.invoiceOutput || "N/A";

      // Datos SAP (NUEVO)
      const sapOrder = order.sapData?.sapOrder || "N/A";
      const sapDocument = order.sapData?.document || "N/A";
      const sapStatus = order.sapData?.status || "N/A";
      const sapStatusCode = order.sapData?.statusCode || "N/A";
      const sapDocumentType = order.sapData?.documentTypeText || "N/A";

      // Si la orden tiene productos
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          data.push({
            "Marca": order.marca || "N/A",
            "Número de pedido": order.sequence || "N/A",
            "ID del pedido": order.orderId || "N/A",
            "Estado del pedido": order.statusDescription || order.status || "N/A",
            "Fecha del pedido": creationDateStr,
            "DTE": dteValue,
            // Campos SAP (NUEVO)
            "N° Orden SAP": sapOrder,
            "N° Documento SAP": sapDocument,
            "Estado SAP": sapStatus,
            "Código Estado SAP": sapStatusCode,
            "Tipo Documento SAP": sapDocumentType,
            // Resto de campos existentes
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
            // Datos del producto
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
        // Si no tiene productos, una fila con datos vacíos
        data.push({
          "Marca": order.marca || "N/A",
          "Número de pedido": order.sequence || "N/A",
          "ID del pedido": order.orderId || "N/A",
          "Estado del pedido": order.statusDescription || order.status || "N/A",
          "Fecha del pedido": creationDateStr,
          "DTE": dteValue,
          // Campos SAP (NUEVO)
          "N° Orden SAP": sapOrder,
          "N° Documento SAP": sapDocument,
          "Estado SAP": sapStatus,
          "Código Estado SAP": sapStatusCode,
          "Tipo Documento SAP": sapDocumentType,
          // Resto de campos existentes
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
          // Campos de producto vacíos
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
    exportToExcel(data, "reporte_productos_con_sap");
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
                      {marca === "blanik" ? "Blanik" : marca === "bbq" ? "BBQ" : marca === "imegab2c" ? "VENTUS" : marca}
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
                  <span className={`ml-3 px-2 py-1 text-xs rounded-full ${selectedOrder.marca === "blanik" ? "bg-blue-500/20 text-blue-300" :
                    selectedOrder.marca === "bbq" ? "bg-red-500/20 text-red-300" :
                      selectedOrder.marca === "imegab2c" ? "bg-green-500/20 text-green-300" :
                        "bg-gray-500/20 text-gray-300"
                    }`}>
                    {selectedOrder.marca === "blanik" ? "Blanik" :
                      selectedOrder.marca === "bbq" ? "BBQ" :
                        selectedOrder.marca === "imegab2c" ? "VENTUS" :
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
                      <p className="text-white">
                        {selectedOrder.sapData?.otDeliveryCompany || "N/A"}
                      </p>
                      {!!selectedOrder.sapData?.otDeliveryCompany && (
                        <motion.button
                          onClick={() => handleLabelPreview(selectedOrder.sapData!.otDeliveryCompany!)}
                          disabled={isLoadingLabel}
                          className="px-3 py-1 text-sm rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          whileHover={{ scale: isLoadingLabel ? 1 : 1.02 }}
                          whileTap={{ scale: isLoadingLabel ? 1 : 0.98 }}
                        >
                          {isLoadingLabel ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-400"></div>
                              Cargando...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2L2 6v14a2 2 0 002 2h16a2 2 0 002-2V6l-4-4H6z" />
                                <path d="M6 2v4h12V2" />
                                <path d="M8 12h8" />
                                <path d="M8 16h8" />
                              </svg>
                              Ver Etiqueta
                            </>
                          )}
                        </motion.button>
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
                      {selectedOrder.sapData?.FebosFC && (
                        <button
                          onClick={() => viewDocument(selectedOrder.sapData!.FebosFC!)}
                          className="px-3 py-1 text-sm rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {isLabelModalOpen && labelPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl max-w-4xl w-full h-[80vh]">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">
                Etiquetas Disponibles ({labelPreview.data.length})
              </h3>
              <button
                onClick={() => { setIsLabelModalOpen(false); setSelectedPdfUrl(null) }}
                className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="p-4 grid grid-cols-4 gap-4 border-b border-gray-700">
              {isLoadingAllLabels ? (
                <div className="p-2 rounded bg-gray-800 animate-pulse">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-400"></div>
                    <div className="h-4 bg-gray-600 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
              ) : allUrl ? (
                <button
                  onClick={async () => { setSelectedPdfUrl(allUrl!); await loadPdfAsBlob(allUrl!) }}
                  className={`p-2 rounded ${selectedPdfUrl === allUrl ? "bg-blue-600/20 text-blue-400 border border-blue-500/50" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                >
                  Todas las Etiquetas
                </button>
              ) : (
                <div className="p-2 rounded bg-gray-800/50 text-gray-500 text-center">
                  No disponible
                </div>
              )}

              {labelPreview.data.map((url, idx) => (
                <button
                  key={idx}
                  onClick={async () => { setSelectedPdfUrl(url); await loadPdfAsBlob(url) }}
                  className={`p-2 rounded ${selectedPdfUrl === url ? "bg-blue-600/20 text-blue-400 border border-blue-500/50" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                >
                  Etiqueta {idx + 1}
                </button>
              ))}
            </div>

            <div className="flex-1 h-[calc(100vh-420px)] p-4">
              {selectedPdfUrl ? (
                <div className="relative w-full h-full bg-white rounded-lg">
                  {(() => {
                    const isS3 = selectedPdfUrl.includes("amazonaws.com") || selectedPdfUrl.includes("X-Amz-Signature") || selectedPdfUrl.includes("AWSAccessKeyId")
                    const isData = selectedPdfUrl.startsWith("data:application/pdf")
                    if (isS3 || isData || pdfBlobUrls[selectedPdfUrl]) {
                      return (
                        <iframe
                          src={pdfBlobUrls[selectedPdfUrl] || selectedPdfUrl}
                          className="w-full h-full absolute inset-0"
                          style={{ border: "none", backgroundColor: "white" }}
                          title="PDF Viewer"
                        />
                      )
                    }
                    return (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Selecciona una etiqueta para visualizarla
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 flex justify-between items-center shrink-0">
              <div className="flex gap-2">
                {selectedPdfUrl && (
                  <button
                    onClick={() => {
                      const idx = labelPreview.data.indexOf(selectedPdfUrl)
                      if (idx >= 0) downloadPDF(selectedPdfUrl, idx)
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Descargar Etiqueta Actual
                  </button>
                )}
                <button
                  onClick={() => labelPreview.data.forEach((u, i) => downloadPDF(u, i))}
                  className="px-4 py-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Descargar Todas
                </button>
              </div>
              <button
                onClick={() => { setIsLabelModalOpen(false); setSelectedPdfUrl(null) }}
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