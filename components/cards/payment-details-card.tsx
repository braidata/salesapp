"use client"

import { useState } from "react"
import { formatCurrency, copyToClipboard } from "@/lib/utils"

export default function PaymentDetailsCard({ paymentData }) {
  const [copied, setCopied] = useState(false)

  const payment = paymentData?.transactions?.[0]?.payments?.[0]
  const paymentMethod = payment?.paymentSystemName || "No disponible"
  const paymentValue = payment?.value ? payment.value / 100 : 0
  const installments = payment?.installments || 1
  const tid = payment?.tid || "N/A"
  const connectorResponses = payment?.connectorResponses || {}

  const handleCopy = () => {
    const data = {
      method: paymentMethod,
      value: paymentValue,
      installments,
      tid,
      connectorResponses,
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
        title="Copiar detalles de pago"
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
          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
          <path
            fillRule="evenodd"
            d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
            clipRule="evenodd"
          />
        </svg>
        Detalles de Pago
      </h2>

      <div className="space-y-4">
        <div>
          <p className="text-gray-300 text-sm">Método de Pago</p>
          <p className="font-medium text-white">{paymentMethod}</p>
        </div>
        <div>
          <p className="text-gray-300 text-sm">Valor</p>
          <p className="font-medium text-white">{formatCurrency(paymentValue)}</p>
        </div>
        <div>
          <p className="text-gray-300 text-sm">Cuotas</p>
          <p className="font-medium text-white">{installments}</p>
        </div>
        <div>
          <p className="text-gray-300 text-sm">ID de Transacción</p>
          <p className="font-medium text-white">{tid}</p>
        </div>

        {Object.keys(connectorResponses).length > 0 && (
          <div className="pt-4 border-t border-gray-700">
            <h3 className="font-semibold mb-2 text-white">Respuestas del Conector</h3>
            <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
              {Object.entries(connectorResponses).map(([key, value]) => (
                <div key={key} className="flex justify-between mb-1">
                  <p className="text-gray-300 text-sm">{key}</p>
                  <p className="font-medium text-white">{value as string}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

