import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Types
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

// SQL Data Types
interface Pedido {
    ID: number | string;
    FechaPedido?: string;
    Fecha?: string;
    fecha?: string;
    date?: string;
    Total?: number;
    total?: number;
    Monto?: number;
    monto?: number;
    valor?: number;
    Value?: number;
    Ecommerce?: string;
    CodigoExterno?: string;
    CodigoInterno?: string | null;
    Estado?: string;
    detalles?: PedidoDetalle[];
    items?: PedidoDetalle[];
    productos?: PedidoDetalle[];
    [key: string]: any;
}

interface PedidoDetalle {
    ID?: number | string;
    IDPedido?: number | string;
    SKU?: string;
    sku?: string;
    codigo?: string;
    Codigo?: string;
    ProductId?: string;
    Cantidad?: number;
    cantidad?: number;
    qty?: number;
    quantity?: number;
    PrecioUnitario?: number;
    precio?: number;
    Precio?: number;
    SubTotal?: number;
    subtotal?: number;
    Descuento?: number;
    Total?: number;
    total?: number;
    [key: string]: any;
}

// Enhanced data type detection
interface UnifiedKPIData {
    type: 'sql' | 'ga4' | 'ads' | 'unknown';
    data: DataPoint[];
    metadata?: any;
    error?: string;
    rawData?: any;
}

const extraerFechaNormalizada = (pedido: any): string | null => {
    // Priorizar FechaPedidoLocal que ya tiene la corrección de zona horaria
    const fechaPedido = pedido.FechaPedidoLocal || pedido.FechaPedido || pedido.Fecha || pedido.fecha || pedido.date;
    
    if (!fechaPedido) {
        return null;
    }
    
    try {
        // Si ya es una fecha en formato YYYY-MM-DD, usarla directamente
        if (typeof fechaPedido === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaPedido)) {
            return fechaPedido;
        }
        
        // Si es una fecha ISO, extraer solo la parte de fecha
        if (typeof fechaPedido === 'string' && fechaPedido.includes('T')) {
            const fechaISO = fechaPedido.split('T')[0];
            
            // VERIFICAR que la fecha extraída sea válida
            const testDate = new Date(fechaISO + 'T12:00:00.000Z');
            if (isNaN(testDate.getTime())) {
                console.warn('Fecha ISO inválida extraída:', fechaISO);
                return null;
            }
            
            return fechaISO;
        }
        
        // Si es un objeto Date o string de fecha, convertir con cuidado de zona horaria
        const fechaObj = new Date(fechaPedido);
        if (isNaN(fechaObj.getTime())) {
            return null;
        }
        
        // IMPORTANTE: Usar fecha local en vez de UTC para evitar problemas de zona horaria
        const year = fechaObj.getFullYear();
        const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const day = String(fechaObj.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
        
    } catch (error) {
        console.warn('Error procesando fecha:', fechaPedido, error);
        return null;
    }
};
// Función auxiliar para validar que una fecha esté en un rango
const fechaEstaEnRango = (fecha: string, fechaInicio?: string, fechaFin?: string): boolean => {
    if (!fechaInicio && !fechaFin) return true;
    
    // Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        console.warn('Formato de fecha inválido para validación:', fecha);
        return false;
    }
    
    // Comparación de strings de fecha (más confiable que Date objects para este caso)
    let enRango = true;
    
    if (fechaInicio) {
        enRango = enRango && (fecha >= fechaInicio);
    }
    
    if (fechaFin) {
        enRango = enRango && (fecha <= fechaFin);
    }
    
    return enRango;
};


// SQL Processing Functions
// REEMPLAZA estas funciones en tu hook useAnalyticsData:

// Función para calcular el total de un pedido sumando sus detalles
// Función para calcular el total de un pedido sumando sus detalles
const calcularTotalPedido = (pedido: any): number => {
    if (!pedido.detalles || !Array.isArray(pedido.detalles)) {
        return 0;
    }
    
    return pedido.detalles.reduce((total: number, detalle: any) => {
        const detalleTotal = detalle.Total ?? detalle.total ?? detalle.SubTotal ?? detalle.subtotal ?? 0;
        return total + (Number(detalleTotal) || 0);
    }, 0);
};

