"use client"

import { motion } from "framer-motion"

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  // Opciones para el número de elementos por página
  const limitOptions = [15, 25, 50, 100, 150, 200, 300]

  // Calcular los números de página a mostrar
  const getPageNumbers = () => {
    let pages = []
    const maxVisiblePages = 5 // Ajusta según necesites

    if (totalPages <= maxVisiblePages) {
      // Si hay menos páginas que el máximo visible, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Siempre mostrar la primera página
      pages.push(1)

      // Calcular el rango central
      let startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2))
      let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3)

      // Ajustar si estamos cerca del inicio
      if (startPage === 2) {
        endPage = Math.min(totalPages - 1, maxVisiblePages - 1)
      }

      // Ajustar si estamos cerca del final
      if (endPage === totalPages - 1 && endPage - startPage < maxVisiblePages - 3) {
        startPage = Math.max(2, endPage - (maxVisiblePages - 3))
      }

      // Añadir elipsis después de la primera página si es necesario
      if (startPage > 2) {
        pages.push("...")
      }

      // Añadir páginas del rango central
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // Añadir elipsis antes de la última página si es necesario
      if (endPage < totalPages - 1) {
        pages.push("...")
      }

      // Siempre mostrar la última página
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  // Calcular rango de elementos mostrados
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="backdrop-blur-lg bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-gray-400">
        Mostrando {startItem} - {endItem} de {totalItems} pedidos
      </div>

      <div className="flex items-center gap-2">
        {/* Selector de límite por página */}
        <div className="flex items-center mr-4">
          <span className="text-sm text-gray-400 mr-2">Mostrar:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-gray-800 text-gray-300 rounded-md px-2 py-1 text-sm border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {limitOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Botón anterior */}
        <motion.button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-2 py-1 rounded-md ${
            currentPage === 1
              ? "bg-gray-800/50 text-gray-500 cursor-not-allowed"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
          whileHover={currentPage !== 1 ? { scale: 1.05 } : {}}
          whileTap={currentPage !== 1 ? { scale: 0.95 } : {}}
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
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </motion.button>

        {/* Números de página */}
        <div className="flex items-center">
          {getPageNumbers().map((page, index) => (
            <div key={index}>
              {page === "..." ? (
                <span className="px-2 text-gray-500">...</span>
              ) : (
                <motion.button
                  onClick={() => typeof page === "number" && onPageChange(page)}
                  className={`h-8 w-8 flex items-center justify-center rounded-md mx-1 ${
                    page === currentPage
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {page}
                </motion.button>
              )}
            </div>
          ))}
        </div>

        {/* Botón siguiente */}
        <motion.button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`px-2 py-1 rounded-md ${
            currentPage === totalPages || totalPages === 0
              ? "bg-gray-800/50 text-gray-500 cursor-not-allowed"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
          whileHover={currentPage !== totalPages && totalPages !== 0 ? { scale: 1.05 } : {}}
          whileTap={currentPage !== totalPages && totalPages !== 0 ? { scale: 0.95 } : {}}
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
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </motion.button>
      </div>
    </div>
  )
}