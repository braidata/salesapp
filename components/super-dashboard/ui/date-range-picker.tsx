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
  const [error, setError] = useState<string>("")
  
  // Sincronizar estado local con props
  useEffect(() => {
    setLocalStartDate(startDate)
    setLocalEndDate(endDate)
  }, [startDate, endDate])

  // 🔧 FIX 1: Crear fecha local sin problemas de zona horaria
  const createLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day) // month - 1 porque Date usa 0-based months
  }

  // 🔧 FIX 2: Crear fecha de fin de día (23:59:59.999)
  const createEndOfDay = (date: Date): Date => {
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    return endOfDay
  }

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
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("") // Limpiar errores
    
    if (!e.target.value) {
      setLocalStartDate(null)
      return
    }

    // 🔧 Usar createLocalDate para evitar problemas de zona horaria
    const dateValue = createLocalDate(e.target.value)
    setLocalStartDate(dateValue)
  }

  // Manejar cambio en la fecha de fin
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("") // Limpiar errores
    
    if (!e.target.value) {
      setLocalEndDate(null)
      return
    }

    // 🔧 Usar createLocalDate para evitar problemas de zona horaria
    const dateValue = createLocalDate(e.target.value)
    setLocalEndDate(dateValue)
  }
  
  // Aplicar rango de fechas
  const handleApply = () => {
    setError("") // Limpiar errores previos
    
    // Caso 1: Ambas fechas vacías - limpiar filtro
    if (!localStartDate && !localEndDate) {
      onChange({ start: null, end: null })
      return
    }
    
    // Caso 2: Solo una fecha seleccionada - error
    if (!localStartDate || !localEndDate) {
      setError("Por favor selecciona ambas fechas o ninguna")
      return
    }
    
    // Caso 3: Validar orden de fechas
    if (localStartDate > localEndDate) {
      setError("La fecha de inicio debe ser anterior o igual a la fecha de fin")
      return
    }

    // 🔧 FIX 3: Enviar fecha de inicio a las 00:00:00 y fecha fin a las 23:59:59
    const startOfDay = new Date(localStartDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = createEndOfDay(localEndDate)
    
    // 📝 Log para debugging - remover en producción
    console.log('Rango aplicado:', {
      inicio: startOfDay.toISOString(),
      fin: endOfDay.toISOString(),
      fechasOriginales: {
        inicio: formatDisplayDate(localStartDate),
        fin: formatDisplayDate(localEndDate)
      }
    })
    
    onChange({ start: startOfDay, end: endOfDay })
  }
  
  // Limpiar rango de fechas
  const handleClear = () => {
    setLocalStartDate(null)
    setLocalEndDate(null)
    setError("")
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
            aria-label="Fecha inicial del rango"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Fecha final</label>
          <input
            type="date"
            value={formatInputDate(localEndDate)}
            onChange={handleEndDateChange}
            className="w-full bg-gray-800 text-gray-200 rounded-lg border border-gray-700 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Fecha final del rango"
          />
        </div>
      </div>
      
      {/* 🔧 FIX 4: Mostrar errores en lugar de alerts */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
        >
          {error}
        </motion.div>
      )}
      
      <div className="flex justify-between pt-1">
        <motion.button
          onClick={handleClear}
          className="px-3 py-1 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors disabled:opacity-50"
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
          <div>Rango activo: {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}</div>
          {/* 🔧 FIX 5: Mostrar información técnica para debugging */}
          <div className="text-xs text-gray-500 mt-1">
            Horario: {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
          </div>
        </div>
      )}
      
      {/* 🔧 FIX 6: Ayuda visual para rangos de un solo día */}
      {localStartDate && localEndDate && 
       localStartDate.toDateString() === localEndDate.toDateString() && (
        <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
          ✓ Buscando ventas del día {formatDisplayDate(localStartDate)} completo (00:00 - 23:59)
        </div>
      )}
    </div>
  )
}