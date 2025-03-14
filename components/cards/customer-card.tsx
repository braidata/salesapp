"use client"

import { useState } from "react"
import { copyToClipboard } from "@/lib/utils"

export default function CustomerCard({ clientProfileData }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const data = {
      name: `${clientProfileData?.firstName} ${clientProfileData?.lastName}`,
      email: clientProfileData?.email,
      phone: clientProfileData?.phone,
      document: clientProfileData?.document,
      company: clientProfileData?.isCorporate
        ? {
            name: clientProfileData?.corporateName,
            tradeName: clientProfileData?.tradeName,
            document: clientProfileData?.corporateDocument,
          }
        : null,
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
        title="Copiar información del cliente"
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
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
        Información del Cliente
      </h2>
      <div className="space-y-4">
        <div>
          <p className="text-gray-300 text-sm">Nombre</p>
          <p className="font-medium text-white">
            {clientProfileData?.firstName} {clientProfileData?.lastName}
          </p>
        </div>
        <div>
          <p className="text-gray-300 text-sm">Email</p>
          <p className="font-medium text-white">{clientProfileData?.email}</p>
        </div>
        <div>
          <p className="text-gray-300 text-sm">Teléfono</p>
          <p className="font-medium text-white">{clientProfileData?.phone}</p>
        </div>
        <div>
          <p className="text-gray-300 text-sm">Documento</p>
          <p className="font-medium text-white">{clientProfileData?.document}</p>
        </div>
        {clientProfileData?.isCorporate && (
          <>
            <div className="pt-2 border-t border-gray-700">
              <p className="text-gray-300 text-sm">Empresa</p>
              <p className="font-medium text-white">{clientProfileData?.corporateName}</p>
            </div>
            <div>
              <p className="text-gray-300 text-sm">Nombre Comercial</p>
              <p className="font-medium text-white">{clientProfileData?.tradeName}</p>
            </div>
            <div>
              <p className="text-gray-300 text-sm">RUT Empresa</p>
              <p className="font-medium text-white">{clientProfileData?.corporateDocument}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

