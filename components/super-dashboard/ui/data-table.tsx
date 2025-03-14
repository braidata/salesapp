"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"

interface Column {
  key: string
  header: string
  render?: (value: any, row: any) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps {
  data: any[]
  columns: Column[]
  emptyMessage?: string
}

export default function DataTable({ data, columns, emptyMessage = "No hay datos disponibles" }: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }

    setSortConfig({ key, direction })
  }

  // Asegurarse de que data es un array
  const safeData = Array.isArray(data) ? data : []

  const sortedData = [...safeData].sort((a, b) => {
    if (!sortConfig) return 0

    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    // Manejar valores nulos o indefinidos
    if (aValue === undefined || aValue === null) return sortConfig.direction === "asc" ? -1 : 1
    if (bValue === undefined || bValue === null) return sortConfig.direction === "asc" ? 1 : -1

    // Comparar diferentes tipos de datos
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    // Comparación numérica
    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1
    }
    return 0
  })

  // Add a container class to the DataTable component for better scrollbar targeting
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700/50 backdrop-blur-lg bg-white/5 data-table-container">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700/50 bg-gray-800/30">
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                {column.sortable ? (
                  <button
                    onClick={() => handleSort(column.key)}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    {column.header}
                    {sortConfig && sortConfig.key === column.key && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 transition-transform ${sortConfig.direction === "desc" ? "rotate-180" : ""}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    )}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length > 0 ? (
            sortedData.map((row, rowIndex) => (
              <motion.tr
                key={rowIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rowIndex * 0.03, duration: 0.2 }}
                className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-gray-200">
                    {column.render ? column.render(row[column.key], row) : row[column.key] || "-"}
                  </td>
                ))}
              </motion.tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

