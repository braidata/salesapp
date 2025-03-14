"use client"

import { useState } from "react"
import { formatCurrency, copyToClipboard } from "@/lib/utils"

export default function ProductsCard({ items }) {
  const [copied, setCopied] = useState(false)

  // Adjust prices by dividing by 100
  const adjustedItems = items.map((item) => ({
    ...item,
    price: item.price / 100,
    listPrice: item.listPrice / 100,
    sellingPrice: item.sellingPrice / 100,
  }))

  const handleCopy = () => {
    const data = adjustedItems.map((item) => ({
      id: item.id,
      name: item.name,
      refId: item.refId,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
    }))

    copyToClipboard(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="lg:col-span-3 backdrop-blur-lg bg-white/10 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 relative">
      <button
        onClick={handleCopy}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-gray-800/50 rounded-md transition-colors"
        title="Copiar productos"
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
      <h2 className="text-xl font-bold mb-6 flex items-center text-white">
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
        Productos
      </h2>
      <div className="overflow-x-auto data-table-container">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="pb-3 font-medium text-gray-300">Producto</th>
              <th className="pb-3 font-medium text-gray-300">SKU</th>
              <th className="pb-3 font-medium text-gray-300">Cantidad</th>
              <th className="pb-3 font-medium text-gray-300 text-right">Precio</th>
              <th className="pb-3 font-medium text-gray-300 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {adjustedItems.map((item) => (
              <tr key={item.uniqueId} className="border-b border-gray-800">
                <td className="py-4">
                  <div className="flex items-center">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-700 mr-4">
                      <img
                        src={item.imageUrl || "/placeholder.svg"}
                        alt={item.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="text-sm text-gray-300">
                        {item.additionalInfo?.brandName && `Marca: ${item.additionalInfo.brandName}`}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-white">{item.refId}</td>
                <td className="py-4 text-white">{item.quantity}</td>
                <td className="py-4 text-right text-white">{formatCurrency(item.price)}</td>
                <td className="py-4 text-right text-white">{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

