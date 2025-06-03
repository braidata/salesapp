// hooks/useAnalyticsData.ts
import { useState, useRef, useCallback } from 'react';
import { useSapService } from '../services/sapService';

// Tipos generales
export interface DataPoint {
    date?: string;
    name?: string;
    value: number;
    label?: string;
    quantity?: number;
    sessions?: number;
    bounceRate?: number;
    conversionRate?: number;
    clicks?: number;
    impressions?: number;
    ctr?: number;
    cost?: number;
    abandoned?: number;
    purchases?: number;
    abandonmentRate?: number;
    [key: string]: any;
}

export interface KPIResponse {
    data: Record<string, any>;
    metadata: {
        periodo: {
            startDate: string;
            endDate: string;
        };
        kpisExitosos: number;
        totalSessions?: number;
        totalUsers?: number;
        totalRevenue?: number;
    };
}

export interface CustomDateRange {
    startDate: string;
    endDate: string;
}

// Tipos para los pedidos SAP
interface Pedido {
    purchaseOrder: string;
    sapOrder: string;
    customer: string;
    creationDate?: string; // ISO UTC
    status?: string;
    statusCode?: string;
    totalAmount?: string | number;
    documentType?: string;
    documentTypeText?: string;
    document?: string;
    febosFC?: string;
    items?: PedidoDetalle[];
    rawData?: {
        creationDateFormatted?: string;
        totalAmount?: number;
        items?: any[];
        [key: string]: any;
    };
    [key: string]: any;
}

interface PedidoDetalle {
    sku?: string;
    name?: string;
    quantity?: number;
    amount?: string | number;
    [key: string]: any;
}

interface UnifiedKPIData {
    type: 'sql' | 'ga4' | 'ads' | 'unknown';
    data: DataPoint[];
    metadata?: any;
    error?: string;
    rawData?: any;
}

