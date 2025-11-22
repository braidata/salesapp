import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import prisma from '@/lib/prisma'
import axios from 'axios'

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
    sap_order_line_id: item.SalesOrderItem?.toString() || `${sapOrder}-${idx + 1}`,
    sku: item.Material || item.Product,
    description:
      item.SalesOrderItemText ||
      item.MaterialName ||
      item.ProductDescription ||
      item.Description,
    quantity: Number(item.ORDERQUANTITY ?? item.OrderQuantity ?? item.RequestedQuantity ?? item.Quantity ?? 0) || 0,
  }
}

type Method = 'GET' | 'POST'

const extractUserId = (session: any) =>
  Number(session?.token?.user?.id || session?.token?.sub || session?.user?.id) || null

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const method = req.method as Method

  if (!['GET', 'POST'].includes(method)) {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  if (method === 'GET') return listPickings(req, res)
  return createPicking(req, res)
}

async function listPickings(req: NextApiRequest, res: NextApiResponse) {
  const { status, userId, sapOrder, startDate, endDate } = req.query

  const where: any = {
    AND: [
      status ? { status } : {},
      userId ? { created_by_user_id: Number(userId) } : {},
      sapOrder ? { sap_order_id: sapOrder } : {},
      startDate && endDate
        ? {
            created_at: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string),
            },
          }
        : {},
    ],
  }

  try {
    const pickings = await prisma.pickings.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        created_by: true,
        lines: { include: { photos: true } },
      },
    })

    return res.status(200).json({ pickings })
  } catch (error) {
    console.error('list pickings error', error)
    return res.status(500).json({ message: 'Error cargando pickings' })
  }
}

async function createPicking(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req })
  const userId = extractUserId(session)

  if (!session || !userId) {
    return res.status(401).json({ message: 'No autenticado' })
  }

  const { sapOrder } = req.body as { sapOrder?: string }

  if (!sapOrder) {
    return res.status(400).json({ message: 'sapOrder es requerido' })
  }

  try {
    const existing = await prisma.pickings.findUnique({ where: { sap_order_id: sapOrder } })
    if (existing) {
      return res.status(200).json({ picking: existing, message: 'Picking ya existe' })
    }

    const sapResults: any[] = await fetchSAPSalesDetails(sapOrder)
    if (!sapResults.length) {
      return res.status(404).json({ message: 'Pedido SAP no encontrado en SAP' })
    }

    const filteredResults = sapResults.filter((item) => !`${item.Material || ''}`.startsWith('600004'))
    if (!filteredResults.length) {
      return res.status(400).json({ message: 'El pedido solo contiene servicios de flete (600004) que no se pickean' })
    }

    const dedupedLines = filteredResults
      .map((item, idx) => ({ item, mapped: mapSapLine(item, idx, sapOrder) }))
      .reduce<{ key: string; mapped: ReturnType<typeof mapSapLine> }[]>((acc, entry) => {
        const key = `${entry.item.SalesOrderItem || entry.mapped.sap_order_line_id}-${entry.item.Material || ''}-${
          entry.item.BillingDocumentItem || ''
        }`
        if (!acc.find((existing) => existing.key === key)) {
          acc.push({ key, mapped: entry.mapped })
        }
        return acc
      }, [])
      .map(({ mapped }) => mapped)

    const picking = await prisma.pickings.create({
      data: {
        sap_order_id: sapOrder,
        status: 'IN_PROGRESS',
        created_by_user_id: userId,
        lines: {
          create: dedupedLines,
        },
      },
      include: {
        lines: { include: { photos: true } },
        created_by: true,
      },
    })

    const formatted = {
      id: picking.id,
      sap_order_id: picking.sap_order_id,
      status: picking.status,
      createdAt: picking.created_at,
      createdBy: picking.created_by,
      lines: picking.lines,
    }

    return res.status(201).json({ picking: formatted })
  } catch (error) {
    console.error('create picking error', error)
    return res.status(500).json({ message: 'Error creando picking' })
  }
}
