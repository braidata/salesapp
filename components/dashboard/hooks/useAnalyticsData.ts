// hooks/useAnalyticsData.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSapService } from '../services/sapService'; // Asegúrate de que la ruta es correcta

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
    if (typeof item !== 'object' || item === null) return false;
    if (!('value' in item) || typeof item.value !== 'number' || isNaN(item.value)) return false;
    return true;
  }, []);

  // ---------------------------------------------------------
  // Funciones de GA4 (se mantienen en gran parte idénticas)
  // ---------------------------------------------------------
  // Se reimplementa la lógica de GA4 para que se transforme similar a como se tenía antes.
const formatGA4Data = useCallback((kpiKey: string, ga4Response: any): DataPoint[] => {
  console.group(`🔍 formatGA4Data for ${kpiKey}`);
  if (!ga4Response) {
    console.groupEnd();
    return [];
  }
  if (ga4Response.error) {
    console.error('GA4 error:', ga4Response.error);
    console.groupEnd();
    return [];
  }
  const { rows, dimensionHeaders = [], metricHeaders = [] } = ga4Response;
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    console.groupEnd();
    return [];
  }
  const result = rows.map((row: any, index: number) => {
    const dimensions = row.dimensionValues || [];
    const metrics = row.metricValues || [];
    // Inicializamos el dataPoint con valores por defecto.
    const dataPoint: DataPoint = { value: 0, label: '' };
    
    // Procesamos las dimensiones: concatenamos las que no sean 'date'
    let combinedName = '';
    dimensionHeaders.forEach((header: any, idx: number) => {
      const headerName = header.name;
      const val = dimensions[idx]?.value || '';
      if (headerName === 'date') {
        if (val.length === 8) {
          const y = val.substring(0, 4);
          const m = val.substring(4, 6);
          const d = val.substring(6, 8);
          dataPoint.date = `${y}-${m}-${d}`;
        } else {
          dataPoint.date = val;
        }
      } else {
        // Concatenamos para formar el nombre
        combinedName += val + ' ';
      }
    });
    dataPoint.name = combinedName.trim() || `Item ${index + 1}`;

    // Procesamos las métricas: usamos la primera como principal
    if (metricHeaders.length > 0 && metrics.length > 0) {
      const primaryValue = Number(metrics[0].value || 0);
      dataPoint.value = primaryValue;
      // Si el KPI es monetario, formateamos con formatCurrency; de lo contrario, usamos toLocaleString()
      dataPoint.label = (kpiKey.includes('venta') || kpiKey.includes('ticket'))
        ? formatCurrency(primaryValue)
        : primaryValue.toLocaleString();
    }
    return dataPoint;
  });
  console.groupEnd();
  return result.filter(validateDataPoint);
}, [formatCurrency, validateDataPoint]);

const convertToDataPoints = useCallback((rawData: any, kpiKey: string): DataPoint[] => {
  console.group(`🔍 convertToDataPoints for ${kpiKey}`);
  if (!rawData) {
    console.groupEnd();
    return [];
  }
  // Si rawData es un arreglo y ya contiene DataPoints válidos, retornarlo tal cual.
  if (Array.isArray(rawData) && rawData.every(validateDataPoint)) {
    console.groupEnd();
    return rawData;
  }
  if (Array.isArray(rawData)) {
    const converted = rawData.map((item, idx) => {
      const value = item.value ?? item.total ?? item.count ?? item.amount ?? 0;
      const name = item.name ?? item.key ?? `Item ${idx + 1}`;
      const date = item.date ?? item.fecha ?? item.timestamp;
      const label = (kpiKey.includes('venta') || kpiKey.includes('ticket'))
        ? formatCurrency(Number(value))
        : String(value);
      return {
        value: Number(value),
        name: String(name),
        date: date ? String(date) : undefined,
        label,
      };
    }).filter(validateDataPoint);
    console.groupEnd();
    return converted;
  }
  if (typeof rawData === 'object') {
    const value = rawData.value ?? rawData.total ?? rawData.count ?? 0;
    const single: DataPoint = {
      value,
      name: rawData.name ?? rawData.label ?? 'Single Value',
      label: (kpiKey.includes('venta') || kpiKey.includes('ticket'))
        ? formatCurrency(value)
        : String(value),
    };
    console.groupEnd();
    return [single];
  }
  console.groupEnd();
  return [];
}, [validateDataPoint, formatCurrency]);