export const useAnalyticsData = () => {
    // Estados generales
    const [data, setData] = useState<KPIResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [pedidos, setPedidos] = useState<Pedido[]>([]);

    // Caché con TTL
    const cacheRef = useRef<Record<string, { data: any; timestamp: number; ttl: number }>>({});
    const abortControllerRef = useRef<AbortController | null>(null);
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
    const MAX_CACHE_SIZE = 10;

    const clearExpiredCache = useCallback(() => {
        const now = Date.now();
        Object.entries(cacheRef.current).forEach(([key, val]) => {
            if (now - val.timestamp > val.ttl) delete cacheRef.current[key];
        });
        const remaining = Object.entries(cacheRef.current);
        if (remaining.length > MAX_CACHE_SIZE) {
            remaining
                .sort((a, b) => a[1].timestamp - b[1].timestamp)
                .slice(0, remaining.length - MAX_CACHE_SIZE)
                .forEach(([key]) => delete cacheRef.current[key]);
        }
    }, []);

    const clearSqlCache = useCallback(() => {
        cacheRef.current = {};
        setPedidos([]);
    }, []);

    // Hook SAP externo
    const { fetchOrdersList } = useSapService();

    // ---------------------------------------------------------
    // Funciones auxiliares para SAP (fecha, cálculos, etc.)
    // ---------------------------------------------------------
    const extraerFechaNormalizada = useCallback((pedido: any): string | null => {
        const rawFormatted = pedido.rawData?.creationDateFormatted;
        if (rawFormatted && /^\d{4}-\d{2}-\d{2}$/.test(rawFormatted)) {
            return rawFormatted;
        }
        const fechaPedido = pedido.creationDate;
        if (!fechaPedido) return null;
        try {
            if (typeof fechaPedido === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaPedido)) {
                return fechaPedido;
            }
            if (typeof fechaPedido === 'string' && fechaPedido.includes('T')) {
                const fechaISO = fechaPedido.split('T')[0];
                const testDate = new Date(fechaISO + 'T12:00:00.000Z');
                if (isNaN(testDate.getTime())) return null;
                return fechaISO;
            }
            const fechaObj = new Date(fechaPedido);
            if (isNaN(fechaObj.getTime())) return null;
            const year = fechaObj.getFullYear();
            const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
            const day = String(fechaObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch {
            return null;
        }
    }, []);

    const fechaEstaEnRango = useCallback((fecha: string, fechaInicio?: string, fechaFin?: string): boolean => {
        if (!fechaInicio && !fechaFin) return true;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
        let enRango = true;
        if (fechaInicio) enRango = enRango && fecha >= fechaInicio;
        if (fechaFin) enRango = enRango && fecha <= fechaFin;
        return enRango;
    }, []);

    const toNumber = useCallback((x: string | number | undefined): number => {
        if (x === undefined || x === null) return 0;
        const n = typeof x === 'number' ? x : Number(x);
        return isNaN(n) ? 0 : n;
    }, []);

    const calcularTotalPedido = useCallback((pedido: any): number => {
        if (!pedido.items || !Array.isArray(pedido.items) || pedido.items.length === 0) {
            return toNumber(pedido.totalAmount ?? pedido.rawData?.totalAmount);
        }
        return pedido.items.reduce((sum: number, detalle: any) => {
            return sum + toNumber(detalle.amount);
        }, 0);
    }, [toNumber]);

    const calcularVentaDiaria = useCallback(
        (pedidosArr: Pedido[], fechaInicio?: string, fechaFin?: string): Array<{ fecha: string; valor: number }> => {
            if (!pedidosArr || !Array.isArray(pedidosArr)) return [];
            const ventaPorFecha: Record<string, number> = {};
            pedidosArr.forEach((pedido) => {
                const fecha = extraerFechaNormalizada(pedido);
                if (!fecha) return;
                if (!fechaEstaEnRango(fecha, fechaInicio, fechaFin)) return;
                const totalPedido = calcularTotalPedido(pedido);
                if (totalPedido <= 0) return;
                if (!ventaPorFecha[fecha]) ventaPorFecha[fecha] = 0;
                ventaPorFecha[fecha] += totalPedido;
            });
            return Object.entries(ventaPorFecha)
                .map(([fecha, valor]) => ({ fecha, valor }))
                .sort((a, b) => a.fecha.localeCompare(b.fecha));
        },
        [extraerFechaNormalizada, fechaEstaEnRango, calcularTotalPedido]
    );

    const calcularVentaAcumulada = useCallback(
        (pedidosArr: Pedido[], fechaInicio?: string, fechaFin?: string): Array<{ fecha: string; valor: number }> => {
            const ventaDiaria = calcularVentaDiaria(pedidosArr, fechaInicio, fechaFin);
            let acumulado = 0;
            return ventaDiaria.map((item) => {
                acumulado += item.valor;
                return { fecha: item.fecha, valor: acumulado };
            });
        },
        [calcularVentaDiaria]
    );

    const calcularPedidosDiarios = useCallback(
        (pedidosArr: Pedido[], fechaInicio?: string, fechaFin?: string): Array<{ fecha: string; valor: number }> => {
            if (!pedidosArr || !Array.isArray(pedidosArr)) return [];
            const pedidosPorFecha: Record<string, number> = {};
            pedidosArr.forEach((pedido) => {
                const fecha = extraerFechaNormalizada(pedido);
                if (!fecha) return;
                if (!fechaEstaEnRango(fecha, fechaInicio, fechaFin)) return;
                if (!pedidosPorFecha[fecha]) pedidosPorFecha[fecha] = 0;
                pedidosPorFecha[fecha]++;
            });
            return Object.entries(pedidosPorFecha)
                .map(([fecha, valor]) => ({ fecha, valor }))
                .sort((a, b) => a.fecha.localeCompare(b.fecha));
        },
        [extraerFechaNormalizada, fechaEstaEnRango]
    );

    const calcularTicketPromedioDiario = useCallback(
        (pedidosArr: Pedido[], fechaInicio?: string, fechaFin?: string): Array<{ fecha: string; valor: number }> => {
            const ventaDiaria = calcularVentaDiaria(pedidosArr, fechaInicio, fechaFin);
            const pedidosDiarios = calcularPedidosDiarios(pedidosArr, fechaInicio, fechaFin);
            const ticketPromedio: Array<{ fecha: string; valor: number }> = [];
            ventaDiaria.forEach((venta) => {
                const pedidosDia = pedidosDiarios.find((p) => p.fecha === venta.fecha);
                if (pedidosDia && pedidosDia.valor > 0) {
                    ticketPromedio.push({ fecha: venta.fecha, valor: venta.valor / pedidosDia.valor });
                }
            });
            return ticketPromedio;
        },
        [calcularVentaDiaria, calcularPedidosDiarios]
    );

    const agruparDetallesPorSKU = useCallback(
        (detalles: PedidoDetalle[]): Array<{ sku: string; cantidad: number; total: number }> => {
            if (!detalles || !Array.isArray(detalles)) return [];
            const agrupados: Record<string, { cantidad: number; total: number }> = {};
            detalles.forEach((detalle) => {
                const sku = detalle.sku;
                const cantidad = detalle.quantity ?? 1;
                const total = toNumber(detalle.amount);
                if (!sku) return;
                if (!agrupados[sku]) agrupados[sku] = { cantidad: 0, total: 0 };
                agrupados[sku].cantidad += cantidad;
                agrupados[sku].total += total;
            });
            return Object.entries(agrupados)
                .map(([sku, data]) => ({ sku, ...data }))
                .sort((a, b) => b.total - a.total);
        },
        [toNumber]
    );

    const convertRelativeDateToISO = useCallback((relativeDate: string): string => {
        const today = new Date();
        switch (relativeDate) {
            case 'today':
                return today.toISOString().split('T')[0];
            case 'yesterday':
                today.setDate(today.getDate() - 1);
                return today.toISOString().split('T')[0];
            case '7daysAgo':
                today.setDate(today.getDate() - 7);
                return today.toISOString().split('T')[0];
            case '30daysAgo':
                today.setDate(today.getDate() - 30);
                return today.toISOString().split('T')[0];
            default:
                return relativeDate;
        }
    }, []);

    const formatCurrency = useCallback((value: number): string => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    }, []);

    const validateDataPoint = useCallback((item: any): item is DataPoint => {
        console.log('🔍 Validating DataPoint:', {
            item: item,
            type: typeof item,
            isNull: item === null,
            isUndefined: item === undefined,
            hasValue: 'value' in item,
            valueType: typeof item?.value,
            valueIsNumber: typeof item?.value === 'number',
            valueIsNaN: isNaN(item?.value),
            actualValue: item?.value
        });
        
        const isValid = (
            typeof item === 'object' &&
            item !== null &&
            'value' in item &&
            typeof item.value === 'number' &&
            !isNaN(item.value)
        );
        
        console.log('🔍 Validation result:', isValid);
        return isValid;
    }, []);

    // ---------------------------------------------------------
    // Funciones de GA4 (mejoradas y completas)
    // ---------------------------------------------------------
    const formatGA4Data = useCallback((kpiKey: string, ga4Response: any): DataPoint[] => {
        console.group(`🔍 formatGA4Data for ${kpiKey}`);
        console.log('Raw GA4 response:', ga4Response);
        
        if (!ga4Response) {
            console.log('No GA4 response');
            console.groupEnd();
            return [];
        }
        
        // Handle error responses from your API
        if (ga4Response.error) {
            console.error('GA4 error:', ga4Response.error);
            console.groupEnd();
            return [];
        }
        
        // Tu API devuelve directamente la estructura GA4
        const rows = ga4Response.rows || [];
        const dimensionHeaders = ga4Response.dimensionHeaders || [];
        const metricHeaders = ga4Response.metricHeaders || [];
        
        console.log('Processing GA4 structure:', {
            kpiKey,
            dimensions: dimensionHeaders.map(h => h.name),
            metrics: metricHeaders.map(h => h.name),
            rowsCount: rows.length,
            firstRowSample: rows[0]
        });
        
        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            console.log('No rows to process');
            console.groupEnd();
            return [];
        }
        
        const result = rows.map((row: any, index: number) => {
            const dimensions = row.dimensionValues || [];
            const metrics = row.metricValues || [];
            
            console.log(`Processing row ${index}:`, {
                dimensions: dimensions.map(d => d.value),
                metrics: metrics.map(m => m.value)
            });
            
            const dataPoint: DataPoint = {
                value: 0,
                label: `Item ${index + 1}`
            };
            
            // Process dimensions
            dimensionHeaders.forEach((header: any, idx: number) => {
                if (idx >= dimensions.length) return;
                
                const dimensionName = header.name;
                const dimensionValue = dimensions[idx]?.value || '';
                
                console.log(`Dimension ${dimensionName}:`, dimensionValue);
                
                switch (dimensionName) {
                    case 'date':
                        // Convert GA4 date format (20250508) to standard format (2025-05-08)
                        if (dimensionValue.length === 8) {
                            const year = dimensionValue.substring(0, 4);
                            const month = dimensionValue.substring(4, 6);
                            const day = dimensionValue.substring(6, 8);
                            dataPoint.date = `${year}-${month}-${day}`;
                        } else {
                            dataPoint.date = dimensionValue;
                        }
                        break;
                    case 'searchTerm':
                        dataPoint.name = dimensionValue || 'Búsqueda vacía';
                        break;
                    case 'sessionSource':
                        dataPoint.name = dimensionValue;
                        break;
                    default:
                        dataPoint.name = dimensionValue;
                }
            });
            
            // Process metrics - LÓGICA ESPECÍFICA POR KPI
            let primaryValue = 0;
            
            if (metricHeaders && metrics.length > 0) {
                switch (kpiKey) {
                    case 'carrosAbandonados':
                        // Para carritos abandonados: 
                        // metrics[0] = addToCarts, metrics[1] = ecommercePurchases
                        const addToCarts = Number(metrics[0]?.value || 0);
                        const purchases = Number(metrics[1]?.value || 0);
                        const abandoned = addToCarts - purchases;
                        const abandonmentRate = addToCarts > 0 ? (abandoned / addToCarts) * 100 : 0;
                        
                        dataPoint.value = abandoned; // Número de carritos abandonados
                        dataPoint.impressions = addToCarts; // Total carritos
                        dataPoint.clicks = purchases; // Compras realizadas
                        dataPoint.ctr = abandonmentRate; // Tasa de abandono
                        dataPoint.abandoned = abandoned;
                        dataPoint.purchases = purchases;
                        dataPoint.abandonmentRate = abandonmentRate;
                        dataPoint.label = `${abandoned} abandonados (${abandonmentRate.toFixed(1)}%)`;
                        
                        console.log(`Carritos abandonados calculation:`, {
                            addToCarts,
                            purchases,
                            abandoned,
                            abandonmentRate
                        });
                        break;
                        
                    case 'tasaConversionWeb':
                        // metrics[0] = ecommercePurchases, metrics[1] = sessions
                        const conversions = Number(metrics[0]?.value || 0);
                        const sessions = Number(metrics[1]?.value || 0);
                        const conversionRate = sessions > 0 ? (conversions / sessions) * 100 : 0;
                        
                        dataPoint.value = conversionRate;
                        dataPoint.clicks = conversions;
                        dataPoint.sessions = sessions;
                        dataPoint.label = `${conversionRate.toFixed(2)}%`;
                        break;
                        
                    case 'palabrasBuscadas':
                        // metrics[0] = sessions, metrics[1] = ecommercePurchases
                        const searchSessions = Number(metrics[0]?.value || 0);
                        const searchPurchases = Number(metrics[1]?.value || 0);
                        
                        dataPoint.value = searchSessions; // Usar sesiones como valor principal
                        dataPoint.sessions = searchSessions;
                        dataPoint.clicks = searchPurchases;
                        dataPoint.label = `${searchSessions} sesiones`;
                        break;
                        
                    case 'traficoPorFuente':
                        // metrics[0] = sessions, metrics[1] = ecommercePurchases
                        const sourceSessions = Number(metrics[0]?.value || 0);
                        const sourcePurchases = Number(metrics[1]?.value || 0);
                        
                        dataPoint.value = sourceSessions; // Usar sesiones como valor principal
                        dataPoint.sessions = sourceSessions;
                        dataPoint.clicks = sourcePurchases;
                        dataPoint.label = `${sourceSessions} sesiones`;
                        break;
                        
                    case 'ventaDiariaDelMes':
                    case 'pedidosDiariosDelMes':
                        // metrics[0] = ecommercePurchases
                        primaryValue = Number(metrics[0]?.value || 0);
                        dataPoint.value = primaryValue;
                        dataPoint.label = `${primaryValue} ${kpiKey.includes('venta') ? 'compras' : 'pedidos'}`;
                        break;
                        
                    default:
                        // Para otros KPIs, usar el primer metric como valor principal
                        primaryValue = Number(metrics[0]?.value || 0);
                        dataPoint.value = primaryValue;
                        dataPoint.label = primaryValue.toLocaleString();
                        
                        // Mapear métricas adicionales
                        metricHeaders.forEach((header: any, idx: number) => {
                            const metricName = header.name;
                            const metricValue = Number(metrics[idx]?.value || 0);
                            
                            switch (metricName) {
                                case 'sessions':
                                    dataPoint.sessions = metricValue;
                                    break;
                                case 'ecommercePurchases':
                                    dataPoint.clicks = metricValue;
                                    break;
                                case 'addToCarts':
                                    dataPoint.impressions = metricValue;
                                    break;
                            }
                        });
                }
            }
            
            console.log(`Final dataPoint for row ${index}:`, dataPoint);
            return dataPoint;
        });
        
        // Filtrar solo puntos de datos válidos
        const validResult = result.filter(item => {
            const isValid = validateDataPoint(item);
            if (!isValid) {
                console.warn('Invalid dataPoint filtered out:', item);
            }
            return isValid;
        });
        
        console.log('formatGA4Data final result:', {
            totalRows: rows.length,
            processedRows: result.length,
            validRows: validResult.length,
            sampleData: validResult.slice(0, 2)
        });
        
        console.groupEnd();
        return validResult;
    }, [formatCurrency, validateDataPoint]);

    const convertToDataPoints = useCallback((rawData: any, kpiKey: string): DataPoint[] => {
        console.group(`🔍 convertToDataPoints for ${kpiKey}`);
        console.log('Raw data:', rawData);
        
        if (!rawData) {
            console.log('No raw data');
            console.groupEnd();
            return [];
        }
        
        // If already DataPoint array
        if (Array.isArray(rawData) && rawData.every(validateDataPoint)) {
            console.log('Already valid DataPoint array');
            console.groupEnd();
            return rawData;
        }
        
        // If array of objects, try to convert
        if (Array.isArray(rawData)) {
            const converted = rawData.map((item, index) => {
                if (validateDataPoint(item)) return item;
                
                // Try to extract value from different properties
                const value = item.value || item.total || item.count || item.amount || 0;
                const name = item.name || item.label || item.key || `Item ${index + 1}`;
                const date = item.date || item.fecha || item.timestamp;
                
                return {
                    value: Number(value) || 0,
                    name: String(name),
                    date: date ? String(date) : undefined,
                    label: String(value)
                };
            }).filter(validateDataPoint);
            
            console.log('Converted array:', converted.slice(0, 3));
            console.groupEnd();
            return converted;
        }
        
        // If single object, try to convert to single item array
        if (typeof rawData === 'object') {
            const value = rawData.value || rawData.total || rawData.count || 0;
            if (typeof value === 'number') {
                const result = [{
                    value: value,
                    name: rawData.name || rawData.label || 'Single Value',
                    label: String(value)
                }];
                console.log('Converted single object:', result);
                console.groupEnd();
                return result;
            }
        }
        
        console.warn('Could not convert data to DataPoints');
        console.groupEnd();
        return [];
    }, [validateDataPoint]);

    const detectAndProcessData = useCallback((kpiKey: string, rawData: any): UnifiedKPIData => {
        console.group(`🔍 detectAndProcessData for ${kpiKey}`);
        console.log('Raw input:', rawData);
        
        if (!rawData) {
            console.log('No data provided');
            console.groupEnd();
            return { type: 'unknown', data: [], error: 'No data available' };
        }
        
        // Handle error responses
        if (rawData.error) {
            console.log('Error in data:', rawData.error);
            console.groupEnd();
            return { type: 'unknown', data: [], error: rawData.error };
        }
        
        // Detect data type and process accordingly
        let processedData: DataPoint[] = [];
        let dataType: UnifiedKPIData['type'] = 'unknown';
        
        // Check if it's GA4 data
        if (rawData.reports || rawData.dimensionHeaders || rawData.metricHeaders) {
            dataType = 'ga4';
            processedData = formatGA4Data(kpiKey, rawData);
        }
        // Check if it's already processed SQL data (array of DataPoints)
        else if (Array.isArray(rawData) && rawData.every(validateDataPoint)) {
            dataType = 'sql';
            processedData = rawData;
        }
        // Try generic conversion
        else {
            dataType = 'unknown';
            processedData = convertToDataPoints(rawData, kpiKey);
        }
        
        const result: UnifiedKPIData = {
            type: dataType,
            data: processedData,
            rawData: rawData,
            error: processedData.length === 0 ? 'No valid data points found' : undefined
        };
        
        console.log('Detection result:', {
            type: result.type,
            dataLength: result.data.length,
            hasError: !!result.error
        });
        console.groupEnd();
        
        return result;
    }, [convertToDataPoints, formatGA4Data, validateDataPoint]);

    const applySorting = useCallback((dataArr: DataPoint[], kpiKey: string, sortOption: string): DataPoint[] => {
        console.group(`🔍 applySorting for ${kpiKey}`);
        console.log('Input data:', dataArr);
        console.log('Sort option:', sortOption);
        
        if (!Array.isArray(dataArr)) {
            console.error('applySorting: data is not array:', typeof dataArr);
            console.groupEnd();
            return [];
        }
        
        const validData = dataArr.filter(validateDataPoint);
        if (validData.length !== dataArr.length) {
            console.warn(`applySorting: Filtered ${dataArr.length - validData.length} invalid items from ${kpiKey}`);
        }
        
        if (validData.length === 0) {
            console.log('No valid data to sort');
            console.groupEnd();
            return [];
        }
        
        const sortedData = [...validData];
        
        console.log('Sorting by:', sortOption);
        
        switch (sortOption) {
            case 'date':
                sortedData.sort((a, b) => {
                    if (a.date && b.date) {
                        const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                        console.log(`Date comparison: ${a.date} vs ${b.date} = ${dateComparison}`);
                        return dateComparison;
                    }
                    return 0;
                });
                break;
                
            case 'value':
                sortedData.sort((a, b) => {
                    const valueComparison = b.value - a.value;
                    if (sortedData.length <= 5) { // Solo log para datasets pequeños
                        console.log(`Value comparison: ${b.value} vs ${a.value} = ${valueComparison}`);
                    }
                    return valueComparison;
                });
                break;
                
            case 'alphabetical':
                sortedData.sort((a, b) => {
                    const nameA = a.name || a.date || '';
                    const nameB = b.name || b.date || '';
                    const alphaComparison = nameA.localeCompare(nameB);
                    if (sortedData.length <= 5) { // Solo log para datasets pequeños
                        console.log(`Alpha comparison: "${nameA}" vs "${nameB}" = ${alphaComparison}`);
                    }
                    return alphaComparison;
                });
                break;
                
            default:
                console.log('No sorting applied (unknown sort option)');
        }
        
        console.log('Sorted result:', {
            originalCount: dataArr.length,
            validCount: validData.length,
            sortedCount: sortedData.length,
            sortOption,
            firstItem: sortedData[0],
            lastItem: sortedData[sortedData.length - 1]
        });
        
        // Log específico para carritos abandonados
        if (kpiKey === 'carrosAbandonados') {
            console.log('🛒 Carritos Abandonados sorted data:');
            sortedData.forEach((item, index) => {
                console.log(`🛒 Sorted item ${index}:`, {
                    date: item.date,
                    value: item.value,
                    label: item.label,
                    hasValidValue: typeof item.value === 'number' && !isNaN(item.value)
                });
            });
        }
        
        console.groupEnd();
        return sortedData;
    }, [validateDataPoint]);

    // Enhanced GA4 data fetching
    const fetchGA4Data = useCallback(async (startDate: string, endDate: string) => {
        const cacheKey = `ga4-${startDate}-${endDate}`;
        
        clearExpiredCache();
        
        const cached = cacheRef.current[cacheKey];
        if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
            console.log('Using cached GA4 data for:', cacheKey);
            return cached.data;
        }
        
        try {
                console.log('Fetching GA4 data:', { startDate, endDate });
                
                const response = await fetch(
                    `/api/analitica/ga4-data?startDate=${startDate}&endDate=${endDate}`
                );
                
                if (!response.ok) {
                    throw new Error(`GA4 API Error: ${response.status} ${response.statusText}`);
                }
                
                const result = await response.json();
                console.log('🔍 GA4 Response received:', {
                    hasData: !!result.data,
                    dataKeys: result.data ? Object.keys(result.data) : [],
                    metadata: result.metadata
                });
                
                cacheRef.current[cacheKey] = {
                    data: result,
                    timestamp: Date.now(),
                    ttl: CACHE_TTL
                };
                
                return result;
            } catch (err: any) {
                console.error('GA4 fetch error:', err);
                throw err;
            }
        }, [clearExpiredCache]);

    // ---------------------------------------------------------
    // fetchSqlData → fetchSapData: obtiene pedidos SAP y cachea
    // ---------------------------------------------------------
    const fetchSqlData = useCallback(
        async (startDate: string, endDate: string) => {
            const cacheKey = `sap-${startDate}-${endDate}`;
            clearExpiredCache();
            const cached = cacheRef.current[cacheKey];
            if (cached && Date.now() - cached.timestamp < cached.ttl) {
                setPedidos(cached.data.pedidos || []);
                return cached.data;
            }
            try {
                setLoading(true);
                setError(null);

                const startISO = convertRelativeDateToISO(startDate);
                const endISO = convertRelativeDateToISO(endDate);

                const sapResponse = await fetchOrdersList({
                    startDate: startISO,
                    endDate: endISO,
                    perPage: 5000,
                    page: 1,
                });

                cacheRef.current[cacheKey] = {
                    data: { pedidos: sapResponse },
                    timestamp: Date.now(),
                    ttl: CACHE_TTL,
                };
                setPedidos(sapResponse);
                return { pedidos: sapResponse };
            } catch (err: any) {
                const msg = err.message || 'Error al obtener datos SAP';
                setError(msg);
                console.error('SAP fetch error:', err);
                return null;
            } finally {
                setLoading(false);
                abortControllerRef.current = null;
            }
        },
        [fetchOrdersList, convertRelativeDateToISO, clearExpiredCache]
    );

    // ---------------------------------------------------------
    // processSqlData → processSapData: transforma pedidos SAP a DataPoint[]
    // ---------------------------------------------------------
    const processSqlData = useCallback(
        (kpiKey: string, sqlData: any, fechaInicio?: string, fechaFin?: string): DataPoint[] => {
            if (!sqlData || !sqlData.pedidos) return [];
            const listaPedidos: Pedido[] = sqlData.pedidos;
            try {
                switch (kpiKey) {
                    case 'ticketPromedioDelMes': {
                        const ticketData = calcularTicketPromedioDiario(listaPedidos, fechaInicio, fechaFin);
                        return ticketData.map((item) => ({
                            date: item.fecha,
                            value: item.valor,
                            label: formatCurrency(item.valor),
                        }));
                    }
                    case 'ventaDiariaDelMes': {
                        const ventaData = calcularVentaDiaria(listaPedidos, fechaInicio, fechaFin);
                        return ventaData.map((item) => ({
                            date: item.fecha,
                            value: item.valor,
                            label: formatCurrency(item.valor),
                        }));
                    }
                    case 'pedidosDiariosDelMes': {
                        const pedidosData = calcularPedidosDiarios(listaPedidos, fechaInicio, fechaFin);
                        return pedidosData.map((item) => ({
                            date: item.fecha,
                            value: item.valor,
                            label: `${item.valor} pedidos`,
                        }));
                    }
                    case 'ventaAcumulada': {
                        const acumuladaData = calcularVentaAcumulada(listaPedidos, fechaInicio, fechaFin);
                        return acumuladaData.map((item) => ({
                            date: item.fecha,
                            value: item.valor,
                            label: formatCurrency(item.valor),
                        }));
                    }
                    case 'kpisDeProductos': {
                        const detalles: PedidoDetalle[] = listaPedidos.flatMap((pedido: any) =>
                            (pedido.items || []).map((det: any) => ({
                                sku: det.sku,
                                amount: det.amount,
                                quantity: det.quantity,
                            }))
                        );
                        const productosData = agruparDetallesPorSKU(detalles);
                        return productosData.slice(0, 20).map((item) => ({
                            name: item.sku,
                            value: item.total,
                            quantity: item.cantidad,
                            label: `${formatCurrency(item.total)} (${item.cantidad} unidades)`,
                        }));
                    }
                    default:
                        return [];
                }
            } catch (err) {
                console.error(`processSapData error para ${kpiKey}:`, err);
                return [];
            }
        },
        [
            calcularTicketPromedioDiario,
            calcularVentaDiaria,
            calcularPedidosDiarios,
            calcularVentaAcumulada,
            agruparDetallesPorSKU,
            formatCurrency,
        ]
    );

    // ---------------------------------------------------------
    // fetchData: decide entre SAP (antes SQL) o GA4, con caso especial para 'carrosAbandonados'
    // ---------------------------------------------------------
    const fetchData = useCallback(
        async (activeKpi: string, dateRange: CustomDateRange) => {
            console.group(`🔍 fetchData para ${activeKpi}`);
            console.log('Rango:', dateRange);
            try {
                setLoading(true);
                setError(null);

                const sapKpis = [
                    'ticketPromedioDelMes',
                    'ventaDiariaDelMes',
                    'pedidosDiariosDelMes',
                    'ventaAcumulada',
                    'kpisDeProductos',
                ];

                let processedData: KPIResponse = {
                    data: {},
                    metadata: {
                        periodo: {
                            startDate: dateRange.startDate,
                            endDate: dateRange.endDate,
                        },
                        kpisExitosos: 0,
                    },
                };

                if (sapKpis.includes(activeKpi)) {
                    // ————————————————
                    // Caso SAP
                    // ————————————————
                    const sapResult = await fetchSqlData(dateRange.startDate, dateRange.endDate);
                    if (sapResult) {
                        const inicioISO = convertRelativeDateToISO(dateRange.startDate);
                        const finISO = convertRelativeDateToISO(dateRange.endDate);
                        const kpiData = processSqlData(activeKpi, sapResult, inicioISO, finISO);
                        processedData.data[activeKpi] = kpiData;
                        processedData.metadata.kpisExitosos = kpiData.length > 0 ? 1 : 0;
                    } else {
                        processedData.data[activeKpi] = [];
                    }
                } else {
                    // ————————————————
                    // Caso GA4
                    // ————————————————
                    try {
                        const ga4Data = await fetchGA4Data(dateRange.startDate, dateRange.endDate);
                        if (ga4Data && ga4Data.data) {
                            // Copy all GA4 data
                            processedData = ga4Data;
                            processedData.metadata.kpisExitosos = Object.keys(ga4Data.data).length;
                        } else {
                            processedData.data[activeKpi] = [];
                        }
                    } catch (ga4Error: any) {
                        console.error('GA4 fetch failed:', ga4Error);
                        processedData.data[activeKpi] = { error: ga4Error.message };
                    }
                }

                console.log('Final processed data:', {
                    kpiKey: activeKpi,
                    hasData: !!processedData.data[activeKpi],
                    dataType: typeof processedData.data[activeKpi],
                    dataLength: Array.isArray(processedData.data[activeKpi]) ? processedData.data[activeKpi].length : 'N/A'
                });

                setData(processedData);

            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    const errorMessage = err.message || "Failed to fetch analytics data";
                    setError(errorMessage);
                    console.error("Error fetching data:", err);
                }
            } finally {
                setLoading(false);
                console.groupEnd();
            }
        },
        [fetchSqlData, fetchGA4Data, processSqlData, convertRelativeDateToISO]
    );

    // ---------------------------------------------------------
    // Enhanced KPI data getter with better error handling and logging
    // ---------------------------------------------------------
    const getKpiData = useCallback((kpiKey: string): DataPoint[] => {
        console.group(`🔍 getKpiData for ${kpiKey}`);
        
        if (!data || !data.data) {
            console.log('No data available in state');
            console.groupEnd();
            return [];
        }
        
        const rawKpiData = data.data[kpiKey];
        console.log('Raw KPI data:', rawKpiData);
        console.log('Raw KPI data type:', typeof rawKpiData);
        console.log('Is array?', Array.isArray(rawKpiData));
        
        if (!rawKpiData) {
            console.log('No data for this KPI');
            console.groupEnd();
            return [];
        }
        
        // Handle error responses
        if (typeof rawKpiData === 'object' && rawKpiData.error) {
            console.error(`KPI ${kpiKey} has error:`, rawKpiData.error);
            console.groupEnd();
            return [];
        }
        
        // Lista de KPIs que usan datos SAP
        const sapKpis = [
            "ticketPromedioDelMes", 
            "ventaDiariaDelMes", 
            "pedidosDiariosDelMes", 
            "ventaAcumulada", 
            "kpisDeProductos"
        ];
        
        let processedData: DataPoint[] = [];
        
        if (sapKpis.includes(kpiKey)) {
            // Para KPIs SAP: los datos ya deberían estar procesados como DataPoint[]
            console.log('Processing as SAP KPI');
            if (Array.isArray(rawKpiData)) {
                processedData = rawKpiData.filter(validateDataPoint);
                console.log('SAP data validated:', processedData.length, 'valid items');
            } else {
                console.warn('SAP KPI data is not an array:', typeof rawKpiData);
            }
        } else {
            // Para KPIs GA4: procesar la estructura GA4
            console.log('Processing as GA4 KPI');
            
            // Verificar si tiene la estructura GA4 esperada
            if (rawKpiData.dimensionHeaders || rawKpiData.metricHeaders || rawKpiData.rows) {
                console.log('GA4 structure detected:', {
                    hasDimensions: !!rawKpiData.dimensionHeaders,
                    hasMetrics: !!rawKpiData.metricHeaders,
                    hasRows: !!rawKpiData.rows,
                    rowsCount: rawKpiData.rows?.length || 0
                });
                
                try {
                    processedData = formatGA4Data(kpiKey, rawKpiData);
                    console.log('GA4 data processed:', processedData.length, 'items');
                    
                    // Log específico para carritos abandonados
                    if (kpiKey === 'carrosAbandonados') {
                        console.log('🛒 Carritos Abandonados processed data:', processedData);
                        processedData.forEach((item, index) => {
                            console.log(`🛒 Item ${index}:`, {
                                date: item.date,
                                value: item.value,
                                label: item.label,
                                impressions: item.impressions,
                                clicks: item.clicks,
                                ctr: item.ctr
                            });
                        });
                    }
                    
                } catch (err) {
                    console.error('Error processing GA4 data:', err);
                    processedData = [];
                }
            } else {
                console.warn('GA4 KPI does not have expected structure');
                // Intentar conversión genérica
                processedData = convertToDataPoints(rawKpiData, kpiKey);
            }
        }
        
        // Validación final
        const validData = processedData.filter(validateDataPoint);
        const invalidCount = processedData.length - validData.length;
        
        if (invalidCount > 0) {
            console.warn(`Filtered out ${invalidCount} invalid data points`);
        }
        
        console.log('Final getKpiData result:', {
            kpiKey,
            rawDataType: typeof rawKpiData,
            processedCount: processedData.length,
            validCount: validData.length,
            sampleData: validData.slice(0, 2)
        });
        
        console.groupEnd();
        return validData;
    }, [data, validateDataPoint, formatGA4Data, convertToDataPoints]);

    // ---------------------------------------------------------
    // Enhanced summary function with better error handling
    // ---------------------------------------------------------
    const getSummary = useCallback((kpiKey: string) => {
        console.log(`🔍 getSummary for ${kpiKey}`);
        
        try {
            const kpiData = getKpiData(kpiKey);
            
            if (!kpiData || !Array.isArray(kpiData) || kpiData.length === 0) {
                return {
                    title: 'Sin datos',
                    value: '0',
                    subValue: 'No hay información disponible',
                    status: 'warning' as const
                };
            }
            
            const validData = kpiData.filter(validateDataPoint);
            if (validData.length === 0) {
                return {
                    title: 'Datos inválidos',
                    value: '0',
                    subValue: 'Los datos no tienen el formato correcto',
                    status: 'error' as const
                };
            }
            
            const total = validData.reduce((sum, d) => sum + d.value, 0);
            const avg = total / validData.length;
            
            const formatValue = (value: number, kpiKey: string): string => {
                if (isNaN(value) || !isFinite(value)) return '0';
                
                if (kpiKey.includes('venta') || kpiKey.includes('ticket')) {
                    return formatCurrency(value);
                }
                if (kpiKey.includes('pedidos')) {
                    return `${Math.round(value)} pedidos`;
                }
                if (kpiKey.includes('tasa') || kpiKey.includes('conversion')) {
                    return `${value.toFixed(1)}%`;
                }
                return value.toLocaleString();
            };
            
            const kpiLabel = kpiKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            
            return {
                title: kpiLabel,
                value: formatValue(total, kpiKey),
                subValue: `Promedio: ${formatValue(avg, kpiKey)} | ${validData.length} puntos`,
                status: 'success' as const
            };
            
        } catch (err) {
            console.error(`getSummary error for ${kpiKey}:`, err);
            return {
                title: 'Error',
                value: '0',
                subValue: 'Error al procesar datos',
                status: 'error' as const
            };
        }
    }, [getKpiData, validateDataPoint, formatCurrency]);

    // ---------------------------------------------------------
    // Enhanced format chart data function
    // ---------------------------------------------------------
    const formatChartData = useCallback((kpiKey: string, data: KPIResponse): DataPoint[] => {
        console.log(`🔍 formatChartData for ${kpiKey}`);
        
        if (!data || !data.data || !data.data[kpiKey]) {
            console.log('formatChartData: No data available');
            return [];
        }
        
        return getKpiData(kpiKey);
    }, [getKpiData]);

    // ---------------------------------------------------------
    // Refresh function
    // ---------------------------------------------------------
    const refreshData = useCallback((forceToday = false) => {
        console.log('🔄 Refreshing data, forceToday:', forceToday);
        
        // Clear all caches
        cacheRef.current = {};
        setPedidos([]);
        
        if (forceToday) {
            // Force refresh with today's data will be handled by component
            console.log('Force refresh requested');
        }
    }, []);

    // ---------------------------------------------------------
    // Cleanup on unmount
    // ---------------------------------------------------------
    // useEffect(() => {
    //     return () => {
    //         if (abortControllerRef.current) {
    //             abortControllerRef.current.abort();
    //         }
    //     };
    // }, []);

    // ---------------------------------------------------------
    // Enhanced logging for debug
    // ---------------------------------------------------------
    // useEffect(() => {
    //     if (data) {
    //         console.log('🔍 Hook state updated:', {
    //             hasData: !!data,
    //             dataKeys: data.data ? Object.keys(data.data) : [],
    //             metadata: data.metadata,
    //             loading,
    //             error
    //         });
    //     }
    // }, [data, loading, error]);

    return {
        // Data state
        data,
        loading,
        error,
        pedidos,
        
        // Core functions
        fetchData,
        refreshData,
        clearSqlCache,
        getKpiData,
        getSummary,
        
        // Data processing
        applySorting,
        formatChartData,
        formatGA4Data,
        detectAndProcessData,
        
        // Utilities
        convertRelativeDateToISO,
        formatCurrency,
        
        // Validation
        validateDataPoint,
        
        // Enhanced debugging
        _debug: {
            cache: cacheRef.current,
            rawData: data?.data,
            processedDataSample: data?.data ? Object.keys(data.data).reduce((acc, key) => {
                acc[key] = {
                    type: typeof data.data[key],
                    isArray: Array.isArray(data.data[key]),
                    length: Array.isArray(data.data[key]) ? data.data[key].length : 'N/A'
                };
                return acc;
            }, {} as Record<string, any>) : null
        }
    };
};