"use client"

import { useState } from "react"
import { formatDate, copyToClipboard } from "@/lib/utils"

export default function ShippingCard({ shippingData }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const data = {
      recipient: shippingData?.address?.receiverName,
      address: {
        street: shippingData?.address?.street,
        number: shippingData?.address?.number,
        complement: shippingData?.address?.complement,
        neighborhood: shippingData?.address?.neighborhood,
        city: shippingData?.address?.city,
        state: shippingData?.address?.state,
        postalCode: shippingData?.address?.postalCode,
        country: shippingData?.address?.country,
      },
      shipping: shippingData?.logisticsInfo?.map((info) => ({
        method: info.selectedSla,
        company: info.deliveryCompany,
        estimate: info.shippingEstimateDate,
      })),
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
        title="Copiar información de envío"
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
          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h2.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1v-4a1 1 0 00-1-1h-8a1 1 0 00-.8.4L8.4 8H5V5a1 1 0 00-1-1H3z" />
        </svg>
        Información de Envío
      </h2>
      <div className="space-y-4">
        <div>
          <p className="text-gray-300 text-sm">Destinatario</p>
          <p className="font-medium text-white">{shippingData?.address?.receiverName}</p>
        </div>
        <div>
          <p className="text-gray-300 text-sm">Dirección</p>
          <p className="font-medium text-white">
            {shippingData?.address?.street} {shippingData?.address?.number}
            {shippingData?.address?.complement && `, ${shippingData?.address?.complement}`}
          </p>
        </div>
        <div>
          <p className="text-gray-300 text-sm">Ciudad / Región</p>
          <p className="font-medium text-white">
            {shippingData?.address?.neighborhood}, {shippingData?.address?.state}
          </p>
        </div>
        <div>
          <p className="text-gray-300 text-sm">Código Postal</p>
          <p className="font-medium text-white">{shippingData?.address?.postalCode}</p>
        </div>
        <div>
          <p className="text-gray-300 text-sm">País</p>
          <p className="font-medium text-white">{shippingData?.address?.country}</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <h3 className="font-semibold mb-2 text-white">Método de Envío</h3>
        {shippingData?.logisticsInfo?.map((info, index) => (
          <div key={index} className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
            <div className="flex justify-between mb-1">
              <p className="text-gray-300 text-sm">Método</p>
              <p className="font-medium text-white">{info.selectedSla}</p>
            </div>
            <div className="flex justify-between mb-1">
              <p className="text-gray-300 text-sm">Empresa</p>
              <p className="font-medium text-white">{info.deliveryCompany}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-300 text-sm">Estimación</p>
              <p className="font-medium text-white">{formatDate(info.shippingEstimateDate)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

