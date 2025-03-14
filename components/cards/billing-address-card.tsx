"use client"

import { useState } from "react"
import { copyToClipboard } from "@/lib/utils"

export default function BillingAddressCard({ shippingData, clientProfileData }) {
  const [copied, setCopied] = useState(false)

  // In this example, we're assuming billing address is the same as shipping
  // You can modify this if you have separate billing address data
  const billingAddress = shippingData?.address
  const isSameAsShipping = true

  const handleCopy = () => {
    const data = {
      isSameAsShipping,
      address: {
        name: `${clientProfileData?.firstName} ${clientProfileData?.lastName}`,
        street: billingAddress?.street,
        number: billingAddress?.number,
        complement: billingAddress?.complement,
        neighborhood: billingAddress?.neighborhood,
        city: billingAddress?.city,
        state: billingAddress?.state,
        postalCode: billingAddress?.postalCode,
        country: billingAddress?.country,
      },
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
        title="Copiar dirección de facturación"
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
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
        Dirección de Facturación
      </h2>

      {isSameAsShipping ? (
        <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 mb-4">
          <p className="text-white">Misma dirección que envío</p>
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <p className="text-gray-300 text-sm">Nombre</p>
          <p className="font-medium text-white">
            {clientProfileData?.firstName} {clientProfileData?.lastName}
          </p>
        </div>
        {clientProfileData?.isCorporate && (
          <div>
            <p className="text-gray-300 text-sm">Empresa</p>
            <p className="font-medium text-white">{clientProfileData?.corporateName}</p>
          </div>
        )}
        <div>
          <p className="text-gray-300 text-sm">Dirección</p>
          <p className="font-medium text-white">
            {billingAddress?.street} {billingAddress?.number}
            {billingAddress?.complement && `, ${billingAddress?.complement}`}
          </p>
        </div>
        <div>
          <p className="text-gray-300 text-sm">Ciudad / Región</p>
          <p className="font-medium text-white">
            {billingAddress?.neighborhood}, {billingAddress?.state}
          </p>
        </div>
        <div>
          <p className="text-gray-300 text-sm">Código Postal</p>
          <p className="font-medium text-white">{billingAddress?.postalCode}</p>
        </div>
        <div>
          <p className="text-gray-300 text-sm">País</p>
          <p className="font-medium text-white">{billingAddress?.country}</p>
        </div>
        {clientProfileData?.isCorporate && (
          <div>
            <p className="text-gray-300 text-sm">RUT Empresa</p>
            <p className="font-medium text-white">{clientProfileData?.corporateDocument}</p>
          </div>
        )}
      </div>
    </div>
  )
}

