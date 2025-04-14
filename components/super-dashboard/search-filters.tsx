"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import DateRangePicker from "./ui/date-range-picker"
import Select from "./ui/select"
import { useSession } from "next-auth/react"
import { checkPermissions } from "@/lib/permissions"

interface SearchFiltersProps {
  filters: any
  onFilterChange: (filters: any) => void
}

export default function SearchFilters({ filters, onFilterChange }: SearchFiltersProps) {
  // ──────────────── DECLARACIÓN INCONDICIONAL DE HOOKS ────────────────

  // Información de la sesión
  const { data: session, status } = useSession()

  // Estados para permisos del usuario
  const [userRole, setUserRole] = useState<"logistics" | "contabilidad" | "generic" | null>(null)
  const [permissionLoading, setPermissionLoading] = useState(true)

  // Estados propios de este componente
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTimeFilter, setActiveTimeFilter] = useState<"days" | "range">(
    filters.dateRange.start && filters.dateRange.end ? "range" : "days"
  )

  // ──────────────── EFECTO PARA VERIFICAR PERMISOS ────────────────

  useEffect(() => {
    if (status === "authenticated" && session) {
      const checkUserRoles = async () => {
        const hasLogistics = await checkPermissions({
          email: session.session.user.email,
          roles: ["logistics"],
        })
        const hasContabilidad = await checkPermissions({
          email: session.session.user.email,
          roles: ["contabilidad"],
        })

        if (!hasLogistics && !hasContabilidad) {
          setUserRole("generic")
        } else if (hasContabilidad && !hasLogistics) {
          setUserRole("contabilidad")
        } else if (hasLogistics) {
          setUserRole("logistics")
        }
        setPermissionLoading(false)
      }
      checkUserRoles()
    }
  }, [session, status])

  // ──────────────── EFECTO PARA SINCRONIZAR EL FILTRO DE FECHAS ────────────────

  useEffect(() => {
    if (filters.dateRange.start && filters.dateRange.end) {
      setActiveTimeFilter("range")
    } else if (filters.daysBack) {
      setActiveTimeFilter("days")
    }
  }, [filters])

  // ──────────────── RETORNOS TEMPRANOS ────────────────
  // Ahora ya se han declarado todos los hooks, por lo que podemos condicionar el renderizado.

  if (status !== "authenticated") {
    return <div>Acceso denegado</div>
  }

  if (permissionLoading || userRole === null) {
    return <div>Cargando permisos...</div>
  }

  // ──────────────── DEFINICIÓN DE PRESETS Y FUNCIONES ────────────────

  const presets = {
    fuertes: {
      dateRange: { start: null, end: null },
      daysBack: 14,
      status: "handling",
      courier: "Starken",
      paymentType: "",
      deliveryType: "delivery",
    },
    localPickup: {
      dateRange: { start: null, end: null },
      daysBack: 14,
      status: "handling",
      courier: "Retiro en tienda",
      paymentType: "",
      deliveryType: "pickup-in-point",
    },
    santiagoDelivery: {
      dateRange: { start: null, end: null },
      daysBack: 14,
      status: "handling",
      courier: "Despacho RM",
      paymentType: "",
      deliveryType: "delivery",
    },
    NoventayNueveMin: {
      dateRange: { start: null, end: null },
      daysBack: 7,
      status: "handling",
      courier: "99MinSameday",
      paymentType: "Webpay",
      deliveryType: "delivery",
    },
    NoventayNueveMinNext: {
      dateRange: { start: null, end: null },
      daysBack: 7,
      status: "handling",
      courier: "99MinNextday",
      paymentType: "Webpay",
      deliveryType: "delivery",
    },
    retail: {
      dateRange: { start: null, end: null },
      daysBack: 31,
      status: "handling",
      courier: "",
      paymentType: "Webpay",
      deliveryType: "",
    },
    all: {
      dateRange: { start: null, end: null },
      daysBack: 31,
      status: "",
      courier: "",
      paymentType: "",
      deliveryType: "",
    },
  }

  const applyPreset = (
    presetName: keyof typeof presets | "logistics" | "contabilidad"
  ) => {
    if (presetName === "logistics") {
      // Acción propia para "Logística"
      onFilterChange({
        ...filters,
        customFilter: "logistics",
      })
    } else if (presetName === "contabilidad") {
      // Acción propia para "Contabilidad"
      onFilterChange({
        ...filters,
        customFilter: "contabilidad",
      })
    } else {
      onFilterChange(presets[presetName as keyof typeof presets])
    }
  }

  const renderPresets = () => {
    if (userRole === "logistics") {
      return (
        <>
          {Object.keys(presets).map((key) => (
            <motion.button
              key={key}
              onClick={() => applyPreset(key as keyof typeof presets)}
              className="px-4 py-1.5 rounded-full text-sm bg-green-600/20 text-green-400 border border-green-500/40 hover:bg-green-600/30"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {key}
            </motion.button>
          ))}
          <motion.button
            onClick={() => applyPreset("logistics")}
            className="px-4 py-1.5 rounded-full text-sm bg-blue-600/20 text-blue-400 border border-blue-500/40 hover:bg-blue-600/30"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Logística
          </motion.button>
        </>
      )
    } else if (userRole === "contabilidad") {
      return (
        <div className="tabs">
          <button
            onClick={() => applyPreset("contabilidad")}
            className="px-4 py-1 rounded bg-purple-600/20 text-purple-400 border border-purple-500/40 hover:bg-purple-600/30"
          >
            Contabilidad
          </button>
        </div>
      )
    } else if (userRole === "generic") {
      return (
        <motion.button
          onClick={() => applyPreset("all")}
          className="px-4 py-1.5 rounded-full text-sm bg-orange-600/20 text-orange-400 border border-orange-500/40 hover:bg-orange-600/30"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Filtro Ad Hoc
        </motion.button>
      )
    }
  }

  // ──────────────── DEFINICIÓN DE OPCIONES ────────────────

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

  const courierOptions = [
    { value: "", label: "Todos los transportistas" },
    { value: "Despacho RM", label: "Despacho RM" },
    { value: "Starken", label: "Starken" },
    { value: "Retiro en tienda", label: "Retiro en tienda" },
    { value: "Transportadora estándar", label: "99 Minutos" },
  ]

  const paymentOptions = [
    { value: "", label: "Todos los pagos" },
    { value: "Webpay", label: "Webpay" },
    { value: "Promissory", label: "Transferencia Bancaria" },
  ]

  const deliveryOptions = [
    { value: "", label: "Todos los tipos" },
    { value: "delivery", label: "Despacho a domicilio" },
    { value: "pickup-in-point", label: "Retiro en tienda" },
  ]

  const daysBackOptions = [
    { value: 7, label: "Última semana" },
    { value: 15, label: "Últimos 15 días" },
    { value: 30, label: "Último mes" },
    { value: 90, label: "Últimos 3 meses" },
    { value: 180, label: "Últimos 6 meses" },
    { value: 365, label: "Último año" },
  ]

  // ──────────────── MANEJO DE CAMBIOS ────────────────

  const handleDaysBackChange = (value: number) => {
    setActiveTimeFilter("days")
    onFilterChange({
      daysBack: value,
      dateRange: { start: null, end: null },
    })
  }

  const handleDateRangeChange = (range: { start: Date | null; end: Date | null }) => {
    if (range.start && range.end) {
      setActiveTimeFilter("range")
      onFilterChange({
        dateRange: range,
        daysBack: null,
      })
    } else if (!range.start && !range.end) {
      setActiveTimeFilter("days")
      onFilterChange({
        dateRange: { start: null, end: null },
        daysBack: 15,
      })
    }
  }

  // ──────────────── RENDER DEL COMPONENTE ────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 overflow-hidden m-8 mt-8"
    >
      {/* Sección de presets según el rol del usuario */}
      <div className="px-4 pt-4 pb-2">
        <div className="mb-3 border-b border-gray-700/30 pb-3">
          <h3 className="text-sm text-gray-300 mb-2">Presets rápidos:</h3>
          <div className="flex flex-wrap gap-2">
            {renderPresets()}
          </div>
        </div>
      </div>

      {/* Sección de filtros generales */}
      <div className="px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Filtro de período */}
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">
              {activeTimeFilter === "days" ? "Período predefinido" : "Usando rango personalizado"}
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

          {/* Filtro de estado */}
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">Estado</label>
            <Select
              options={statusOptions}
              value={filters.status}
              onChange={(value) => onFilterChange({ status: value })}
            />
          </div>

          {/* Filtro de transportista */}
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">Transportista</label>
            <Select
              options={courierOptions}
              value={filters.courier}
              onChange={(value) => onFilterChange({ courier: value })}
            />
          </div>

          {/* Filtro de búsqueda por ID */}
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

          {/* Botón para mostrar/ocultar más filtros */}
          <div className="flex items-end">
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center gap-2 transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
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
                  Rango de fechas personalizado{" "}
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

              {/* Filtro de método de pago */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Método de pago</label>
                <Select
                  options={paymentOptions}
                  value={filters.paymentType}
                  onChange={(value) => onFilterChange({ paymentType: value })}
                />
              </div>

              {/* Filtro de canal de entrega */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Canal de entrega</label>
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

      {/* Barra inferior con filtros aplicados */}
      <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 p-4 flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-300">Filtros aplicados:</span>
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
      </div>
    </motion.div>
  )
}
