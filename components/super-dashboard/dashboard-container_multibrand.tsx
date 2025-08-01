"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import DashboardHeader from "./dashboard-header"
import SearchFilters from "./search-filters"
// Importar la vista de logística retail y las demás vistas
import LogisticsView from "./views/logistics-view-retail"
import AccountingView from "./views/accounting-view"
import ProductsView from "./views/products-view"
import AnalyticsView from "./views/analytics-view"
import LoadingOverlay from "./ui/loading-overlay"
import Pagination from "./ui/pagination"
import { fetchAllOrders } from "@/lib/api"
import { useSession } from "next-auth/react"
import { checkPermissions } from "@/lib/permissions"

type ViewType = "logistics" | "accounting" | "products" | "analytics"
// Añadir tipo para las marcas
type BrandType = "" | "blanik" | "bbq" 

export default function DashboardContainer() {
  // Estado de la sesión y verificación de permisos usando session.session
  const { data: session, status } = useSession()
  const [permissions, setPermissions] = useState({ logistics: false, accounting: false })
  const [loadingPermissions, setLoadingPermissions] = useState(true)

  // Estado de la vista actual
  const [view, setView] = useState<ViewType>("logistics")
  const [isLoading, setIsLoading] = useState(false)
  const [allOrders, setAllOrders] = useState([])       // Lista completa de pedidos
  const [displayOrders, setDisplayOrders] = useState([]) // Pedidos filtrados (para mostrar)
  const [error, setError] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const [filters, setFilters] = useState({
    dateRange: { start: null, end: null },
    daysBack: 150,
    status: "",
    courier: "",
    paymentType: "",
    deliveryType: "",
    brand: "all" as BrandType, // Actualizado para incluir BBQ como opción, default sigue siendo blanik
    orderId: "",
  })

  // Estado para la paginación local
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 300,
    total: 110,
    pages: 10,
  })

  // Ref para almacenar timeout de reintentos
  const retryTimeoutRef = useRef(null)

  // 1. Verificar permisos usando checkPermissions (si está autenticado, se extrae el email de session.session.user)
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
          roles: ["accounting", "payments"],
        })
        setPermissions({ logistics: hasLogistics, accounting: hasAccounting })
        setLoadingPermissions(false)

        // Preseleccionar la vista según el permiso:
        if (hasAccounting) {
          setView("accounting")
        } else if (hasLogistics) {
          setView("logistics")
        }
        // Puedes agregar más casos según otros roles (por ej. products o analytics)
      })()
    } else {
      setLoadingPermissions(false)
    }
  }, [session, status])

  // 2. Función para cargar todos los pedidos (se usa la API y se envían los filtros, incluyendo el parámetro 'brand')
  const loadAllOrders = useCallback(async () => {
    setIsLoading(true)
    setError("")

    try {
      const apiParams: any = {
        view: view === "logistics" ? "logistica" : view === "accounting" ? "payments" : "todos",
        status: filters.status,
        courier: filters.courier,
        paymentType: filters.paymentType,
        deliveryType: filters.deliveryType,
        brand: filters.brand,
      }

      // Manejo de fechas
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
        let ordersList = data.list

        // Filtrar por orderId si se ingresa un valor
        if (filters.orderId) {
          ordersList = ordersList.filter(order =>
            order.orderId.toString().includes(filters.orderId.toString())
          )
        }

        setAllOrders(ordersList)
        console.log(`Loaded ${ordersList.length} orders successfully`)
        // Aplicar paginación local
        applyPagination(ordersList, pagination.page, pagination.perPage)
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
      if (retryCount < 3) {
        console.log(`Retrying... Attempt ${retryCount + 1}`)
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1)
        }, 2000)
      }
    } finally {
      setIsLoading(false)
    }
  }, [filters, view, retryCount, pagination.perPage])

  // 3. Función para aplicar paginación local sobre la lista de pedidos
  const applyPagination = (orders, page, perPage) => {
    const startIndex = (page - 1) * perPage
    const endIndex = startIndex + perPage

    setDisplayOrders(orders.slice(startIndex, endIndex))
    setPagination(prev => ({
      ...prev,
      page,
      perPage,
      total: orders.length,
      pages: Math.ceil(orders.length / perPage),
    }))
  }

  // 4. Cada vez que cambien filtros, vista o retryCount, se cargan los pedidos automáticamente (sin debounce)
  useEffect(() => {
    loadAllOrders()

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [loadAllOrders])

  // 5. Actualizar paginación local en caso de cambios de página o límite
  useEffect(() => {
    if (allOrders.length > 0) {
      applyPagination(allOrders, pagination.page, pagination.perPage)
    }
  }, [pagination.page, pagination.perPage])

  // 6. Si cambia el campo orderId, se vuelve a aplicar la paginación filtrando la lista
  useEffect(() => {
    if (allOrders.length > 0) {
      let filteredOrders = filters.orderId
        ? allOrders.filter(order =>
            order.orderId.toString().includes(filters.orderId.toString())
          )
        : allOrders
      applyPagination(filteredOrders, pagination.page, pagination.perPage)
    }
  }, [filters.orderId, allOrders, pagination.page, pagination.perPage])

  // 7. Manejador para cambiar los filtros
  const handleFilterChange = (newFilters) => {
    console.log("Filtros cambiados:", newFilters)
    if (newFilters.hasOwnProperty("daysBack")) {
      if (newFilters.daysBack) {
        console.log("Cambiando a filtro por días atrás:", newFilters.daysBack)
        newFilters.dateRange = { start: null, end: null }
      }
    } else if (
      newFilters.hasOwnProperty("dateRange") &&
      newFilters.dateRange &&
      newFilters.dateRange.start &&
      newFilters.dateRange.end
    ) {
      console.log("Cambiando a filtro por rango de fechas personalizado")
      newFilters.daysBack = null
    }
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 }))
    setRetryCount(0)
  }

  // 8. Manejadores de paginación
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handlePerPageChange = (newPerPage: number) => {
    setPagination(prev => ({ ...prev, page: 1, perPage: newPerPage }))
  }

  const handleRetry = () => {
    setRetryCount(0)
  }

  // 9. Renderizado de la vista según el valor de "view"
  const renderView = () => {
    const props = { orders: displayOrders, isLoading }
    switch (view) {
      case "logistics":
        return <LogisticsView {...props} brand={filters.brand} />
      case "accounting":
        return <AccountingView {...props} />
      case "products":
        return <ProductsView {...props} />
      case "analytics":
        return <AnalyticsView {...props} />
      default:
        return <LogisticsView {...props} brand={filters.brand} />
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