const detectAndProcessData = useCallback((kpiKey: string, rawData: any): UnifiedKPIData => {
  console.group(`🔍 detectAndProcessData for ${kpiKey}`);
  if (!rawData) {
    console.groupEnd();
    return { type: 'unknown', data: [], error: 'No data available' };
  }
  if (rawData.error) {
    console.groupEnd();
    return { type: 'unknown', data: [], error: rawData.error };
  }
  let processedData: DataPoint[] = [];
  let dataType: UnifiedKPIData['type'] = 'unknown';
  if (rawData.reports || rawData.dimensionHeaders || rawData.metricHeaders) {
    dataType = 'ga4';
    processedData = formatGA4Data(kpiKey, rawData);
  } else if (Array.isArray(rawData) && rawData.every(validateDataPoint)) {
    dataType = 'sql';
    processedData = rawData;
  } else {
    dataType = 'unknown';
    processedData = convertToDataPoints(rawData, kpiKey);
  }
  const result: UnifiedKPIData = {
    type: dataType,
    data: processedData,
    rawData,
    error: processedData.length === 0 ? 'No valid data points found' : undefined,
  };
  console.groupEnd();
  return result;
}, [convertToDataPoints, formatGA4Data, validateDataPoint]);


const applySorting = useCallback((data: DataPoint[], kpiKey: string, sortOption: string): DataPoint[] => {
    if (!Array.isArray(data)) return [];
    const sortedData = [...data];
    switch (sortOption) {
        case 'date':
            sortedData.sort((a, b) => {
                if (a.date && b.date) {
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                }
                return 0;
            });
            break;
        case 'value':
            sortedData.sort((a, b) => b.value - a.value);
            break;
        case 'alphabetical':
            sortedData.sort((a, b) => {
                const nameA = a.name || '';
                const nameB = b.name || '';
                return nameA.localeCompare(nameB);
            });
            break;
        default:
            break;
    }
    return sortedData;
}, []);

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

        // Aquí llamamos a tu servicio SAP (API) en lugar de SQL directo
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
      formatCurrency
    ]
  );

  // ---------------------------------------------------------
  // fetchData: decide entre SAP (antes SQL) o GA4
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

      // Estructura inicial de KPIResponse
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
        console.log('Procesando como KPI SAP');
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
        console.log('Procesando como KPI GA4');

        // 1) Llamo al endpoint Next.js que expone tus KPIs GA4
        const resp = await fetch(
          `/api/analitica/ga4-data?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&kpis=${activeKpi}`
        );
        const ga4Json = await resp.json();

        if (ga4Json && ga4Json.data && ga4Json.data[activeKpi]) {
          // 2) Extraigo el raw de GA4 para ese KPI
          const rawForThisKpi = ga4Json.data[activeKpi];

          // 3) Lo convierto a DataPoint[] usando la función que ya tienes
          const unified: UnifiedKPIData = detectAndProcessData(activeKpi, rawForThisKpi);

          // 4) Suelto solo el array en processedData.data
          processedData.data[activeKpi] = unified.data;
          processedData.metadata.kpisExitosos = unified.data.length > 0 ? 1 : 0;
        } else {
          processedData.data[activeKpi] = [];
        }
      }

      console.log('Resultado final procesado:', {
        kpi: activeKpi,
        tieneDatos: !!processedData.data[activeKpi],
        longitud: Array.isArray(processedData.data[activeKpi])
          ? processedData.data[activeKpi].length
          : 'N/A',
      });

      setData(processedData);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const msg = err.message || 'Error al obtener datos de analítica';
        setError(msg);
        console.error('Error en fetchData:', err);
      }
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  },
  [fetchSqlData, processSqlData, convertRelativeDateToISO, detectAndProcessData]
);

  // ---------------------------------------------------------
  // Funciones auxiliares: getKpiData, getSummary, formatChartData
  // ---------------------------------------------------------
  const getKpiData = useCallback(
    (kpiKey: string): DataPoint[] => {
      console.group(`🔍 getKpiData para ${kpiKey}`);
      if (!data || !data.data) {
        console.groupEnd();
        return [];
      }
      const raw = data.data[kpiKey];
      if (!raw) {
        console.groupEnd();
        return [];
      }
      const processedData = Array.isArray(raw)
        ? raw.filter(validateDataPoint)
        : [];
      console.groupEnd();
      return processedData;
    },
    [data, validateDataPoint]
  );

  const getSummary = useCallback(
    (kpiKey: string) => {
      console.log(`🔍 getSummary para ${kpiKey}`);
      try {
        const kpiData = getKpiData(kpiKey);
        if (!kpiData || kpiData.length === 0) {
          return {
            title: 'Sin datos',
            value: '0',
            subValue: 'No hay información disponible',
            status: 'warning' as const,
          };
        }
        const total = kpiData.reduce((sum, d) => sum + d.value, 0);
        const avg = total / kpiData.length;
        const formatValue = (val: number): string => {
          if (kpiKey.includes('venta') || kpiKey.includes('ticket')) {
            return formatCurrency(val);
          }
          if (kpiKey.includes('pedidos')) {
            return `${Math.round(val)} pedidos`;
          }
          return val.toLocaleString();
        };
        const label = kpiKey.replace(/([A-Z])/g, ' $1').replace(/^./, (str) =>
          str.toUpperCase()
        );
        return {
          title: label,
          value: formatValue(total),
          subValue: `Promedio: ${formatValue(avg)} | ${kpiData.length} puntos`,
          status: 'success' as const,
        };
      } catch {
        return {
          title: 'Error',
          value: '0',
          subValue: 'Error al procesar datos',
          status: 'error' as const,
        };
      }
    },
    [getKpiData, formatCurrency]
  );

  const formatChartData = useCallback(
    (kpiKey: string, allData: KPIResponse): DataPoint[] => {
      if (!allData || !allData.data || !allData.data[kpiKey]) return [];
      return getKpiData(kpiKey);
    },
    [getKpiData]
  );

  // ---------------------------------------------------------
  // Limpieza y debug
  // ---------------------------------------------------------
  // useEffect(() => {
  //   return () => {
  //     if (abortControllerRef.current) abortControllerRef.current.abort();
  //   };
  // }, []);

  // useEffect(() => {
  //   if (data) {
  //     console.log('🔍 Estado del hook actualizado:', {
  //       keys: data.data ? Object.keys(data.data) : [],
  //       metadata: data.metadata,
  //       loading,
  //       error,
  //     });
  //   }
  // }, [data, loading, error]);

  // refreshData simplemente re-invoca fetchData sin reiniciar la caché completa
  const refreshData = useCallback(() => {
    console.log('🔄 Refreshing data (sin limpiar caché completo)');
    // Si necesitas limpiar caché antes de reintentar:
    // clearSqlCache();
  }, [clearSqlCache]);

  return {
    data,
    loading,
    error,
    pedidos,
    fetchData,
    clearSqlCache,
    getKpiData,
    getSummary,
    formatChartData,
    applySorting,
    convertRelativeDateToISO,
    formatCurrency,
    validateDataPoint,
    refreshData,
    // Debug: estado de la caché y muestra parcial de data
    _debug: {
      cache: cacheRef.current,
      rawDataKeys: data?.data ? Object.keys(data.data) : [],
      sampleData: data?.data
        ? Object.entries(data.data).reduce((acc, [k, v]) => {
            acc[k] = Array.isArray(v) ? v.slice(0, 2) : v;
            return acc;
          }, {} as Record<string, any>)
        : null,
    },
  };
};
