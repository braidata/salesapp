"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { motion } from "framer-motion"

interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onChange: (range: { start: Date | null; end: Date | null }) => void
}

export default function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [localStartDate, setLocalStartDate] = useState<Date | null>(startDate)
  const [localEndDate, setLocalEndDate] = useState<Date | null>(endDate)
  
  // Sincronizar estado local con props
  useEffect(() => {
    setLocalStartDate(startDate)
    setLocalEndDate(endDate)
  }, [startDate, endDate])

  // Formatear fecha para mostrar
  const formatDisplayDate = (date: Date | null) => {
    if (!date) return ""
    return format(date, "dd/MM/yyyy", { locale: es })
  }

  // Formatear fecha para el input
  const formatInputDate = (date: Date | null) => {
    if (!date) return ""
    return format(date, "yyyy-MM-dd")
  }

  // Manejar cambio en la fecha de inicio
  const handleStartDateChange = (e) => {
    const dateValue = e.target.value ? new Date(e.target.value) : null
    setLocalStartDate(dateValue)
    
    // Solo actualizar el rango si ambas fechas son válidas o ambas son null
    if (dateValue || (!dateValue && !localEndDate)) {
      onChange({ start: dateValue, end: localEndDate })
    }
  }

  // Manejar cambio en la fecha de fin
  const handleEndDateChange = (e) => {
    const dateValue = e.target.value ? new Date(e.target.value) : null
    setLocalEndDate(dateValue)
    
    // Solo actualizar el rango si ambas fechas son válidas o ambas son null
    if (dateValue || (!dateValue && !localStartDate)) {
      onChange({ start: localStartDate, end: dateValue })
    }
  }
  
  // Aplicar rango de fechas
  const handleApply = () => {
    // Asegurar que el rango sea válido
    if (localStartDate && localEndDate) {
      if (localStartDate > localEndDate) {
        alert("La fecha de inicio debe ser anterior a la fecha de fin")
        return
      }
      
      // Aplicar el rango
      onChange({ start: localStartDate, end: localEndDate })
    } else if (!localStartDate && !localEndDate) {
      // Si ambas fechas están vacías, limpiar el rango
      onChange({ start: null, end: null })
    } else {
      // Si solo hay una fecha, mostrar un mensaje
      alert("Por favor selecciona ambas fechas o ninguna")
    }
  }
  
  // Limpiar rango de fechas
  const handleClear = () => {
    setLocalStartDate(null)
    setLocalEndDate(null)
    onChange({ start: null, end: null })
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Fecha inicial</label>
          <input
            type="date"
            value={formatInputDate(localStartDate)}
            onChange={handleStartDateChange}
            className="w-full bg-gray-800 text-gray-200 rounded-lg border border-gray-700 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Fecha final</label>
          <input
            type="date"
            value={formatInputDate(localEndDate)}
            onChange={handleEndDateChange}
            className="w-full bg-gray-800 text-gray-200 rounded-lg border border-gray-700 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="flex justify-between pt-1">
        <motion.button
          onClick={handleClear}
          className="px-3 py-1 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={!localStartDate && !localEndDate}
        >
          Limpiar
        </motion.button>
        
        <motion.button
          onClick={handleApply}
          className="px-3 py-1 text-xs rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Aplicar
        </motion.button>
      </div>
      
      {/* Mostrar el rango activo si existe */}
      {startDate && endDate && (
        <div className="text-xs text-blue-400 mt-1">
          Rango activo: {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}
        </div>
      )}
    </div>
  )
}