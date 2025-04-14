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
    const value = order.value || order.totalValue || 0
    return sum + (typeof value === "number" && !isNaN(value) ? value / 100 : 0)
  }, 0)
  const totalTax = orders.reduce((sum, order) => {
    const taxTotal = order.totals?.find((t) => t.id === "Tax")?.value || 0
    return sum + (typeof taxTotal === "number" && !isNaN(taxTotal) ? taxTotal / 100 : 0)
  }, 0)

  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0
  
  // Debug: Verificar estructura detallada de los primeros pedidos
  if (orders.length > 0) {
    const order = orders[0];
    
    //console.log("===== DEPURACIÓN DETALLADA DEL PRIMER PEDIDO =====");
    //console.log("ID del pedido:", order.orderId);
    
    if (order.paymentData) {
      //console.log("✓ paymentData encontrado");
      
      if (order.paymentData.transactions && order.paymentData.transactions.length > 0) {
        //console.log("✓ transactions[0] encontrado");
        const transaction = order.paymentData.transactions[0];
        
        if (transaction.payments && transaction.payments.length > 0) {
          //console.log("✓ payments[0] encontrado");
          const payment = transaction.payments[0];
          
          //console.log("Método de pago:", payment.paymentSystemName);
          //console.log("Valor del pago:", payment.value);
          //console.log("Cuotas:", payment.installments);
          
          if (payment.connectorResponses) {
            //console.log("✓ connectorResponses encontrado");
            //console.log("authId:", payment.connectorResponses.authId);
            //console.log("Tid:", payment.connectorResponses.Tid);
            //console.log("acquirer:", payment.connectorResponses.acquirer);
          } else {
            //console.log("✗ connectorResponses NO encontrado");
          }
        } else {
          //console.log("✗ payments[0] NO encontrado");
        }
      } else {
        //console.log("✗ transactions[0] NO encontrado");
      }
    } else {
      //console.log("✗ paymentData NO encontrado");
    }
    
    //console.log("================================================");
  }

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
    
    const value = order.value || order.totalValue || 0
    acc[paymentMethod].value += (typeof value === "number" && !isNaN(value) ? value / 100 : 0)
    
    return acc
  }, {})

  const paymentChartData = Object.entries(paymentMethodStats).map(([name, data]) => ({
    name,
    value: data.value,
  }))

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE"]

  // Función para obtener el código de autorización directamente de connectorResponses
  const getAuthorizationCode = (order) => {
    //console.log("Obteniendo código de autorización para:", order?.orderId);
    
    // Seguimos la ruta exacta: ROOT > paymentData > transactions > 0 > payments > 0 > connectorResponses
    const transaction = order?.paymentData?.transactions?.[0];
    if (!transaction) {
      //console.log("No se encontró transaction");
      return "";
    }
    else  {
      //console.log("transaction encontrado",order.paymentData, transaction);
    }
    
    const payment = transaction.payments?.[0];
    if (!payment) {
      //console.log("No se encontró payment");
      return "";
    } else {
      //console.log("payment encontrado", payment);
    }
    
    // Vamos directamente a connectorResponses por el Tid
    const connectorResponses = payment.connectorResponses;
    if (connectorResponses) {
      //console.log("connectorResponses encontrado, Tid:",connectorResponses, connectorResponses.Tid);
      return connectorResponses.Tid || "";
    }
    
    //console.log("No se encontró connectorResponses");
    return "";
  }

  // Función para obtener el tipo de pago directamente de connectorResponses
  const getTipoPago = (order) => {
    //console.log("Evaluando TIPO PAGO para pedido:", order?.orderId);
    
    // Verificar si tenemos datos del pago completos
    if (!order?.paymentData?.transactions?.[0]?.payments?.[0]) {
      //console.log("No hay información de pago completa");
      return "Otro";
    }
    
    const payment = order.paymentData.transactions[0].payments[0];
    
    // ENFOQUE NUEVO: Primero verificamos si podemos obtener información específica
    // 1. Si el grupo contiene información explícita sobre el tipo de tarjeta
    if (payment.group) {
      //console.log("Verificando grupo de pago:", payment.group);
      const groupLower = payment.group.toLowerCase();
      
      if (groupLower.includes("debit")) {
        return "TD Tarjeta Débito";
      }
      
      if (groupLower.includes("credit")) {
        return "TC Tarjeta Crédito";
      }
    }
    
    // 2. Si el connectorResponses tiene información sobre el adquirente
    if (payment.connectorResponses && payment.connectorResponses.acquirer) {
      const acquirer = payment.connectorResponses.acquirer.toLowerCase();
      //console.log("Verificando acquirer:", acquirer);
      
      if (acquirer.includes("vd")){
        return "TD Tarjeta Débito";
      }

      if (acquirer.includes("vp")){
        return "TP Tarjeta Prepago";
      }

      if (acquirer.includes("si")){
        return "TC Sin Interés";
      }


      if (acquirer.includes("vc") || acquirer.includes("vn") || acquirer.includes("s1") || acquirer.includes("s2")|| acquirer.includes("nc")){
        return "TC Tarjeta Crédito";
      }
    }
    
    // 3. Verificar datos de la tarjeta misma (Si hay firstDigits, podríamos identificar por BIN)
    if (payment.firstDigits) {
      //console.log("Verificando primeros dígitos de la tarjeta:", payment.firstDigits);
      // Identificar por primeros dígitos (BIN)
      // Ejemplo: Visa Débito suele comenzar con 4, Mastercard Débito con 5, etc.
      // Esta lógica depende de las reglas específicas del país/banco
    }
    
    // 4. Verificar mensajes de respuesta
    if (payment.connectorResponses && payment.connectorResponses.Message) {
      const message = payment.connectorResponses.Message.toLowerCase();
      //console.log("Verificando mensaje:", message);
      
      if (message.includes("debit") || message.includes("debito") || message.includes("débito") || message.includes("td")) {
        return "TD Tarjeta Débito";
      }
      
      if (message.includes("credit") || message.includes("credito") || message.includes("crédito") || message.includes("tc")) {
        return "TC Tarjeta Crédito";
      }
    }
    
    // Si nada de lo anterior funciona, verificamos por último el método de pago
    // pero sin hacer suposiciones sobre Webpay
    const paymentMethod = payment.paymentSystemName || "";
    const pmLower = paymentMethod.toLowerCase();
    //console.log("Como último recurso, verificando método de pago:", pmLower);
    
    // Solo asignamos un tipo si está EXPLÍCITAMENTE mencionado
    if (pmLower.includes("visa debit") || pmLower.includes("mastercard debit") || pmLower.includes("tarjeta debito") || pmLower.includes("tarjeta débito") || pmLower.includes("td")) {
      return "TD Tarjeta Débito";
    }
    
    if (pmLower.includes("visa credit") || pmLower.includes("mastercard credit") || pmLower.includes("tarjeta credito") || pmLower.includes("tarjeta crédito") || pmLower.includes("tc")) {
      return "TC Tarjeta Crédito";
    }
    
    // Si llegamos hasta aquí y no podemos determinar con certeza, devolvemos "Otro"
    //console.log("No se pudo determinar el tipo de pago con certeza");
    return "Otro";
  }

  // Función para obtener el valor del pago directamente
  const getPaymentValue = (order) => {
    //console.log("Obteniendo valor del pago para:", order?.orderId);
    
    // Intentamos obtener el valor del pago directamente
    const payment = order?.paymentData?.transactions?.[0]?.payments?.[0];
    
    if (payment && typeof payment.value === "number") {
      //console.log("Valor del pago encontrado:", payment.value);
      return payment.value / 100;
    }
    
    // Si no encontramos el valor del pago, usamos el valor del pedido
    //console.log("Valor del pago no encontrado, usando valor del pedido:", order?.value);
    const orderValue = order?.value || order?.totalValue || 0;
    return (typeof orderValue === "number") ? orderValue / 100 : 0;
  }

  // Columnas actualizadas para incluir todos los campos requeridos
  const columns = [
    {
      key: "orderId",
      header: "ID VTEX",
      render: (value) => <span className="font-medium">{value}</span>,
      sortable: true,
    },
    {
      key: "creationDate",
      header: "Fecha",
      render: (value) => {
        try {
          const dateObj = new Date(value)
          if (!isNaN(dateObj.getTime())) {
            return `${dateObj.toLocaleDateString("es-CL")} ${dateObj.toLocaleTimeString("es-CL")}`
          }
          return ""
        } catch (e) {
          console.error("Error al formatear fecha:", e)
          return ""
        }
      },
      sortable: true,
    },
    {
      key: "rut",
      header: "Rut Cliente",
      render: (_, row) => row.clientProfileData?.document || "",
      sortable: true,
    },
    {
      key: "rutEmpresa",
      header: "Rut Empresa",
      render: (_, row) => row.clientProfileData?.corporateDocument || "",
      sortable: true,
    },
    {
      key: "nombre",
      header: "Nombre",
      render: (_, row) => {
        const nombre = row.clientProfileData?.firstName || "";
        return <span className="font-medium">{nombre}</span>
      },
      sortable: true,
    },
    {
      key: "apellidos",
      header: "Apellidos",
      render: (_, row) => {
        const apellidos = row.clientProfileData?.lastName || "";
        return <span className="font-medium">{apellidos}</span>
      },
      sortable: true,
    },
    {
      key: "metodoPago",
      header: "Método de pago",
      render: (_, row) => row.paymentData?.transactions?.[0]?.payments?.[0]?.paymentSystemName || "No disponible",
      sortable: true,
    },
    {
      key: "codigoAutorizacion",
      header: "Código de Autorización",
      render: (_, row) => getAuthorizationCode(row),
      sortable: true,
    },
    {
      key: "tipoPago",
      header: "Tipo de Pago",
      render: (_, row) => getTipoPago(row),
      sortable: true,
    },
    {
      key: "cuotas",
      header: "Cuotas",
      render: (_, row) => row.paymentData?.transactions?.[0]?.payments?.[0]?.installments || "",
      sortable: true,
    },
    {
      key: "value",
      header: "Total",
      render: (_, row) => formatCurrency(getPaymentValue(row)),
      sortable: true,
    },
    {
      key: "invoiceNumber",
      header: "Tipo DTE",
      render: (_, row) => {
        // Si el cliente es corporativo y tiene corporateDocument, se asume que es Factura
        // De lo contrario, es Boleta
        return (row.clientProfileData?.isCorporate === true && 
                row.clientProfileData?.corporateDocument) 
               ? "Factura" : "Boleta"
      },
      sortable: true,
    },
  ]

  // Función de exportación actualizada para incluir todos los campos requeridos
  const handleExport = () => {
    //console.log("Exportando datos de", orders.length, "pedidos");
    
    const data = orders.map((order) => {
      // Para debugging
      //console.log("Procesando pedido:", order.orderId);
      
      // Fecha con hora formateada para mostrar en "Fecha del pedido"
      let fechaConHora = "";
      try {
        if (order.creationDate) {
          const dateObj = new Date(order.creationDate);
          if (!isNaN(dateObj.getTime())) {
            fechaConHora = `${dateObj.toLocaleDateString("es-CL")} ${dateObj.toLocaleTimeString("es-CL")}`;
          }
        }
      } catch (e) {
        console.error("Error al formatear fecha:", e);
      }

      // Datos del cliente para facturación
      const clientData = order.clientProfileData || {};
      const rutCliente = clientData.document || "";
      const rutEmpresa = clientData.corporateDocument || "";
      const nombreFacturacion = clientData.firstName || "";
      const apellidosFacturacion = clientData.lastName || "";

      // Datos del pago siguiendo la estructura exacta
      let metodoPago = "No disponible";
      let cuotas = "";
      
      // Seguimos la ruta exacta: ROOT > paymentData > transactions > 0 > payments > 0
      if (order.paymentData && order.paymentData.transactions && order.paymentData.transactions.length > 0) {
        const transaction = order.paymentData.transactions[0];
        
        if (transaction.payments && transaction.payments.length > 0) {
          const payment = transaction.payments[0];
          metodoPago = payment.paymentSystemName || "No disponible";
          cuotas = payment.installments || "";
        }
      }
      
      const codigoAutorizacion = getAuthorizationCode(order);
      const tipoPago = getTipoPago(order);

      // Valor del pedido (usando la función helper)
      const importeTotal = formatCurrency(getPaymentValue(order));

      // Documento Tributario: ahora basado en si es cliente corporativo
      const tipoDocumento = (order.clientProfileData?.isCorporate === true && 
                            order.clientProfileData?.corporateDocument) 
                           ? "Factura" : "Boleta";

      return {
        "ID del pedido": order.orderId || "",
        "Fecha del pedido": fechaConHora,
        "RUT": rutCliente,
        "Rut Empresa": rutEmpresa,
        "Nombre (facturación)": nombreFacturacion,
        "Apellidos (facturación)": apellidosFacturacion,
        "Título del método de pago": metodoPago,
        "Código de Autorización": codigoAutorizacion,
        "TIPO PAGO": tipoPago,
        "Cuotas": cuotas,
        "Importe total del pedido": importeTotal,
        "Documento Tributario": tipoDocumento,
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

      <div className="grid grid-cols-1 gap-6">
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
    </div>
  )
}