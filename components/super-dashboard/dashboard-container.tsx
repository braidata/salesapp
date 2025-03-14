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

type ViewType = "logistics" | "accounting" | "products" | "analytics"

export default function DashboardContainer() {
  const [view, setView] = useState<ViewType>("logistics")
  const [isLoading, setIsLoading] = useState(false)
  const [allOrders, setAllOrders] = useState([]) // Almacena todos los pedidos
  const [displayOrders, setDisplayOrders] = useState([]) // Pedidos filtrados para mostrar
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
    perPage: 100,
    total: 110,
    pages: 10
  })

  // Ref para almacenar el timeout de reintento y poder limpiarlo
  const retryTimeoutRef = useRef(null)

  // Función para cargar todos los pedidos de una vez
  const loadAllOrders = useCallback(async () => {
    setIsLoading(true)
    setError("")

    try {
      // Preparar parámetros para la API
      const apiParams = {
        view: view === "logistics" ? "logistica" : view === "accounting" ? "contabilidad" : "todos",
        status: filters.status,
        courier: filters.courier,
        paymentType: filters.paymentType,
        deliveryType: filters.deliveryType,
      };
      
      // Manejo optimizado de fechas
      if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
        console.log("Usando filtrado por rango de fechas personalizado:", filters.dateRange);
        apiParams.dateStart = filters.dateRange.start;
        apiParams.dateEnd = filters.dateRange.end;
        // Si hay fechas específicas, no usamos daysBack
      } else if (filters.daysBack) {
        console.log("Usando filtrado por días atrás:", filters.daysBack);
        apiParams.daysBack = filters.daysBack;
      }
      
      console.log("Loading all orders with params:", apiParams);
      
      const data = await fetchAllOrders(apiParams);

      if (data && data.list) {
        setAllOrders(data.list)
        console.log(`Loaded ${data.list.length} orders successfully`)
        
        // Aplicar paginación local
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

      // Si aún no se han realizado 3 reintentos, programa un nuevo intento
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

  // Función para aplicar paginación local
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

  useEffect(() => {
    loadAllOrders()

    // Limpiar el timeout al desmontar o antes de ejecutar de nuevo el efecto
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [loadAllOrders])

  // Cuando cambia la página o perPage, aplicar paginación local
  useEffect(() => {
    if (allOrders.length > 0) {
      applyPagination(allOrders, pagination.page, pagination.perPage)
    }
  }, [pagination.page, pagination.perPage])

  // Manejar cambios en los filtros
  const handleFilterChange = (newFilters) => {
    console.log("Filtros cambiados:", newFilters);
    
    // Lógica especial para manejar el cambio entre daysBack y rango de fechas personalizado
    if (newFilters.hasOwnProperty('daysBack')) {
      // Si se seleccionó un nuevo daysBack, resetear el rango de fechas
      if (newFilters.daysBack) {
        console.log("Cambiando a filtro por días atrás:", newFilters.daysBack);
        newFilters.dateRange = { start: null, end: null };
      }
    } 
    else if (newFilters.hasOwnProperty('dateRange') && 
             newFilters.dateRange && 
             newFilters.dateRange.start && 
             newFilters.dateRange.end) {
      // Si se seleccionó un rango de fechas, resetear daysBack
      console.log("Cambiando a filtro por rango de fechas personalizado");
      newFilters.daysBack = null;
    }
    
    // Actualizar el estado con los nuevos filtros
    setFilters((prev) => ({ ...prev, ...newFilters }));
    
    // Resetear la paginación
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // Reiniciar contador de reintentos
    setRetryCount(0);
  }

  // Método para cambiar de página
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  // Método para cambiar el límite de elementos por página
  const handlePerPageChange = (newPerPage: number) => {
    setPagination(prev => ({ ...prev, page: 1, perPage: newPerPage }))
  }

  const handleRetry = () => {
    setRetryCount(0) // Reiniciar contador para forzar una nueva carga
  }

  const renderView = () => {
    const props = { orders: displayOrders, isLoading }

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
                
                {/* Componente de paginación */}
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