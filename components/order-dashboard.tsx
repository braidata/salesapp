"use client"
import { formatCurrency, formatDate, copyToClipboard } from "@/lib/utils"
import StatusBadge from "./status-badge"
import OrderTimeline from "./order-timeline"
import CustomerCard from "./cards/customer-card"
import OrderSummaryCard from "./cards/order-summary-card"
import ShippingCard from "./cards/shipping-card"
import ProductsCard from "./cards/products-card"
import PaymentDetailsCard from "./cards/payment-details-card"
import BillingAddressCard from "./cards/billing-address-card"

export default function OrderDashboard({ orderData }) {
  if (!orderData) return null

  const {
    orderId,
    sequence,
    status,
    statusDescription,
    value,
    creationDate,
    lastChange,
    totals,
    items,
    clientProfileData,
    shippingData,
    paymentData,
  } = orderData

  // Divide all currency values by 100 to get the correct amount
  const adjustedValue = value / 100
  const adjustedTotals = totals.map((total) => ({
    ...total,
    value: total.value / 100,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Header Section */}
      <div className="lg:col-span-3 backdrop-blur-lg bg-white/10 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1 text-white">Pedido #{sequence}</h1>
            <p className="text-gray-300 text-sm">ID: {orderId}</p>
          </div>
          <StatusBadge status={status} description={statusDescription} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <p className="text-gray-300 text-sm">Fecha de creación</p>
            <p className="font-medium text-white">{formatDate(creationDate)}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <p className="text-gray-300 text-sm">Última actualización</p>
            <p className="font-medium text-white">{formatDate(lastChange)}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <p className="text-gray-300 text-sm">Valor total</p>
            <p className="font-medium text-xl text-white">{formatCurrency(adjustedValue)}</p>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <CustomerCard clientProfileData={clientProfileData} />

      {/* Order Summary */}
      <OrderSummaryCard totals={adjustedTotals} value={adjustedValue} paymentData={paymentData} />

      {/* Shipping Information */}
      <ShippingCard shippingData={shippingData} />

      {/* Billing Address */}
      <BillingAddressCard shippingData={shippingData} clientProfileData={clientProfileData} />

      {/* Payment Details */}
      <PaymentDetailsCard paymentData={paymentData} />

      {/* Order Timeline */}
      <div className="lg:col-span-3 backdrop-blur-lg bg-white/10 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 relative">
        <button
          onClick={() => copyToClipboard(JSON.stringify(orderData.changesAttachment || {}))}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-gray-800/50 rounded-md"
          title="Copiar información"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
          </svg>
        </button>
        <h2 className="text-xl font-bold mb-6 flex items-center text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-blue-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
          Línea de Tiempo del Pedido
        </h2>
        <OrderTimeline orderData={orderData} />
      </div>

      {/* Product Details */}
      <ProductsCard items={items} />
    </div>
  )
}

