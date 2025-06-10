"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import DashboardHeader from "./dashboard-header"
import SearchFilters from "./search-filters"
import LogisticsView from "./views/logistics-view"
import AccountingView from "./views/accounting-view"
import ProductsView from "./views/products-view"
import AnalyticsView from "./views/analytics-view"
import LoadingOverlay from "./ui/loading-overlay"
import Pagination from "./ui/pagination"
import { fetchAllOrders } from "@/lib/api"
import { useSession } from "next-auth/react"
import { checkPermissions } from "@/lib/permissions"

type ViewType = "logistics" | "accounting" | "products" | "analytics"

export default function DashboardContainer() {
  // Estados para permisos usando session.session y checkPermissions
  const { data: session, status } = useSession()
  const [permissions, setPermissions] = useState({ logistics: false, accounting: false })
  const [loadingPermissions, setLoadingPermissions] = useState(true)

  // Estado para la vista actual (preestablecer según el rol)
  const [view, setView] = useState<ViewType>("logistics")
  const [isLoading, setIsLoading] = useState(false)
  const [allOrders, setAllOrders] = useState([])      // Lista completa de pedidos
  const [displayOrders, setDisplayOrders] = useState([]) // Pedidos que se mostrarán (filtrados)
  const [error, setError] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const [filters, setFilters] = useState({
    dateRange: { start: null, end: null },
    daysBack: 150,
    status: "",
    courier: "",
    paymentType: "",
    deliveryType: "",
  })

  // Estado para la paginación local
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 300,
    total: 110,
    pages: 10
  })

  // Ref para almacenar timeout en caso de reintentos
  const retryTimeoutRef = useRef(null)

  // 1. Verificamos permisos con checkPermissions usando session.session
  useEffect(() => {
    if (status === "authenticated" && session) {
      (async () => {
        const email = session.session.user.email
        const hasLogistics = await checkPermissions({
          email,
          roles: ["logistics"],
        })
        const hasAccounting = await checkPermissions({
          email,
          roles: ["accounting", "contabilidad"],
        })

        setPermissions({ logistics: hasLogistics, accounting: hasAccounting })
        setLoadingPermissions(false)

        // Preseleccionamos la vista según el permiso:
        // Si tiene permisos de contabilidad, se fija la vista en Accounting.
        if (hasAccounting) {
          setView("accounting")
        } else if (hasLogistics) {
          setView("logistics")
        }
        // Se puede extender para otros roles según necesidades.
      })()
    } else {
      setLoadingPermissions(false)
    }
  }, [session, status])

  // 2. Función para cargar todos los pedidos (se invoca automáticamente cuando cambien filtros o vista)
  const loadAllOrders = useCallback(async () => {
    setIsLoading(true)
    setError("")

    try {
      const apiParams: any = {
        view: view === "logistics" ? "logistica" : view === "accounting" ? "contabilidad" : "todos",
        status: filters.status,
        courier: filters.courier,
        paymentType: filters.paymentType,
        deliveryType: filters.deliveryType,
      }

      if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
        console.log("Usando filtrado por rango de fechas personalizado:", filters.dateRange)
        apiParams.dateStart = filters.dateRange.start
        apiParams.dateEnd = filters.dateRange.end
      } else if (filters.daysBack) {
        console.log("Usando filtrado por días atrás:", filters.daysBack)
        apiParams.daysBack = filters.daysBack
      }

      console.log("Loading all orders with params:", apiParams)
      const data = await fetchAllOrders(apiParams)

      if (data && data.list) {
        setAllOrders(data.list)
        console.log(`Loaded ${data.list.length} orders successfully`)
        // Aplicamos la paginación local
        applyPagination(data.list, pagination.page, pagination.perPage)
      } else {
        console.warn("API returned data without list property:", data)
        setAllOrders([])
        setDisplayOrders([])
      }
    } catch (err: any) {
      console.error("Error fetching orders:", err)
      setError(
        "No se pudieron cargar los pedidos. Por favor, intente nuevamente. " +
          (err.message ? `(${err.message})` : "")
      )

      // Reintento automático si retryCount es menor a 3
      if (retryCount < 3) {
        console.log(`Retrying... Attempt ${retryCount + 1}`)
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount((prev) => prev + 1)
        }, 2000)
      }
    } finally {
      setIsLoading(false)
    }
  }, [filters, view, retryCount, pagination.perPage])

  // 3. Función para aplicar la paginación local
  const applyPagination = (orders, page, perPage) => {
    const startIndex = (page - 1) * perPage
    const endIndex = startIndex + perPage

    setDisplayOrders(orders.slice(startIndex, endIndex))
    setPagination(prev => ({
      ...prev,
      page,
      perPage,
      total: orders.length,
      pages: Math.ceil(orders.length / perPage)
    }))
  }

  // 4. Efecto para cargar pedidos automáticamente cada vez que cambien los parámetros
  useEffect(() => {
    loadAllOrders()

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [loadAllOrders])

  // 5. Actualizar la paginación local cuando cambie la página o el límite
  useEffect(() => {
    if (allOrders.length > 0) {
      applyPagination(allOrders, pagination.page, pagination.perPage)
    }
  }, [pagination.page, pagination.perPage])

  // 6. Manejar cambios en los filtros.
  // Al actualizar el estado de filters, el efecto (4) disparará la carga automática.
  const handleFilterChange = (newFilters) => {
    console.log("Filtros cambiados:", newFilters)
    if (newFilters.hasOwnProperty('daysBack')) {
      if (newFilters.daysBack) {
        console.log("Cambiando a filtro por días atrás:", newFilters.daysBack)
        newFilters.dateRange = { start: null, end: null }
      }
    } else if (newFilters.hasOwnProperty('dateRange') &&
               newFilters.dateRange &&
               newFilters.dateRange.start &&
               newFilters.dateRange.end) {
      console.log("Cambiando a filtro por rango de fechas personalizado")
      newFilters.daysBack = null
    }
    
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 }))
    setRetryCount(0)
  }

  // 7. Manejadores para cambios de página y límite
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handlePerPageChange = (newPerPage: number) => {
    setPagination(prev => ({ ...prev, page: 1, perPage: newPerPage }))
  }

  const handleRetry = () => {
    setRetryCount(0)
  }

  // 8. Renderizado de la vista según el valor de "view"
  const renderView = () => {
    const props = { orders: displayOrders, isLoading, filters }
    switch (view) {
      case "logistics":
        return <LogisticsView {...props} />
      case "accounting":
        return <AccountingView {...props} />
      case "products":
        return <ProductsView {...props} />
      case "analytics":
        return <AnalyticsView {...props} />
      default:
        return <LogisticsView {...props} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-6 rounded-lg w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-[1600px] mx-auto"
      >
        <DashboardHeader activeView={view} onViewChange={setView} />

        <SearchFilters filters={filters} onFilterChange={handleFilterChange} />

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            {error ? (
              <div className="backdrop-blur-lg bg-red-500/10 rounded-xl p-6 text-center border border-red-500/20">
                <p className="text-red-300 mb-4">{error}</p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <>
                {renderView()}

                {displayOrders.length > 0 && (
                  <div className="mt-6 mx-8">
                    <Pagination 
                      currentPage={pagination.page}
                      totalPages={pagination.pages}
                      totalItems={pagination.total}
                      itemsPerPage={pagination.perPage}
                      onPageChange={handlePageChange}
                      onLimitChange={handlePerPageChange}
                    />
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {isLoading && <LoadingOverlay />}
    </div>
  )
}
