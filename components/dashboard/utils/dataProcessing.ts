// components/Dashboard/utils/dataProcessing.ts
import { formatDate, formatCurrency } from '../services/dataServices';
import { KpiSummary } from '../types';

// Format data for charts based on KPI type
export const formatChartData = (kpiKey: string, data: any) => {
  if (!data || !data.data || !data.data[kpiKey]) return [];

  const kpiData = data.data[kpiKey];

  // Handle error cases
  if (kpiData.error) {
    console.warn(`Error in KPI ${kpiKey}:`, kpiData.error);
    return [];
  }

  switch (kpiKey) {
    case "ventaDiariaDelMes":
      return (
        kpiData.rows?.map((row: any) => ({
          date: formatDate(row.dimensionValues[0].value),
          value: Number(row.metricValues[0].value || 0), // Asegurar que siempre hay un valor numérico
          rawDate: row.dimensionValues[0].value, // Keep raw date for sorting
        })) || []
      );

    case "pedidosDiariosDelMes":
      return (
        kpiData.rows?.map((row: any) => ({
          date: formatDate(row.dimensionValues[0].value),
          value: Number(row.metricValues[0].value || 0),
          rawDate: row.dimensionValues[0].value, // Keep raw date for sorting
        })) || []
      );

    case "traficoPorFuente":
      return (
        kpiData.rows?.map((row: any) => ({
          name: row.dimensionValues[0].value,
          value: Number(row.metricValues[0].value),
          compras: row.metricValues[1] ? Number(row.metricValues[1].value) : 0,
          tasaConversion: row.metricValues[1]
            ? (Number(row.metricValues[1].value) / Number(row.metricValues[0].value)) * 100
            : 0,
          percentage: kpiData.summary?.totalSessions
            ? ((Number(row.metricValues[0].value) / kpiData.summary.totalSessions) * 100).toFixed(1) + "%"
            : "0%",
        })) || []
      );

    case "ticketPromedioDelMes":
      // Si tenemos datos de VTEX, los usamos para complementar
      if (kpiData.vtexData && kpiData.vtexData.orders) {
        const vtexOrders = kpiData.vtexData.orders;
        // Combinar datos de GA4 con datos de VTEX
        return (
          kpiData.rows?.map((row: any) => ({
            date: formatDate(row.dimensionValues[0].value),
            revenue: Number(row.metricValues[0].value),
            purchases: Number(row.metricValues[1].value),
            average: Number(row.metricValues[0].value) / Number(row.metricValues[1].value),
            // Añadir datos de VTEX si están disponibles para esta fecha
            vtexRevenue: vtexOrders[row.dimensionValues[0].value]?.revenue || 0,
            vtexPurchases: vtexOrders[row.dimensionValues[0].value]?.purchases || 0,
            vtexAverage: vtexOrders[row.dimensionValues[0].value]?.average || 0,
            rawDate: row.dimensionValues[0].value, // Keep raw date for sorting
          })) || []
        );
      }
      // Si no hay datos de VTEX, seguimos con el comportamiento original
      return (
        kpiData.rows?.map((row: any) => ({
          date: formatDate(row.dimensionValues[0].value),
          revenue: Number(row.metricValues[0].value),
          purchases: Number(row.metricValues[1].value),
          average: Number(row.metricValues[0].value) / Number(row.metricValues[1].value),
          rawDate: row.dimensionValues[0].value, // Keep raw date for sorting
        })) || []
      );

    case "palabrasBuscadas":
      if (kpiData.summary?.términosMásUsados) {
        // Filter out empty search terms
        return kpiData.summary.términosMásUsados
          .filter((item: any) => item.término && item.término.trim() !== "")
          .map((item: any) => ({
            name: item.término,
            value: item.sesiones,
            compras: item.compras || 0,
            tasaConversion: item.tasaConversion || 0,
            percentage: item.porcentaje.toFixed(1) + "%",
          }));
      }
      return [];

    case "carrosAbandonados":
      if (kpiData.summary?.abandonmentByDay) {
        return kpiData.summary.abandonmentByDay.map((day: any) => ({
          date: formatDate(day.date),
          addToCarts: day.addToCarts,
          purchases: day.purchases,
          abandoned: day.abandoned,
          abandonmentRate: day.abandonmentRate,
          rawDate: day.date,
        }));
      }
      return (
        kpiData.rows?.map((row: any) => ({
          date: formatDate(row.dimensionValues[0].value),
          addToCarts: Number(row.metricValues[0].value),
          purchases: Number(row.metricValues[1].value),
          abandoned: Number(row.metricValues[0].value) - Number(row.metricValues[1].value),
          abandonmentRate: Number(row.metricValues[0].value)
            ? ((Number(row.metricValues[0].value) - Number(row.metricValues[1].value)) /
              Number(row.metricValues[0].value)) *
            100
            : 0,
          rawDate: row.dimensionValues[0].value, // Keep raw date for sorting
        })) || []
      );

    case "tasaConversionWeb":
      if (kpiData.summary) {
        return [
          {
            name: "Conversiones",
            value: kpiData.summary.purchases,
            fullMark: kpiData.summary.sessions * 0.1, // 10% conversion would be perfect
          },
          {
            name: "Sesiones",
            value: kpiData.summary.sessions,
            fullMark: kpiData.summary.sessions,
          },
          {
            name: "Tasa",
            value: kpiData.summary.tasaConversion,
            fullMark: 10, // 10% conversion would be perfect
          },
        ];
      }
      return [];

    case "audiencia":
      if (kpiData.summary) {
        return [
          {
            name: "Activos",
            value: kpiData.summary.activeUsers,
            fullMark: kpiData.summary.totalUsers,
          },
          {
            name: "Totales",
            value: kpiData.summary.totalUsers,
            fullMark: kpiData.summary.totalUsers,
          },
          {
            name: "Nuevos",
            value: kpiData.summary.newUsers,
            fullMark: kpiData.summary.totalUsers,
          },
          {
            name: "Recurrentes",
            value: kpiData.summary.returningUsers,
            fullMark: kpiData.summary.totalUsers,
          },
        ];
      }
      return [];

    case "comparativos":
      if (kpiData.summary) {
        return [
          {
            name: "Usuarios",
            actual: kpiData.summary.usuarios.actual,
            anterior: kpiData.summary.usuarios.anterior,
            variacion: kpiData.summary.usuarios.variacion,
          },
          {
            name: "Sesiones",
            actual: kpiData.summary.sesiones.actual,
            anterior: kpiData.summary.sesiones.anterior,
            variacion: kpiData.summary.sesiones.variacion,
          },
          {
            name: "Compras",
            actual: kpiData.summary.compras.actual,
            anterior: kpiData.summary.compras.anterior,
            variacion: kpiData.summary.compras.variacion,
          },
          {
            name: "Ingresos",
            actual: kpiData.summary.ingresos.actual,
            anterior: kpiData.summary.ingresos.anterior,
            variacion: kpiData.summary.ingresos.variacion,
          },
        ];
      }
      return [];

    case "funnelConversiones":
      if (kpiData.summary?.etapas) {
        return kpiData.summary.etapas;
      }
      return [];

    case "kpisDeProductos":
      // Complementar con datos de VTEX si están disponibles
      if (kpiData.vtexData && kpiData.vtexData.products) {
        return kpiData.vtexData.products.map((product: any) => ({
          name: product.productName,
          value: product.sales,
          stock: product.stock,
          price: product.price,
          category: product.category,
          brand: product.brand,
        }));
      }
      // Si no hay datos de VTEX, seguimos con el comportamiento original
      if (kpiData.summary?.topProducts) {
        return kpiData.summary.topProducts;
      }
      return [];

    case "kpisPorCategoria":
      if (kpiData.summary?.topCategories) {
        return kpiData.summary.topCategories;
      }
      return [];

    case "kpisPorMarca":
      if (kpiData.summary?.topBrands) {
        return kpiData.summary.topBrands;
      }
      return [];

    case "inversionMarketing":
      if (kpiData.summary?.campaigns) {
        return kpiData.summary.campaigns;
      }
      return [];

    case "campañas":
      if (kpiData.summary?.campaignPerformance) {
        return kpiData.summary.campaignPerformance;
      }
      return [];

    case "kpiContestabilidadCorus":
      if (kpiData.rows) {
        return kpiData.rows.map((row: any) => ({
          date: formatDate(row.dimensionValues[0].value),
          responses: Number(row.metricValues[0].value),
          rawDate: row.dimensionValues[0].value,
        }));
      }
      return [];

    case "clientesPerdidos":
      if (kpiData.summary) {
        return [
          {
            name: "Activos",
            value: kpiData.summary.totalUsers - kpiData.summary.clientesEnRiesgo - kpiData.summary.clientesPerdidos,
          },
          { name: "En Riesgo", value: kpiData.summary.clientesEnRiesgo },
          { name: "Perdidos", value: kpiData.summary.clientesPerdidos },
        ];
      }
      return [];

    case "tasaAperturaMails":
      if (kpiData.summary?.dailyData) {
        return kpiData.summary.dailyData;
      }
      return [];

    case "sugerenciasMejora":
      if (kpiData.summary?.sugerencias) {
        return kpiData.summary.sugerencias;
      }
      return [];

    case "vtexProductosStock":
      // Este KPI usa exclusivamente datos de VTEX
      if (kpiData.vtexData && kpiData.vtexData.products) {
        return kpiData.vtexData.products
          .filter((product: any) => product.stock !== undefined)
          .map((product: any) => ({
            name: product.productName,
            value: product.stock,
            price: product.price,
            category: product.category,
            brand: product.brand,
            sku: product.sku,
          }));
      }
      return [];

    default:
      return [];
  }
};