// FUNCIÓN CORREGIDA: calcularVentaDiaria
const calcularVentaDiaria = (pedidos: Pedido[], fechaInicio?: string, fechaFin?: string): Array<{fecha: string, valor: number}> => {
    console.log('🔍 calcularVentaDiaria - Input:', {
        pedidosCount: pedidos?.length,
        fechaInicio,
        fechaFin,
        samplePedidos: pedidos?.slice(0, 3).map(p => ({
            ID: p.ID,
            FechaPedido: p.FechaPedido,
            FechaPedidoLocal: (p as any).FechaPedidoLocal,
            detallesCount: p.detalles?.length || 0
        }))
    });
    
    if (!pedidos || !Array.isArray(pedidos)) {
        console.warn('No pedidos data available');
        return [];
    }

    const ventaPorFecha: Record<string, number> = {};
    const pedidosPorFecha: Record<string, number> = {}; // Para debug
    const pedidosRechazados: Record<string, any[]> = {}; // Para debug
    let processedCount = 0;
    let skippedCount = 0;
    let fechasEncontradas = new Set<string>();
    let fechasFueraDeRango = new Set<string>();
    
    pedidos.forEach((pedido, index) => {
        const fecha = extraerFechaNormalizada(pedido);
        
        if (!fecha) {
            skippedCount++;
            console.warn(`Pedido ${pedido.ID} sin fecha válida`);
            return;
        }
        
        fechasEncontradas.add(fecha);
        
        // VALIDACIÓN CRÍTICA: Verificar que la fecha esté en el rango esperado
        const estaEnRango = fechaEstaEnRango(fecha, fechaInicio, fechaFin);
        
        if (!estaEnRango) {
            fechasFueraDeRango.add(fecha);
            
            // Guardar pedidos rechazados para debug
            if (!pedidosRechazados[fecha]) {
                pedidosRechazados[fecha] = [];
            }
            pedidosRechazados[fecha].push({
                ID: pedido.ID,
                FechaPedido: pedido.FechaPedido,
                FechaPedidoLocal: (pedido as any).FechaPedidoLocal,
                fechaExtraida: fecha
            });
            
            return;
        }
        
        // Calcular el total sumando los detalles
        const totalPedido = calcularTotalPedido(pedido);
        
        if (totalPedido <= 0) {
            skippedCount++;
            console.warn(`Pedido ${pedido.ID} sin total válido:`, {
                totalCalculado: totalPedido,
                detallesCount: pedido.detalles?.length || 0
            });
            return;
        }
        
        // Inicializar contadores si no existen
        if (!ventaPorFecha[fecha]) {
            ventaPorFecha[fecha] = 0;
            pedidosPorFecha[fecha] = 0;
        }
        
        ventaPorFecha[fecha] += totalPedido;
        pedidosPorFecha[fecha]++;
        processedCount++;
        
        // Log detallado para primeros pedidos
        if (index < 5) {
            console.log(`🔍 Pedido ${pedido.ID} procesado:`, {
                fecha,
                totalCalculado: totalPedido,
                detallesCount: pedido.detalles?.length || 0,
                fechaOriginal: pedido.FechaPedido,
                fechaLocal: (pedido as any).FechaPedidoLocal,
                estaEnRango
            });
        }
    });
    
    // LOG DETALLADO DE RESULTADOS Y PROBLEMAS
    console.log('🔍 calcularVentaDiaria - Processing summary:', {
        totalPedidos: pedidos.length,
        processedCount,
        skippedCount,
        uniqueDates: Object.keys(ventaPorFecha).length,
        fechasEncontradas: Array.from(fechasEncontradas).sort(),
        fechasFueraDeRango: Array.from(fechasFueraDeRango).sort(),
        pedidosPorFecha, // Debug: cuántos pedidos por fecha procesados
        rangoSolicitado: { fechaInicio, fechaFin }
    });
    
    // Log de pedidos rechazados si hay problemas
    if (fechasFueraDeRango.size > 0) {
        console.warn('🚨 Pedidos rechazados por fecha fuera de rango:');
        Array.from(fechasFueraDeRango).sort().forEach(fecha => {
            const pedidosEnFecha = pedidosRechazados[fecha] || [];
            console.warn(`📅 Fecha ${fecha} (${pedidosEnFecha.length} pedidos):`, pedidosEnFecha);
        });
    }
    
    const resultado = Object.entries(ventaPorFecha)
        .map(([fecha, valor]) => ({ fecha, valor }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha));
    
    console.log('🔍 calcularVentaDiaria - Final result:', resultado);
    return resultado;
};

