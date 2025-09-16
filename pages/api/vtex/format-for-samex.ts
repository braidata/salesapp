// pages/api/vtex/format-for-samex.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getOrderById } from '../../../lib/vtex'
import { mapVtexToSamex } from '../../../lib/samexMapper'

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
    const order = await getOrderById(orderId)
    const samex = mapVtexToSamex(order)
    return res.status(200).json({ orderId, samex, debugOrderKeys: Object.keys(order || {}) })
  } catch (e: any) {
    return res.status(502).json({ error: e?.message || 'Error VTEX' })
  }
}
