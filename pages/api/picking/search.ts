import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { fetchSAPSalesDetails } from '../apiSAPSales'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const sapOrder = (req.query.sapOrder as string | undefined)?.trim()

  if (!sapOrder) {
    return res.status(400).json({ message: 'Debe enviar sapOrder' })
  }

  try {
    // Reutilizamos el conector SAP existente para obtener el pedido en línea
    const sapData = await fetchSAPSalesDetails(sapOrder)
    const sapPayload: any = sapData?.data ?? sapData
    const sapResults: any[] = Array.isArray(sapPayload?.results)
      ? sapPayload.results
      : Array.isArray(sapPayload?.d?.results)
      ? sapPayload.d.results
      : []

    if (!sapResults.length) {
      return res.status(404).json({ message: 'Pedido SAP no encontrado o sin ítems' })
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

    const firstItem = sapResults[0]

    const response = {
      order: {
        id: firstItem.SalesOrder || sapOrder,
        sapOrder: firstItem.SalesOrder || sapOrder,
        purchaseOrder: firstItem.PurchaseOrder || null,
        customer: firstItem.SoldToParty || firstItem.Customer || null,
        status: firstItem.OverallDeliveryStatus || firstItem.Status || null,
        statusCode: firstItem.OverallDeliveryStatus || firstItem.Status || null,
        createdAt: firstItem.CreationDate || null,
        totalAmount: firstItem.TotalNetAmount || null,
      },
      lines: sapResults.map((item, idx) => ({
        uiId: idx,
        sapLineId: item.SalesOrderItem?.toString() || `${sapOrder}-${idx + 1}`,
        sku: item.Product || item.Material,
        description: item.MaterialName || item.ProductDescription || item.Description,
        quantity: item.RequestedQuantity || item.OrderQuantity || item.Quantity,
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