const calcularVentaAcumulada = (pedidos: Pedido[], fechaInicio?: string, fechaFin?: string): Array<{fecha: string, valor: number}> => {
    const ventaDiaria = calcularVentaDiaria(pedidos, fechaInicio, fechaFin);
    let acumulado = 0;
    
    return ventaDiaria.map(item => {
        acumulado += item.valor;
        return {
            fecha: item.fecha,
            valor: acumulado
        };
    });
};

const calcularPedidosDiarios = (pedidos: Pedido[], fechaInicio?: string, fechaFin?: string): Array<{fecha: string, valor: number}> => {
    console.log('🔍 calcularPedidosDiarios - Input:', {
        pedidosCount: pedidos?.length,
        fechaInicio,
        fechaFin
    });
    
    if (!pedidos || !Array.isArray(pedidos)) return [];
    
    const pedidosPorFecha: Record<string, number> = {};
    const pedidosRechazados: Record<string, any[]> = {}; // Para debug
    let processedCount = 0;
    let skippedCount = 0;
    const fechasEncontradas = new Set<string>();
    const fechasFueraDeRango = new Set<string>();
    
    pedidos.forEach(pedido => {
        const fecha = extraerFechaNormalizada(pedido);
        
        if (!fecha) {
            skippedCount++;
            return;
        }
        
        fechasEncontradas.add(fecha);
        
        // VALIDACIÓN CRÍTICA: Verificar que la fecha esté en el rango esperado
        const estaEnRango = fechaEstaEnRango(fecha, fechaInicio, fechaFin);
        
        if (!estaEnRango) {
            fechasFueraDeRango.add(fecha);
            
            // Guardar pedidos rechazados para debug
            if (!pedidosRechazados[fecha]) {
                pedidosRechazados[fecha] = [];
            }
            pedidosRechazados[fecha].push({
                ID: pedido.ID,
                fecha: fecha,
                fechaOriginal: pedido.FechaPedido,
                fechaLocal: (pedido as any).FechaPedidoLocal
            });
            
            return;
        }
        
        if (!pedidosPorFecha[fecha]) {
            pedidosPorFecha[fecha] = 0;
        }
        pedidosPorFecha[fecha]++;
        processedCount++;
    });
    
    const resultado = Object.entries(pedidosPorFecha)
        .map(([fecha, valor]) => ({ fecha, valor }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha));
    
    console.log('🔍 calcularPedidosDiarios - Final result:', {
        processedCount,
        skippedCount,
        fechasEncontradas: Array.from(fechasEncontradas).sort(),
        fechasFueraDeRango: Array.from(fechasFueraDeRango).sort(),
        resultado,
        rangoSolicitado: { fechaInicio, fechaFin }
    });
    
    // Log de problemas si existen
    if (fechasFueraDeRango.size > 0) {
        console.warn('🚨 calcularPedidosDiarios - Pedidos rechazados por fecha:');
        Array.from(fechasFueraDeRango).sort().forEach(fecha => {
            const pedidosEnFecha = pedidosRechazados[fecha] || [];
            console.warn(`📅 ${fecha}: ${pedidosEnFecha.length} pedidos rechazados`);
        });
    }
    
    return resultado;
};

const calcularTicketPromedioDiario = (pedidos: Pedido[], fechaInicio?: string, fechaFin?: string): Array<{fecha: string, valor: number}> => {
    if (!pedidos || !Array.isArray(pedidos)) return [];
    
    const ventaDiaria = calcularVentaDiaria(pedidos, fechaInicio, fechaFin);
    const pedidosDiarios = calcularPedidosDiarios(pedidos, fechaInicio, fechaFin);
    
    const ticketPromedio: Array<{fecha: string, valor: number}> = [];
    
    ventaDiaria.forEach(venta => {
        const pedidosDia = pedidosDiarios.find(p => p.fecha === venta.fecha);
        if (pedidosDia && pedidosDia.valor > 0) {
            ticketPromedio.push({
                fecha: venta.fecha,
                valor: venta.valor / pedidosDia.valor
            });
        }
    });
    
    return ticketPromedio;
};
const agruparDetallesPorSKU = (detalles: PedidoDetalle[]): Array<{sku: string, cantidad: number, total: number}> => {
    if (!detalles || !Array.isArray(detalles)) return [];
    
    const agrupados: Record<string, {cantidad: number, total: number}> = {};
    
    detalles.forEach(detalle => {
        // En tu estructura, el SKU está directamente como "SKU"
        const sku = detalle.SKU || detalle.sku || detalle.codigo || detalle.Codigo;
        
        // Cantidad y Total están directamente en el detalle
        const cantidad = detalle.Cantidad ?? detalle.cantidad ?? 1;
        const total = detalle.Total ?? detalle.total ?? detalle.SubTotal ?? detalle.subtotal ?? 0;
        
        if (!sku) return;
        
        if (!agrupados[sku]) {
            agrupados[sku] = { cantidad: 0, total: 0 };
        }
        
        agrupados[sku].cantidad += Number(cantidad) || 0;
        agrupados[sku].total += Number(total) || 0;
    });
    
    return Object.entries(agrupados)
        .map(([sku, data]) => ({ sku, ...data }))
        .sort((a, b) => b.total - a.total);
};

