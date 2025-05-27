/**
 * Servicios para procesar y adaptar datos provenientes de sqlConnectorModernDashboard.
 */

type Pedido = {
  ID: number | string;
  FechaPedido: string;
  Total?: number;
  detalles?: PedidoDetalle[];
  [key: string]: any;
};

type PedidoDetalle = {
  ID: number | string;
  IDPedido: number | string;
  SKU: string;
  Cantidad: number;
  PrecioUnitario: number;
  SubTotal: number;
  Descuento: number;
  Total: number;
  [key: string]: any;
};

/**
 * Calcula ventas acumuladas por fecha a partir de los pedidos.
 * @param pedidos Array de pedidos con FechaPedido y detalles.
 * @returns Array de objetos { fecha, valor } donde valor es el acumulado.
 */
export function calcularVentaAcumulada(pedidos: Pedido[]) {
  // Agrupa por fecha y suma el total por día
  const porFecha: Record<string, number> = {};
  pedidos.forEach(p => {
    if (!p.FechaPedido) return;
    const fecha = p.FechaPedido.split('T')[0];
    
    // Calcular total del pedido sumando sus detalles
    const totalPedido = (p.detalles || []).reduce((sum: number, detalle: any) => 
      sum + (detalle.Total || 0), 0
    );
    
    porFecha[fecha] = (porFecha[fecha] || 0) + totalPedido;
  });
  // Ordena por fecha y calcula el acumulado
  let acumulado = 0;
  return Object.entries(porFecha)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, valor]) => {
      acumulado += valor;
      return { fecha, valor: acumulado };
    });
}

/**
 * Calcula ventas diarias (no acumuladas) por fecha.
 * @param pedidos Array de pedidos con FechaPedido y detalles.
 * @returns Array de objetos { fecha, valor }.
 */
export function calcularVentaDiaria(pedidos: Pedido[]) {
  const porFecha: Record<string, number> = {};
  pedidos.forEach(p => {
    if (!p.FechaPedido) return;
    const fecha = p.FechaPedido.split('T')[0];
    
    // Calcular total del pedido sumando sus detalles
    const totalPedido = (p.detalles || []).reduce((sum: number, detalle: any) => 
      sum + (detalle.Total || 0), 0
    );
    
    porFecha[fecha] = (porFecha[fecha] || 0) + totalPedido;
  });
  return Object.entries(porFecha)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, valor]) => ({ fecha, valor }));
}

/**
 * Calcula pedidos diarios (cantidad de pedidos por fecha).
 * @param pedidos Array de pedidos con FechaPedido.
 * @returns Array de objetos { fecha, valor }.
 */
export function calcularPedidosDiarios(pedidos: Pedido[]) {
  const porFecha: Record<string, number> = {};
  pedidos.forEach(p => {
    if (!p.FechaPedido) return;
    const fecha = p.FechaPedido.split('T')[0];
    porFecha[fecha] = (porFecha[fecha] || 0) + 1;
  });
  return Object.entries(porFecha)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, valor]) => ({ fecha, valor }));
}

/**
 * Calcula ticket promedio diario.
 * @param pedidos Array de pedidos con FechaPedido y detalles.
 * @returns Array de objetos { fecha, valor }.
 */
export function calcularTicketPromedioDiario(pedidos: Pedido[]) {
  const porFecha: Record<string, { total: number; cantidad: number }> = {};
  pedidos.forEach(p => {
    if (!p.FechaPedido) return;
    const fecha = p.FechaPedido.split('T')[0];
    if (!porFecha[fecha]) porFecha[fecha] = { total: 0, cantidad: 0 };
    
    // Calcular total del pedido sumando sus detalles
    const totalPedido = (p.detalles || []).reduce((sum: number, detalle: any) => 
      sum + (detalle.Total || 0), 0
    );
    
    porFecha[fecha].total += totalPedido;
    porFecha[fecha].cantidad += 1;
  });
  return Object.entries(porFecha)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, { total, cantidad }]) => ({
      fecha,
      valor: cantidad > 0 ? total / cantidad : 0,
    }));
}

/**
 * Agrupa detalles de pedidos por SKU y suma cantidades y totales.
 * @param detalles Array de detalles de pedidos.
 * @returns Array de objetos { sku, cantidad, total }.
 */
export function agruparDetallesPorSKU(detalles: PedidoDetalle[]) {
  const porSKU: Record<string, { cantidad: number; total: number }> = {};
  detalles.forEach(d => {
    const sku = d.SKU;
    if (!sku) return;
    if (!porSKU[sku]) porSKU[sku] = { cantidad: 0, total: 0 };
    porSKU[sku].cantidad += d.Cantidad || 0;
    porSKU[sku].total += d.Total || 0;
  });
  return Object.entries(porSKU)
    .map(([sku, { cantidad, total }]) => ({
      sku,
      cantidad,
      total,
    }));
}