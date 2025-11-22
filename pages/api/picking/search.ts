import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import axios from 'axios'

function parseSapDate(raw: any): string | null {
  if (!raw) return null

  if (typeof raw === 'string') {
    const match = raw.match(/\/Date\((\d+)\)\//)
    if (match) {
      const timestamp = Number(match[1])
      return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null
    }
  }

  if (raw instanceof Date) return raw.toISOString()
  return null
}

async function fetchSAPSalesDetails(salesOrder: string) {
  const SAP_USER = process.env.SAP_USER
  const SAP_PASSWORD = process.env.SAP_PASSWORD
  const SAP_URL = `https://sapwdp.imega.cl:44300/sap/opu/odata/sap/ZCDS_CUBE_PEDIDOS_CDS/ZCDS_CUBE_PEDIDOS?$filter=SalesOrder%20eq%20%27${salesOrder}%27`

  const response = await axios.get(SAP_URL, {
    auth: {
      username: SAP_USER as string,
      password: SAP_PASSWORD as string,
    },
  })

  const payload = response.data
  if (Array.isArray(payload?.d?.results)) return payload.d.results
  if (Array.isArray(payload?.data?.results)) return payload.data.results
  if (Array.isArray(payload?.results)) return payload.results

  return []
}

function mapSapLine(item: any, idx: number, sapOrder: string) {
  return {
    uiId: idx,
    sapLineId: item.SalesOrderItem?.toString() || `${sapOrder}-${idx + 1}`,
    sku: item.Material || item.Product,
    description:
      item.SalesOrderItemText ||
      item.MaterialName ||
      item.ProductDescription ||
      item.Description,
    quantity: Number(item.ORDERQUANTITY ?? item.OrderQuantity ?? item.RequestedQuantity ?? item.Quantity ?? 0) || null,
  }
}

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
    const sapResults: any[] = await fetchSAPSalesDetails(sapOrder)

    if (!sapResults.length) {
      return res.status(404).json({ message: 'Pedido SAP no encontrado o sin ítems' })
    }

    const filteredResults = sapResults.filter((item) => !`${item.Material || ''}`.startsWith('600004'))
    if (!filteredResults.length) {
      return res.status(404).json({ message: 'El pedido no tiene líneas pickeables (servicios de flete se omiten)' })
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

    // Algunos pedidos devuelven posiciones duplicadas en el payload.
    const dedupedLines = filteredResults
      .map((item, idx) => ({ item, mapped: mapSapLine(item, idx, sapOrder) }))
      .reduce<{ key: string; mapped: ReturnType<typeof mapSapLine> }[]>((acc, entry) => {
        const key = `${entry.item.SalesOrderItem || entry.mapped.sapLineId}-${entry.item.Material || ''}-${entry.item.BillingDocumentItem || ''}`
        if (!acc.find((existing) => existing.key === key)) {
          acc.push({ key, mapped: entry.mapped })
        }
        return acc
      }, [])
      .map(({ mapped }) => mapped)

    const firstItem = sapResults[0]

    const response = {
      order: {
        id: firstItem.SalesOrder || sapOrder,
        sapOrder: firstItem.SalesOrder || sapOrder,
        purchaseOrder: firstItem.PurchaseOrderByCustomer || firstItem.PurchaseOrder || null,
        customer:
          firstItem.SoldToPartyName ||
          firstItem.SoldToParty ||
          firstItem.Customer ||
          firstItem.CustomerName ||
          null,
        status:
          firstItem.SDPROCESSSTATUS_TEXT ||
          firstItem.SDPROCESSSTATUS ||
          firstItem.OverallDeliveryStatus ||
          firstItem.Status ||
          null,
        statusCode:
          firstItem.SDPROCESSSTATUS || firstItem.OverallDeliveryStatus || firstItem.Status || null,
        createdAt: parseSapDate(firstItem.CreationDate),
        totalAmount:
          Number(firstItem.NetAmount ?? firstItem.ItemNetAmountOfBillingDoc ?? firstItem.TOTAL ?? firstItem.TotalNetAmount ?? 0) ||
          null,
        currency: firstItem.TransactionCurrency || null,
      },
      lines: dedupedLines,
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
