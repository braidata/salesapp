// components/dashboard/services/vtexService.ts
import { useState, useCallback } from 'react';

// Tipo para la caché
interface VtexCache {
  [key: string]: {
    data: any;
    timestamp: number;
    expiresAt: number;
  }
}

// Estados globales para la caché (fuera del componente para persistencia entre renderizados)
let globalCache: VtexCache = {};
let activeRequests: Map<string, AbortController> = new Map();

// Hook personalizado para usar el servicio VTEX
export const useVtexService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Función para cancelar solicitudes en curso
  const cancelActiveRequests = useCallback(() => {
    activeRequests.forEach((controller, key) => {
      controller.abort();
      activeRequests.delete(key);
    });
  }, []);
  
  // Función para limpiar la caché
  const clearCache = useCallback(() => {
    globalCache = {};
  }, []);
  
  // Función principal para obtener datos de VTEX
  const fetchVtexData = useCallback(async ({
    endpoints = [],
    forceRefresh = false,
    cacheDuration = 5 * 60 * 1000, // 5 minutos
    onProgress = (percent: number) => {}
  }: {
    endpoints: Array<{
      key: string;
      url: string;
      params?: Record<string, string>;
    }>;
    forceRefresh?: boolean;
    cacheDuration?: number;
    onProgress?: (percent: number) => void;
  }) => {
    if (endpoints.length === 0) return {};
    
    try {
      setIsLoading(true);
      setError(null);
      setProgress(0);
      
      // Si se fuerza actualización, cancelar solicitudes activas
      if (forceRefresh) {
        cancelActiveRequests();
      }
      
      // Resultado final
      const results: Record<string, any> = {};
      
      // Procesamos cada endpoint
      await Promise.all(endpoints.map(async (endpoint, index) => {
        const { key, url, params = {} } = endpoint;
        
        // Crear clave de caché
        const queryParams = new URLSearchParams(params).toString();
        const cacheKey = `${url}?${queryParams}`;
        
        // Verificar caché si no se fuerza actualización
        const now = Date.now();
        if (!forceRefresh && 
            globalCache[cacheKey] && 
            globalCache[cacheKey].expiresAt > now) {
          results[key] = globalCache[cacheKey].data;
          
          // Actualizar progreso
          const newProgress = Math.round(((index + 1) / endpoints.length) * 100);
          setProgress(newProgress);
          onProgress(newProgress);
          
          return; // Usar caché
        }
        
        // Si hay una solicitud activa para esta URL, la cancelamos
        if (activeRequests.has(cacheKey)) {
          activeRequests.get(cacheKey)?.abort();
          activeRequests.delete(cacheKey);
        }
        
        // Crear un controlador de aborto para esta solicitud
        const controller = new AbortController();
        activeRequests.set(cacheKey, controller);
        
        try {
          // Construir la URL completa
          const fullUrl = `${url}${queryParams ? `?${queryParams}` : ''}`;
          
          // Realizar la solicitud
          const response = await fetch(fullUrl, {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          // Guardar en caché
          globalCache[cacheKey] = {
            data,
            timestamp: now,
            expiresAt: now + cacheDuration
          };
          
          // Guardar en resultados
          results[key] = data;
          
          // Eliminar de solicitudes activas
          activeRequests.delete(cacheKey);
          
          // Actualizar progreso
          const newProgress = Math.round(((index + 1) / endpoints.length) * 100);
          setProgress(newProgress);
          onProgress(newProgress);
          
        } catch (err: any) {
          // Si fue cancelada, ignorar el error
          if (err.name === 'AbortError') return;
          
          // Otro tipo de error
          throw err;
        }
      }));
      
      return results;
    } catch (err: any) {
      setError(err.message || 'Error al obtener datos de VTEX');
      console.error('Error en fetchVtexData:', err);
      return {};
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  }, [cancelActiveRequests]);
  
  // Función para obtener productos
  const fetchProducts = useCallback(async (options: {
    categoryId?: string;
    brandId?: string;
    page?: number;
    perPage?: number;
    forceRefresh?: boolean;
  } = {}) => {
    const {
      categoryId = "",
      brandId = "",
      page = 1,
      perPage = 50,
      forceRefresh = false
    } = options;
    
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    
    const params: Record<string, string> = { from: String(from), to: String(to) };
    if (categoryId) params.categoryId = categoryId;
    if (brandId) params.brandId = brandId;
    
    const result = await fetchVtexData({
      endpoints: [{
        key: 'products',
        url: '/api/vtex-products',
        params
      }],
      forceRefresh
    });
    
    return result.products || [];
  }, [fetchVtexData]);
  
  // Función para obtener órdenes
  const fetchOrders = useCallback(async (options: {
    startDate: string;
    endDate: string;
    page?: number;
    perPage?: number;
    forceRefresh?: boolean;
  }) => {
    const {
      startDate,
      endDate,
      page = 1,
      perPage = 20,
      forceRefresh = false
    } = options;
    
    const result = await fetchVtexData({
      endpoints: [{
        key: 'orders',
        url: '/api/vtex-orders-list',
        params: {
          startDate,
          endDate,
          page: String(page),
          perPage: String(perPage)
        }
      }],
      forceRefresh
    });
    
    return result.orders || [];
  }, [fetchVtexData]);
  
  // Función para obtener una orden específica
  const fetchOrderDetails = useCallback(async (orderId: string, forceRefresh = false) => {
    const result = await fetchVtexData({
      endpoints: [{
        key: 'orderDetails',
        url: '/api/vtex-order',
        params: { orderId }
      }],
      forceRefresh
    });
    
    return result.orderDetails;
  }, [fetchVtexData]);
  
  return {
    isLoading,
    progress,
    error,
    fetchProducts,
    fetchOrders,
    fetchOrderDetails,
    clearCache,
    cancelActiveRequests
  };
};