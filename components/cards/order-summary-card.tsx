"use client"

import { useState } from "react"
import { formatCurrency, copyToClipboard } from "@/lib/utils"

export default function OrderSummaryCard({ totals, value, paymentData }) {
  const [copied, setCopied] = useState(false)

  // Get totals
  const itemsTotal = totals.find((t) => t.id === "Items")?.value || 0
  const discountsTotal = totals.find((t) => t.id === "Discounts")?.value || 0
  const shippingTotal = totals.find((t) => t.id === "Shipping")?.value || 0
  const taxTotal = totals.find((t) => t.id === "Tax")?.value || 0

  // Get payment method
  const paymentMethod = paymentData?.transactions?.[0]?.payments?.[0]?.paymentSystemName || "No disponible"

  const handleCopy = () => {
    const data = {
      subtotal: itemsTotal,
      discounts: discountsTotal,
      shipping: shippingTotal,
      tax: taxTotal,
      total: value,
      paymentMethod,
    }

    copyToClipboard(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="backdrop-blur-lg bg-white/10 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 relative">
      <button
        onClick={handleCopy}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-gray-800/50 rounded-md transition-colors"
        title="Copiar resumen del pedido"
      >
        {copied ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-green-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
          </svg>
        )}
      </button>
      <h2 className="text-xl font-bold mb-4 flex items-center text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2 text-blue-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
            clipRule="evenodd"
          />
        </svg>
        Resumen del Pedido
      </h2>
      <div className="space-y-3">
        <div className="flex justify-between">
          <p className="text-gray-300">Subtotal</p>
          <p className="font-medium text-white">{formatCurrency(itemsTotal)}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-gray-300">Descuentos</p>
          <p className="font-medium text-green-400">{formatCurrency(discountsTotal)}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-gray-300">Envío</p>
          <p className="font-medium text-white">{formatCurrency(shippingTotal)}</p>
        </div>
        {taxTotal > 0 && (
          <div className="flex justify-between">
            <p className="text-gray-300">Impuestos</p>
            <p className="font-medium text-white">{formatCurrency(taxTotal)}</p>
          </div>
        )}
        <div className="pt-3 border-t border-gray-700 flex justify-between">
          <p className="font-bold text-white">Total</p>
          <p className="font-bold text-xl text-white">{formatCurrency(value)}</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <h3 className="font-semibold mb-2 text-white">Método de Pago</h3>
        <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-blue-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
            <path
              fillRule="evenodd"
              d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-white">{paymentMethod}</span>
        </div>
      </div>
    </div>
  )
}

