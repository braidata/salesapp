"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"

// Importa tu método para verificar permisos
import { checkPermissions } from "@/lib/permissions"

import DateRangePicker from "./ui/date-range-picker"
import Select from "./ui/select"
import { DateTime } from "mssql"
import { now } from "lodash"

interface SearchFiltersProps {
  filters: any
  onFilterChange: (filters: any) => void
}

export default function SearchFilters({ filters, onFilterChange }: SearchFiltersProps) {
  // 1. Obtenemos la sesión
  const { data: session, status } = useSession()

  // 2. Estados relacionados con permisos
  const [loadingPermissions, setLoadingPermissions] = useState(true)
  const [isAccounting, setIsAccounting] = useState(false)

  // 3. useEffect para verificar permisos cuando el usuario está autenticado
  useEffect(() => {
    if (status === "authenticated" && session) {
      (async () => {
        // Obtenemos el email desde session.session
        const email = session.session.user.email
        // Verificamos si es contabilidad
        const hasAccounting = await checkPermissions({
          email,
          roles: ["accounting", "contabilidad"]
        })
        setIsAccounting(hasAccounting)
        setLoadingPermissions(false)
      })()
    } else {
      setLoadingPermissions(false)
    }
  }, [session, status])

  // 4. Estados internos del componente (filtros, etc.)
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTimeFilter, setActiveTimeFilter] = useState<"days" | "range">(
    filters.dateRange.start && filters.dateRange.end ? "range" : "days"
  )

  useEffect(() => {
    if (filters.dateRange.start && filters.dateRange.end) {
      setActiveTimeFilter("range")
    } else if (filters.daysBack) {
      setActiveTimeFilter("days")
    }
  }, [filters])

  // 5. Si aún estamos cargando los permisos, retornamos un mensaje
  if (loadingPermissions) {
    return <div className="m-8">Cargando permisos...</div>
  }

  // Opciones de estado (status) de la orden
  const statusOptions = [
    { value: "", label: "Todos los estados" },
    { value: "handling", label: "En preparación" },
    { value: "ready-for-handling", label: "Listo para preparar" },
    { value: "payment-pending", label: "Pago pendiente" },
    { value: "payment-approved", label: "Pago aprobado" },
    { value: "invoiced", label: "Facturado" },
    { value: "canceled", label: "Cancelado" },
    { value: "delivered", label: "Entregado" },
    { value: "window-to-cancel", label: "En ventana de cancelación" },
    { value: "waiting-for-authorization", label: "Esperando autorización" },
    { value: "waiting-for-fulfillment", label: "Esperando despacho" },
  ]

  // Opciones de transportista (courier)
  const courierOptions = [
    { value: "", label: "Todos los transportistas" },
    { value: "Despacho RM", label: "Despacho RM" },
    { value: "Starken", label: "Starken" },
    { value: "Retiro en tienda", label: "Retiro en tienda" },
    { value: "Transportadora estándar", label: "99 Minutos" },
  ]

  // Opciones de método de pago (paymentType)
  const paymentOptions = [
    { value: "", label: "Todos los pagos" },
    { value: "Webpay", label: "Webpay" },
    { value: "Promissory", label: "Transferencia Bancaria" },
  ]

  // Opciones de tipo de entrega (deliveryType => selectedDeliveryChannel)
  const deliveryOptions = [
    { value: "", label: "Todos los tipos" },
    { value: "delivery", label: "Despacho a domicilio" },
    { value: "pickup-in-point", label: "Retiro en tienda" },
  ]

  // Opciones de días atrás
  const daysBackOptions = [
    { value: 7, label: "Última semana" },
    { value: 15, label: "Últimos 15 días" },
    { value: 30, label: "Último mes" },
    { value: 90, label: "Últimos 3 meses" },
    { value: 180, label: "Últimos 6 meses" },
    { value: 365, label: "Último año" },
  ]

  // Opciones de marca (añadiendo BBQ)
  const brandOptions = [
    { value: "all", label: "Todas las marcas" },
    { value: "blanik", label: "Blanik" },
    { value: "bbq", label: "BBQ" },
  ]

  // Manejar cambios en daysBack
  const handleDaysBackChange = (value: number) => {
    setActiveTimeFilter("days")
    onFilterChange({
      daysBack: value,
      // Resetear rango
      dateRange: { start: null, end: null },
    })
  }

  // Manejar cambios en el rango de fechas
  const handleDateRangeChange = (range: { start: Date | null; end: Date | null }) => {
    if (range.start && range.end) {
      setActiveTimeFilter("range")
      onFilterChange({
        dateRange: range,
        // Resetear daysBack
        daysBack: null,
      })
    } else if (!range.start && !range.end) {
      // Si se limpió el rango, volver a daysBack por defecto
      setActiveTimeFilter("days")
      onFilterChange({
        dateRange: { start: null, end: null },
        daysBack: 15, // Valor por defecto
      })
    }
  }

  // Presets para los botones de filtros rápidos
  const presets = {
    starken: {
      dateRange: { start: null, end: null },
      daysBack: 14,
      status: "handling",
      courier: "Starken",
      paymentType: "",
      deliveryType: "delivery",
      brand: filters.brand, // Mantener la marca actual
    },
    localPickup: {
      dateRange: { start: null, end: null },
      daysBack: 14,
      status: "handling",
      courier: "Retiro en tienda",
      paymentType: "",
      deliveryType: "pickup-in-point",
      brand: filters.brand, // Mantener la marca actual
    },
    santiagoDelivery: {
      dateRange: { start: null, end: null },
      daysBack: 14,
      status: "handling",
      courier: "Despacho RM",
      paymentType: "",
      deliveryType: "delivery",
      brand: filters.brand, // Mantener la marca actual
    },
    NoventayNueveMin: {
      dateRange: { start: null, end: null },
      daysBack: 7,
      status: "handling",
      courier: "99MinSameday",
      paymentType: "Webpay",
      deliveryType: "delivery",
      brand: filters.brand, // Mantener la marca actual
    },
    NoventayNueveMinNext: {
      dateRange: { start: null, end: null },
      daysBack: 7,
      status: "handling",
      courier: "99MinNextday",
      paymentType: "Webpay",
      deliveryType: "delivery",
      brand: filters.brand, // Mantener la marca actual
    },
    retail: {
      dateRange: { start: null, end: null },
      daysBack: 31,
      status: "handling",
      courier: "",
      paymentType: "Webpay",
      deliveryType: "",
      brand: filters.brand, // Mantener la marca actual
    },
    all: {
      dateRange: { start: null, end: null },
      daysBack: 31,
      status: "",
      courier: "",
      paymentType: "",
      deliveryType: "",
      brand: filters.brand, // Mantener la marca actual
    },
    webpay: {
      //set today
      dateRange: { start: new Date(), end: null },
      daysBack: 7,
      status: "",
      courier: "",
      paymentType: "Webpay",
      deliveryType: "",
      brand: filters.brand, // Mantener la marca actual
    }
  }

  // Función para aplicar un preset
  const applyPreset = (
    presetName: 'starken' | 'localPickup' | 'santiagoDelivery' | 'NoventayNueveMin' | 'NoventayNueveMinNext' | 'retail' | 'all' | 'webpay'
  ) => {
    onFilterChange(presets[presetName])
    setActiveTimeFilter("days") // Asegurarnos de que el filtro activo sea "days" tras aplicar un preset
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 overflow-hidden m-8 mt-8"
    >
      {/* Botones de presets en la parte superior */}
      <div className="px-4 pt-4 pb-2">
        <div className="mb-3 border-b border-gray-700/30 pb-3">
          <h3 className="text-sm text-gray-300 mb-2">Presets rápidos:</h3>
          <div className="flex flex-wrap gap-2">
            {/* 
              6. Si el usuario tiene permiso de contabilidad (isAccounting === true),
                 solo mostramos el preset "Webpay". De lo contrario, mostramos todos.
            */}
            {isAccounting ? (
              <motion.button
                onClick={() => applyPreset('webpay')}
                className="px-4 py-1.5 rounded-full text-sm bg-red-600/20 text-red-400 border border-red-500/40 hover:bg-red-600/30 shadow-sm shadow-red-500/20"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Webpay
              </motion.button>
            ) : (
              <>
                <motion.button
                  onClick={() => applyPreset('starken')}
                  className="px-4 py-1.5 rounded-full text-sm bg-green-600/20 text-green-400 border border-green-500/40 hover:bg-green-600/30 shadow-sm shadow-green-500/20"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Starken
                </motion.button>
                <motion.button
                  onClick={() => applyPreset('localPickup')}
                  className="px-4 py-1.5 rounded-full text-sm bg-red-600/20 text-red-400 border border-red-500/40 hover:bg-red-600/30 shadow-sm shadow-red-500/20"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Retiro en Local
                </motion.button>
                <motion.button
                  onClick={() => applyPreset('santiagoDelivery')}
                  className="px-4 py-1.5 rounded-full text-sm bg-blue-600/20 text-blue-400 border border-blue-500/40 hover:bg-blue-600/30 shadow-sm shadow-blue-500/20"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Despacho Santiago
                </motion.button>
                <motion.button
                  onClick={() => applyPreset('all')}
                  className="px-4 py-1.5 rounded-full text-sm bg-orange-600/20 text-orange-400 border border-orange-500/40 hover:bg-orange-600/30 shadow-sm shadow-orange-500/20"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Todo
                </motion.button>
                <motion.button
                  onClick={() => applyPreset('webpay')}
                  className="px-4 py-1.5 rounded-full text-sm bg-red-600/20 text-red-400 border border-red-500/40 hover:bg-red-600/30 shadow-sm shadow-red-500/20"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Webpay
                </motion.button>
                <motion.button
                  onClick={() => applyPreset('NoventayNueveMin')}
                  className="px-4 py-1.5 rounded-full text-sm bg-green-300/20 text-green-300 border border-green-200/40 hover:bg-green-300/30 shadow-sm shadow-green-300/20"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  99 Min Sameday
                </motion.button>
                <motion.button
                  onClick={() => applyPreset('NoventayNueveMinNext')}
                  className="px-4 py-1.5 rounded-full text-sm bg-green-300/20 text-green-300 border border-green-200/40 hover:bg-green-300/30 shadow-sm shadow-green-300/20"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  99 Min Nextday
                </motion.button>
                <motion.button
                  onClick={() => applyPreset('retail')}
                  className="px-4 py-1.5 rounded-full text-sm bg-purple-600/20 text-purple-400 border border-purple-500/40 hover:bg-purple-600/30 shadow-sm shadow-purple-500/20"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Todo Retail
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Controles de filtros principales */}
      <div className="px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Selector de Marca (Nuevo) */}
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">Marca</label>
            <Select
              options={brandOptions}
              value={filters.brand}
              onChange={(value) => onFilterChange({ brand: value })}
            />
          </div>

          {/* Días atrás */}
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">
              {activeTimeFilter === "days"
                ? "Período predefinido"
                : "Usando rango personalizado"}
            </label>
            <Select
              options={daysBackOptions}
              value={filters.daysBack}
              onChange={handleDaysBackChange}
              disabled={activeTimeFilter === "range"}
            />
            {activeTimeFilter === "range" && (
              <p className="text-xs text-blue-400 mt-1">
                Se está usando un rango de fechas personalizado.
              </p>
            )}
          </div>

          {/* Estado */}
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">Estado</label>
            <Select
              options={statusOptions}
              value={filters.status}
              onChange={(value) => onFilterChange({ status: value })}
            />
          </div>

          {/* Transportista */}
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">Transportista</label>
            <Select
              options={courierOptions}
              value={filters.courier}
              onChange={(value) => onFilterChange({ courier: value })}
            />
          </div>

          {/* Búsqueda por ID */}
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">Buscar por ID</label>
            <input
              type="text"
              placeholder="ID del pedido"
              value={filters.orderId || ""}
              onChange={(e) => onFilterChange({ orderId: e.target.value })}
              className="w-full rounded border border-gray-600 bg-gray-800 text-white p-2"
            />
          </div>

          {/* Botón para expandir/contraer más filtros */}
          <div className="flex items-end">
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center gap-2 transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-transform duration-300 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              {isExpanded ? "Menos filtros" : "Más filtros"}
            </motion.button>
          </div>
        </div>

        {/* Filtros adicionales (fecha personalizada, método de pago, tipo de entrega) */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 pt-4 border-t border-gray-700/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rango de fechas personalizado */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Rango de fechas personalizado
                  {activeTimeFilter === "days" && (
                    <span className="text-xs text-yellow-400 ml-1">
                      (desactivará el período predefinido)
                    </span>
                  )}
                </label>
                <DateRangePicker
                  startDate={filters.dateRange.start}
                  endDate={filters.dateRange.end}
                  onChange={handleDateRangeChange}
                />
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Método de pago
                </label>
                <Select
                  options={paymentOptions}
                  value={filters.paymentType}
                  onChange={(value) => onFilterChange({ paymentType: value })}
                />
              </div>

              {/* Tipo de entrega */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Canal de entrega
                </label>
                <Select
                  options={deliveryOptions}
                  value={filters.deliveryType}
                  onChange={(value) => onFilterChange({ deliveryType: value })}
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Barra inferior con "chips" de filtros y botón de limpiar */}
      <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 p-4 flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-300">Filtros aplicados:</span>
          {filters.brand && (
            <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-300">
              {brandOptions.find((o) => o.value === filters.brand)?.label || filters.brand}
            </span>
          )}
          {activeTimeFilter === "days" && filters.daysBack && (
            <span className="px-2 py-1 text-xs rounded-full bg-indigo-500/20 text-indigo-300">
              {daysBackOptions.find((o) => o.value === filters.daysBack)?.label ||
                `Últimos ${filters.daysBack} días`}
            </span>
          )}
          {activeTimeFilter === "range" &&
            filters.dateRange.start &&
            filters.dateRange.end && (
              <span className="px-2 py-1 text-xs rounded-full bg-pink-500/20 text-pink-300">
                {new Date(filters.dateRange.start).toLocaleDateString()} -{" "}
                {new Date(filters.dateRange.end).toLocaleDateString()}
              </span>
            )}
          {filters.status && (
            <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300">
              {statusOptions.find((o) => o.value === filters.status)?.label}
            </span>
          )}
          {filters.courier && (
            <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300">
              {courierOptions.find((o) => o.value === filters.courier)?.label}
            </span>
          )}
          {filters.paymentType && (
            <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-300">
              {paymentOptions.find((o) => o.value === filters.paymentType)?.label}
            </span>
          )}
          {filters.deliveryType && (
            <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-300">
              {deliveryOptions.find((o) => o.value === filters.deliveryType)?.label}
            </span>
          )}
          {filters.orderId && (
            <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-300">
              ID: {filters.orderId}
            </span>
          )}
        </div>

        <motion.button
          onClick={() =>
            onFilterChange({
              dateRange: { start: null, end: null },
              daysBack: 15,
              status: "",
              courier: "",
              paymentType: "",
              deliveryType: "",
              orderId: "",
              brand: filters.brand, // Mantener la marca al limpiar los filtros
            })
          }
          className="px-3 py-1 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center gap-1 transition-colors"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
          Limpiar filtros
        </motion.button>
      </div>
    </motion.div>
  )
}