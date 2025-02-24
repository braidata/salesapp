// pages/api/vtex-invoice.ts
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Realiza una llamada a la API de VTEX
 */
async function fetchVTEX(endpoint: string, method: string = 'GET', body?: any) {
  const VTEX_API_URL = `https://imegab2c.myvtex.com/api/oms/pvt/orders/${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-VTEX-API-AppKey': process.env.API_VTEX_KEY || '',
    'X-VTEX-API-AppToken': process.env.API_VTEX_TOKEN || '',
  };

  const options: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(VTEX_API_URL, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`VTEX API error: ${response.status} - ${errorText}`);
  }
  return response.json();
}

/**
 * Reintenta obtener el estado del pedido hasta que sea "invoiced"
 */
async function waitForInvoicedStatus(orderId: string, retries = 5, delay = 3000): Promise<string> {
  for (let i = 0; i < retries; i++) {
    const order = await fetchVTEX(orderId);
    const currentStatus = order.status;

    if (currentStatus === 'invoiced') {
      return currentStatus;
    }

    console.log(`Intento ${i + 1}/${retries}: Estado actual = ${currentStatus}, esperando actualización...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Si después de los reintentos no cambió, devolvemos el último estado conocido
  return (await fetchVTEX(orderId)).status;
}

/**
 * Maneja el flujo del pedido hasta "invoiced"
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { orderId, invoiceNumber, courier, trackingNumber, trackingUrl } = req.body;

  if (!orderId || !invoiceNumber || !courier || !trackingNumber || !trackingUrl) {
    return res.status(400).json({ message: 'Faltan parámetros en el cuerpo de la solicitud' });
  }

  try {
    // 1️⃣ Obtener el pedido para verificar el estado actual
    const order = await fetchVTEX(orderId);
    const orderStatus = order.status;
    const orderItems = order.items.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.sellingPrice,
    }));

    // Permitir continuar desde start-handling o handling
    if (orderStatus !== 'start-handling' && orderStatus !== 'handling') {
      return res.status(400).json({ message: `El pedido no está en start-handling o handling, sino en ${orderStatus}` });
    }

    // 2️⃣ Si el pedido está en start-handling, pasarlo a "handling-shipping"
    if (orderStatus === 'start-handling') {
      await fetchVTEX(`${orderId}/handling`, 'POST');
    }

    // 3️⃣ Enviar la factura
    const invoiceData = {
      type: 'Output',
      invoiceNumber,
      invoiceValue: order.value,
      courier,
      trackingNumber,
      trackingUrl,
      issuanceDate: new Date().toISOString(),
      items: orderItems,
    };

    await fetchVTEX(`${orderId}/invoice`, 'POST', invoiceData);

    // 4️⃣ Esperar hasta que el estado sea "invoiced"
    const finalStatus = await waitForInvoicedStatus(orderId);

    return res.status(200).json({
      message: `Pedido ${orderId} facturado exitosamente`,
      newStatus: finalStatus,
    });

  } catch (error) {
    console.error('Error en el flujo de facturación:', error);
    return res.status(500).json({ message: 'Error en el proceso de facturación', error: error.message });
  }
}