// Apply sorting to chart data
export const applySorting = (data: any[], kpiKey: string, sortOption: string): any[] => {
  if (!data || data.length === 0) return [];

  const dataCopy = [...data];

  switch (sortOption) {
    case "date":
      // Sort by date if available
      if (dataCopy[0]?.rawDate) {
        return dataCopy.sort((a, b) => {
          return String(a.rawDate).localeCompare(String(b.rawDate));
        });
      }
      return dataCopy;

    case "value":
      // Sort by value (descending)
      return dataCopy.sort((a, b) => {
        const valueA =
          a.value !== undefined
            ? a.value
            : a.average !== undefined
              ? a.average
              : a.actual !== undefined
                ? a.actual
                : 0;
        const valueB =
          b.value !== undefined
            ? b.value
            : b.average !== undefined
              ? b.average
              : b.actual !== undefined
                ? b.actual
                : 0;
        return valueB - valueA;
      });

    case "name":
      // Sort by name
      return dataCopy.sort((a, b) => {
        const nameA = a.name || a.date || "";
        const nameB = b.name || b.date || "";
        return String(nameA).localeCompare(String(nameB));
      });

    default:
      return dataCopy;
  }
};

// Get summary data for KPI
export const getSummary = (kpiKey: string, data: any): KpiSummary | null => {
  if (!data || !data.data || !data.data[kpiKey]) return null;

  const kpiData = data.data[kpiKey];

  // Handle error cases
  if (kpiData.error) {
    return {
      title: "Error",
      value: "No disponible",
      subValue: kpiData.error,
      status: "error",
    };
  }

  switch (kpiKey) {
    case "ventaDiariaDelMes":
      if (kpiData.summary) {
        return {
          title: "Ventas Totales",
          value: formatCurrency(kpiData.summary.totalRevenue),
          subValue: `Promedio: ${formatCurrency(kpiData.summary.promedioDiario)}/día`,
          status: "success",
        };
      }
      break;

    case "pedidosDiariosDelMes":
      if (kpiData.summary) {
        return {
          title: "Pedidos Totales",
          value: kpiData.summary.totalPurchases.toLocaleString(),
          subValue: `Promedio: ${(kpiData.summary.promedioDiario).toFixed(1)}/día`,
          status: "success",
        };
      }
      break;

    case "ticketPromedioDelMes":
      if (kpiData.summary) {
        return {
          title: "Ticket Promedio",
          value: formatCurrency(kpiData.summary.ticketPromedio),
          subValue: `Total: ${formatCurrency(kpiData.summary.totalRevenue)}`,
          status: "success",
        };
      }
      break;

    case "traficoPorFuente":
      if (kpiData.summary) {
        return {
          title: "Sesiones Totales",
          value: kpiData.summary.totalSessions.toLocaleString(),
          subValue: `Fuentes: ${kpiData.rows?.length || 0}`,
          status: "success",
        };
      }
      break;

    case "carrosAbandonados":
      if (kpiData.summary) {
        const abandonmentRate = kpiData.summary.abandonmentRate;
        return {
          title: "Tasa de Abandono",
          value: `${abandonmentRate.toFixed(1)}%`,
          subValue: `${kpiData.summary.abandonedCarts} carritos abandonados`,
          status: abandonmentRate > 75 ? "warning" : abandonmentRate > 90 ? "error" : "success",
        };
      }
      break;

    case "palabrasBuscadas":
      if (kpiData.summary) {
        return {
          title: "Búsquedas Totales",
          value: kpiData.summary.totalBúsquedas.toLocaleString(),
          subValue: `Términos únicos: ${kpiData.summary.términosMásUsados?.length || 0}`,
          status: "success",
        };
      }
      break;

    case "tasaConversionWeb":
      if (kpiData.summary) {
        const conversionRate = kpiData.summary.tasaConversion;
        return {
          title: "Tasa de Conversión",
          value: `${conversionRate.toFixed(2)}%`,
          subValue: `${kpiData.summary.purchases} conversiones / ${kpiData.summary.sessions} sesiones`,
          status: conversionRate < 1 ? "warning" : conversionRate > 5 ? "success" : "normal",
        };
      }
      break;

    case "audiencia":
      if (kpiData.summary) {
        const activityRate = kpiData.summary.activityRate;
        return {
          title: "Actividad de Usuarios",
          value: `${activityRate.toFixed(1)}%`,
          subValue: `${kpiData.summary.activeUsers} activos / ${kpiData.summary.totalUsers} totales`,
          status: activityRate < 50 ? "warning" : activityRate > 80 ? "success" : "normal",
        };
      }
      break;

    case "comparativos":
      if (kpiData.summary) {
        const ingresos = kpiData.summary.ingresos;
        return {
          title: "Comparativa de Ingresos",
          value: `${ingresos.variacion > 0 ? "+" : ""}${ingresos.variacion.toFixed(1)}%`,
          subValue: `${formatCurrency(ingresos.actual)} vs ${formatCurrency(ingresos.anterior)}`,
          status: ingresos.variacion > 0 ? "success" : ingresos.variacion < -10 ? "error" : "warning",
        };
      }
      break;

    case "funnelConversiones":
      if (kpiData.summary) {
        return {
          title: "Conversión Total",
          value: `${kpiData.summary.tasaConversionTotal.toFixed(2)}%`,
          subValue: `Abandono: ${kpiData.summary.abandonoCarrito.toFixed(1)}%`,
          status:
            kpiData.summary.tasaConversionTotal > 3
              ? "success"
              : kpiData.summary.tasaConversionTotal < 1
                ? "error"
                : "warning",
        };
      }
      break;

    case "kpisDeProductos":
      if (kpiData.summary) {
        return {
          title: "Productos",
          value: `${kpiData.summary.totalPurchases.toLocaleString()} compras`,
          subValue: `Ingresos: ${formatCurrency(kpiData.summary.totalRevenue)}`,
          status: "success",
        };
      }
      break;

    case "kpisPorCategoria":
      if (kpiData.summary) {
        return {
          title: "Categorías",
          value: `${kpiData.summary.conversionRate.toFixed(2)}% conversión`,
          subValue: `${kpiData.rows?.length || 0} categorías`,
          status: "success",
        };
      }
      break;

    case "kpisPorMarca":
      if (kpiData.summary) {
        return {
          title: "Marcas",
          value: `${kpiData.summary.conversionRate.toFixed(2)}% conversión`,
          subValue: `${kpiData.rows?.length || 0} marcas`,
          status: "success",
        };
      }
      break;

    case "inversionMarketing":
      if (kpiData.summary) {
        return {
          title: "Marketing",
          value: `${kpiData.summary.conversionRate.toFixed(2)}% conversión`,
          subValue: `${kpiData.summary.campaigns?.length || 0} campañas`,
          status: "success",
        };
      }
      break;

    case "campañas":
      if (kpiData.summary) {
        return {
          title: "Campañas",
          value: `${kpiData.summary.totalCampañas} campañas`,
          subValue: `${kpiData.summary.conversionRateGlobal.toFixed(2)}% conversión global`,
          status: "success",
        };
      }
      break;

    case "kpiContestabilidadCorus":
      if (kpiData.summary) {
        return {
          title: "Contestabilidad Corus",
          value: `${kpiData.summary.totalResponses.toLocaleString()} respuestas`,
          subValue: `Promedio: ${kpiData.summary.promedioDiario.toFixed(1)}/día`,
          status: "success",
        };
      }
      break;

    case "clientesPerdidos":
      if (kpiData.summary) {
        return {
          title: "Clientes en Riesgo",
          value: `${kpiData.summary.porcentajeEnRiesgo.toFixed(1)}%`,
          subValue: `${kpiData.summary.clientesEnRiesgo} clientes`,
          status:
            kpiData.summary.porcentajeEnRiesgo > 20
              ? "error"
              : kpiData.summary.porcentajeEnRiesgo > 10
                ? "warning"
                : "success",
        };
      }
      break;

    case "tasaAperturaMails":
      if (kpiData.summary) {
        return {
          title: "Apertura de Emails",
          value: `${kpiData.summary.avgOpenRate.toFixed(1)}%`,
          subValue: `Clics: ${kpiData.summary.avgClickRate.toFixed(1)}%`,
          status:
            kpiData.summary.avgOpenRate < 15 ? "error" : kpiData.summary.avgOpenRate < 25 ? "warning" : "success",
        };
      }
      break;

    case "sugerenciasMejora":
      if (kpiData.summary) {
        return {
          title: "Sugerencias",
          value: `${kpiData.summary.sugerencias?.length || 0} oportunidades`,
          subValue: "Recomendaciones de mejora",
          status: "success",
        };
      }
      break;

    case "vtexProductosStock":
      if (kpiData.vtexData && kpiData.vtexData.products) {
        const products = kpiData.vtexData.products;
        const lowStockCount = products.filter((p: any) => p.stock < 10).length;

        return {
          title: "Stock de Productos",
          value: `${products.length} productos`,
          subValue: `${lowStockCount} con stock bajo`,
          status: lowStockCount > products.length * 0.2 ? "warning" : "success",
        };
      }
      break;
  }

  return {
    title: "Datos",
    value: "No disponible",
    subValue: "",
    status: "normal",
  };
};