// Date conversion functions
const convertRelativeDateToISO = (relativeDate: string): string => {
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
        case '2025-01-01':
            return '2025-01-01';
        case '2020-01-01':
            return '2020-01-01';
        default:
            return relativeDate;
    }
};

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

// Enhanced data validation
const validateDataPoint = (item: any): item is DataPoint => {
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
};

// Enhanced GA4 data formatting
// REEMPLAZA SOLO la función formatGA4Data en tu hook:

const formatGA4Data = (kpiKey: string, ga4Response: any): DataPoint[] => {
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
};

// Enhanced generic data conversion
const convertToDataPoints = (rawData: any, kpiKey: string): DataPoint[] => {
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
};

// Enhanced data detection and processing
const detectAndProcessData = (kpiKey: string, rawData: any): UnifiedKPIData => {
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
};

// REEMPLAZA la función applySorting en tu hook:

const applySorting = (data: DataPoint[], kpiKey: string, sortOption: string): DataPoint[] => {
    console.group(`🔍 applySorting for ${kpiKey}`);
    console.log('Input data:', data);
    console.log('Sort option:', sortOption);
    
    if (!Array.isArray(data)) {
        console.error('applySorting: data is not array:', typeof data);
        console.groupEnd();
        return [];
    }
    
    const validData = data.filter(validateDataPoint);
    if (validData.length !== data.length) {
        console.warn(`applySorting: Filtered ${data.length - validData.length} invalid items from ${kpiKey}`);
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
        originalCount: data.length,
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
};

// Main hook
export const useAnalyticsData = () => {
    const [data, setData] = useState<KPIResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    
    // SQL data states
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [sqlLoading, setSqlLoading] = useState(false);
    const [sqlError, setSqlError] = useState<string | null>(null);
    
    // Enhanced cache with timestamps and size limits
    const cacheRef = useRef<Record<string, { 
        data: any; 
        timestamp: number; 
        ttl: number;
    }>>({});
    const abortControllerRef = useRef<AbortController | null>(null);
    
    // Cache management
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    const MAX_CACHE_SIZE = 10;
    
    const clearExpiredCache = useCallback(() => {
        const now = Date.now();
        const cacheEntries = Object.entries(cacheRef.current);
        
        cacheEntries.forEach(([key, value]) => {
            if (now - value.timestamp > value.ttl) {
                delete cacheRef.current[key];
            }
        });
        
        const remainingEntries = Object.entries(cacheRef.current);
        if (remainingEntries.length > MAX_CACHE_SIZE) {
            remainingEntries
                .sort((a, b) => a[1].timestamp - b[1].timestamp)
                .slice(0, remainingEntries.length - MAX_CACHE_SIZE)
                .forEach(([key]) => {
                    delete cacheRef.current[key];
                });
        }
    }, []);
    
    const clearSqlCache = () => {
        cacheRef.current = {};
        setPedidos([]);
    };
    
    // Enhanced SQL data fetching
    const fetchSqlData = useCallback(async (startDate: string, endDate: string) => {
        const cacheKey = `sql-${startDate}-${endDate}`;
        
        clearExpiredCache();
        
        const cached = cacheRef.current[cacheKey];
        if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
            console.log('Using cached SQL data for:', cacheKey);
            setPedidos(cached.data.pedidos || []);
            return cached.data;
        }
        
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        try {
            setSqlLoading(true);
            setSqlError(null);
            
            const startDateISO = convertRelativeDateToISO(startDate);
            const endDateISO = convertRelativeDateToISO(endDate);
            
            console.log('Fetching SQL data:', { startDateISO, endDateISO });
            
            abortControllerRef.current = new AbortController();
            
            const response = await fetch(
                `/api/sqlConnectorModernDashboard?ecommerce=VENTUSCORP_VTEX&from=${startDateISO}&to=${endDateISO}`,
                { signal: abortControllerRef.current.signal }
            );
            
            if (!response.ok) {
                throw new Error(`SQL API Error: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('🔍 SQL Response received:', {
                hasPedidos: !!result.pedidos,
                pedidosCount: result.pedidos?.length || 0,
                firstPedido: result.pedidos?.[0]
            });
            
            cacheRef.current[cacheKey] = {
                data: result,
                timestamp: Date.now(),
                ttl: CACHE_TTL
            };
            
            setPedidos(result.pedidos || []);
            return result;
            
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log('SQL request was aborted');
                return null;
            }
            const errorMessage = err.message || 'Failed to fetch SQL data';
            setSqlError(errorMessage);
            console.error('SQL fetch error:', err);
            return null;
        } finally {
            setSqlLoading(false);
            abortControllerRef.current = null;
        }
    }, [clearExpiredCache]);
    
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
    
    // Enhanced SQL data processing
const processSqlData = useCallback((kpiKey: string, sqlData: any, fechaInicio?: string, fechaFin?: string): DataPoint[] => {
    if (!sqlData || !sqlData.pedidos) {
        console.log(`processSqlData: No pedidos data for ${kpiKey}`);
        return [];
    }
    
    const pedidos = sqlData.pedidos;
    console.log(`🔍 Processing SQL KPI: ${kpiKey} with ${pedidos.length} pedidos (rango: ${fechaInicio} - ${fechaFin})`);
    
    // Extraer todos los detalles de todos los pedidos
    const detalles = pedidos.flatMap((pedido: any) => {
        const pedidoDetalles = pedido.detalles || [];
        return pedidoDetalles.map((detalle: any) => ({
            ...detalle,
            IDPedido: pedido.ID || pedido.id
        }));
    });
    
    console.log(`🔍 Total detalles found: ${detalles.length}`);
    
    try {
        switch (kpiKey) {
            case "ticketPromedioDelMes":
                console.log('🔍 Processing ticketPromedioDelMes...');
                const ticketData = calcularTicketPromedioDiario(pedidos, fechaInicio, fechaFin);
                console.log('🔍 Ticket calculation result:', ticketData);
                
                return ticketData.map(item => ({
                    date: item.fecha,
                    value: item.valor,
                    label: formatCurrency(item.valor)
                }));
                
            case "ventaDiariaDelMes":
                console.log('🔍 Processing ventaDiariaDelMes...');
                const ventaData = calcularVentaDiaria(pedidos, fechaInicio, fechaFin);
                console.log('🔍 Venta calculation result:', ventaData);
                
                return ventaData.map(item => ({
                    date: item.fecha,
                    value: item.valor,
                    label: formatCurrency(item.valor)
                }));
                
            case "pedidosDiariosDelMes":
                console.log('🔍 Processing pedidosDiariosDelMes...');
                const pedidosData = calcularPedidosDiarios(pedidos, fechaInicio, fechaFin);
                console.log('🔍 Pedidos calculation result:', pedidosData);
                
                return pedidosData.map(item => ({
                    date: item.fecha,
                    value: item.valor,
                    label: `${item.valor} pedidos`
                }));
                
            case "ventaAcumulada":
                console.log('🔍 Processing ventaAcumulada...');
                const acumuladaData = calcularVentaAcumulada(pedidos, fechaInicio, fechaFin);
                console.log('🔍 Venta acumulada result:', acumuladaData);
                
                return acumuladaData.map(item => ({
                    date: item.fecha,
                    value: item.valor,
                    label: formatCurrency(item.valor)
                }));
                
            case "kpisDeProductos":
                console.log('🔍 Processing kpisDeProductos...');
                const productosData = agruparDetallesPorSKU(detalles);
                console.log('🔍 Productos calculation result:', productosData.slice(0, 5));
                
                return productosData
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 20)
                    .map(item => ({
                        name: item.sku,
                        value: item.total,
                        quantity: item.cantidad,
                        label: `${formatCurrency(item.total)} (${item.cantidad} unidades)`
                    }));
                    
            default:
                console.log(`processSqlData: Unknown SQL KPI: ${kpiKey}`);
                return [];
        }
    } catch (err) {
        console.error(`processSqlData error for ${kpiKey}:`, err);
        return [];
    }
}, []);
    
    // Enhanced main fetch function
    const fetchData = useCallback(async (activeKpi: string, dateRange: CustomDateRange) => {
    console.group(`🔍 fetchData for ${activeKpi}`);
    console.log('Date range:', dateRange);
    
    try {
        setLoading(true);
        setError(null);
        
        const sqlKpis = [
            "ticketPromedioDelMes", 
            "ventaDiariaDelMes", 
            "pedidosDiariosDelMes", 
            "ventaAcumulada", 
            "kpisDeProductos"
        ];
        
        let processedData: KPIResponse = {
            data: {},
            metadata: {
                periodo: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate
                },
                kpisExitosos: 0
            }
        };
        
        if (sqlKpis.includes(activeKpi)) {
            console.log('Processing as SQL KPI');
            const sqlData = await fetchSqlData(dateRange.startDate, dateRange.endDate);
            if (sqlData) {
                // PASAR LAS FECHAS PARA VALIDACIÓN
                const fechaInicio = convertRelativeDateToISO(dateRange.startDate);
                const fechaFin = convertRelativeDateToISO(dateRange.endDate);
                
                const kpiData = processSqlData(activeKpi, sqlData, fechaInicio, fechaFin);
                processedData.data[activeKpi] = kpiData;
                processedData.metadata.kpisExitosos = kpiData.length > 0 ? 1 : 0;
            } else {
                processedData.data[activeKpi] = [];
            }
        } else {
            console.log('Processing as GA4 KPI');
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
}, [fetchSqlData, fetchGA4Data, processSqlData]);
    
    // Enhanced refresh function
    const refreshData = useCallback((forceToday = false) => {
        console.log('🔄 Refreshing data, forceToday:', forceToday);
        setRefreshKey(prev => prev + 1);
        clearSqlCache();
        
        // Clear all caches
        cacheRef.current = {};
        
        if (forceToday) {
            // Force refresh with today's data will be handled by component
            console.log('Force refresh requested');
        }
    }, []);
    
    // Enhanced KPI data getter with better error handling and logging
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
        
        // Lista de KPIs que usan datos SQL
        const sqlKpis = [
            "ticketPromedioDelMes", 
            "ventaDiariaDelMes", 
            "pedidosDiariosDelMes", 
            "ventaAcumulada", 
            "kpisDeProductos"
        ];
        
        let processedData: DataPoint[] = [];
        
        if (sqlKpis.includes(kpiKey)) {
            // Para KPIs SQL: los datos ya deberían estar procesados como DataPoint[]
            console.log('Processing as SQL KPI');
            if (Array.isArray(rawKpiData)) {
                processedData = rawKpiData.filter(validateDataPoint);
                console.log('SQL data validated:', processedData.length, 'valid items');
            } else {
                console.warn('SQL KPI data is not an array:', typeof rawKpiData);
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
    }, [data]);
    
    // Enhanced summary function with better error handling
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
    }, [getKpiData]);
    
    // Enhanced format chart data function
    const formatChartData = useCallback((kpiKey: string, data: KPIResponse): DataPoint[] => {
        console.log(`🔍 formatChartData for ${kpiKey}`);
        
        if (!data || !data.data || !data.data[kpiKey]) {
            console.log('formatChartData: No data available');
            return [];
        }
        
        return getKpiData(kpiKey);
    }, [getKpiData]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);
    
    // Enhanced logging for debug
    useEffect(() => {
        if (data) {
            console.log('🔍 Hook state updated:', {
                hasData: !!data,
                dataKeys: data.data ? Object.keys(data.data) : [],
                metadata: data.metadata,
                loading,
                error,
                sqlLoading,
                sqlError
            });
        }
    }, [data, loading, error, sqlLoading, sqlError]);
    
    return {
        // Data state
        data,
        loading: loading || sqlLoading,
        error: error || sqlError,
        pedidos,
        
        // Loading states
        sqlLoading,
        sqlError,
        
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
        refreshKey,
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