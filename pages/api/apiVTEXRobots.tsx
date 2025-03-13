// pages/api/vtex-orders.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { daysBack, startDate, endDate, paymentMethod, shippingMethod, status, page, perPage } = req.query;

  const filters = [];

  // 🗓️ Filtrar por Rango de Fechas
  const today = new Date();
  if (daysBack) {
    const days = parseInt(daysBack as string, 10);
    if (!isNaN(days)) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - days);
      filters.push(`f_creationDate=creationDate:[${pastDate.toISOString()} TO ${today.toISOString()}]`);
    }
  } else if (startDate && endDate) {
    filters.push(`f_creationDate=creationDate:[${startDate} TO ${endDate}]`);
  }

  // 💳 Filtrar por Método de Pago
  if (paymentMethod) filters.push(`f_paymentNames=${paymentMethod}`);

  // 🚚 Filtrar por Método de Despacho
  if (shippingMethod) {
    if (shippingMethod === "pickup") {
      filters.push(`f_origin=Pickup-in-Store`);
    } else if (shippingMethod === "starken") {
      filters.push(`f_origin=Starken`);
    } else if (shippingMethod === "dispatch") {
      filters.push(`f_origin=Marketplace`); // O cualquier otro criterio que represente despacho en Santiago
    }
  }

  // 📦 Filtrar por Estado del Pedido
  if (status) filters.push(`f_status=${status}`);

  // 📊 Paginación
  const pageNum = parseInt(page as string) || 1;
  const perPageNum = parseInt(perPage as string) || 15;
  filters.push(`_page=${pageNum}&_perPage=${perPageNum}`);

  const queryString = filters.length ? `?${filters.join('&')}` : '';

  const VTEX_API_URL = `https://imegab2c.myvtex.com/api/oms/pvt/orders${queryString}`;
  const API_VTEX_TOKEN = process.env.API_VTEX_TOKEN;

  if (!API_VTEX_TOKEN) {
    return res.status(500).json({ message: 'API_VTEX_TOKEN no está configurada en las variables de entorno' });
  }

  try {
    const response = await fetch(VTEX_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VTEX-API-AppKey': process.env.API_VTEX_KEY || '',
        'X-VTEX-API-AppToken': process.env.API_VTEX_TOKEN || '',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en la API de VTEX: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Filtrar resultados según shippingMethod si la API de VTEX no lo soporta directamente
    if (shippingMethod) {
      data.list = data.list.filter((order: any) => {
        if (shippingMethod === "pickup") return order.origin === "Pickup-in-Store";
        if (shippingMethod === "starken") return order.origin === "Starken";
        if (shippingMethod === "dispatch") return order.origin === "Marketplace";
        return true;
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error al obtener las órdenes de VTEX:', error);
    return res.status(500).json({ message: 'Error al obtener las órdenes de VTEX' });
  }
}