// Get KPI description
export const getKpiDescription = (kpiKey: string): string => {
  switch (kpiKey) {
    case "pedidosDiariosDelMes":
      return "Muestra el número total de pedidos realizados por día. Útil para identificar patrones de compra y días de mayor actividad comercial.";
    case "ventaDiariaDelMes":
      return "Visualiza los ingresos diarios generados. Permite identificar tendencias de ventas y días de mayor rendimiento económico.";
    case "ticketPromedioDelMes":
      return "Muestra el valor promedio de cada compra. Un indicador clave para entender el comportamiento de compra de los clientes.";
    case "traficoPorFuente":
      return "Analiza el origen del tráfico web, mostrando qué canales generan más visitas. Ayuda a optimizar estrategias de marketing y adquisición.";
    case "carrosAbandonados":
      return "Compara carritos añadidos vs. compras completadas. Una tasa alta de abandono puede indicar problemas en el proceso de checkout.";
    case "palabrasBuscadas":
      return "Términos más buscados por los usuarios en el sitio. Revela intereses de los usuarios y oportunidades para mejorar el catálogo.";
    case "tasaConversionWeb":
      return "Porcentaje de visitas que resultan en una compra. Métrica clave para evaluar la efectividad general del sitio.";
    case "audiencia":
      return "Análisis de usuarios activos vs. totales. Indica el nivel de engagement y retención de la audiencia del sitio.";
    case "comparativos":
      return "Compara métricas clave entre el período actual y el anterior. Permite identificar tendencias y evaluar el desempeño.";
    case "funnelConversiones":
      return "Visualiza el recorrido del usuario desde la vista de producto hasta la compra. Identifica puntos de abandono en el proceso.";
    case "kpisDeProductos":
      return "Analiza el rendimiento de productos individuales. Ayuda a identificar productos estrella y oportunidades de mejora.";
    case "kpisPorCategoria":
      return "Evalúa el desempeño de las categorías de productos. Útil para optimizar la estructura del catálogo.";
    case "kpisPorMarca":
      return "Muestra el rendimiento de las diferentes marcas. Permite identificar marcas con mejor conversión y potencial.";
    case "inversionMarketing":
      return "Analiza el retorno de inversión de las campañas de marketing. Ayuda a optimizar la asignación de presupuesto.";
    case "campañas":
      return "Evalúa el desempeño de campañas individuales. Permite identificar las estrategias más efectivas.";
    case "kpiContestabilidadCorus":
      return "Mide la efectividad del sistema de atención Corus. Evalúa la capacidad de respuesta a consultas de clientes.";
    case "clientesPerdidos":
      return "Identifica clientes en riesgo de abandono. Permite implementar estrategias de retención proactivas.";
    case "tasaAperturaMails":
      return "Analiza la efectividad de las campañas de email marketing. Mide apertura, clics y conversiones.";
    case "sugerenciasMejora":
      return "Recomendaciones basadas en el análisis de datos. Ofrece oportunidades concretas para mejorar el rendimiento.";
    default:
      return "Información no disponible para este KPI.";
  }
};