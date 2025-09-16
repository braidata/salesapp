// pages/api/vtex/order-by-id.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getOrderById } from '../../../lib/vtex'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Método no permitido' })
  }
  const { orderId } = req.query
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ error: 'Falta orderId' })
  }
  try {
    const data = await getOrderById(orderId)
    return res.status(200).json(data)
  } catch (e: any) {
    return res.status(502).json({ error: e?.message || 'Error VTEX' })
  }
}
