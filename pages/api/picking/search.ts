import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const sapOrder = (req.query.sapOrder as string | undefined)?.trim()

  if (!sapOrder) {
    return res.status(400).json({ message: 'Debe enviar sapOrder' })
  }

  try {
    const sapOrderRecord = await prisma.sap_orders.findUnique({
      where: { sap_order: sapOrder },
      include: { sap_order_items: true },
    })

    if (!sapOrderRecord) {
      return res.status(404).json({ message: 'Pedido SAP no encontrado en la base local' })
    }

    const existingPicking = await prisma.pickings.findUnique({
      where: { sap_order_id: sapOrder },
      include: {
        lines: {
          include: { photos: true },
          orderBy: { id: 'asc' },
        },
        created_by: true,
      },
    })

    const response = {
      order: {
        id: sapOrderRecord.id,
        sapOrder: sapOrderRecord.sap_order,
        purchaseOrder: sapOrderRecord.purchase_order,
        customer: sapOrderRecord.customer_code,
        status: sapOrderRecord.status,
        statusCode: sapOrderRecord.status_code,
        createdAt: sapOrderRecord.creation_date,
        totalAmount: sapOrderRecord.total_amount,
      },
      lines: sapOrderRecord.sap_order_items.map((item, idx) => ({
        uiId: item.id ?? idx,
        sapLineId: item.id?.toString() || `${sapOrderRecord.sap_order}-${idx + 1}`,
        sku: item.sku,
        description: item.product_name,
        quantity: item.quantity,
      })),
      picking: existingPicking
        ? {
            id: existingPicking.id,
            status: existingPicking.status,
            createdAt: existingPicking.created_at,
            createdBy: existingPicking.created_by,
            lines: existingPicking.lines.map((line) => ({
              id: line.id,
              sapLineId: line.sap_order_line_id,
              sku: line.sku,
              description: line.description,
              quantity: line.quantity,
              status: line.status,
              photos: line.photos,
            })),
          }
        : null,
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error('picking search error', error)
    return res.status(500).json({ message: 'Error buscando pedido SAP' })
  }
}
