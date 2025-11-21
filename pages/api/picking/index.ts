import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import prisma from '@/lib/prisma'

type Method = 'GET' | 'POST'

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

  if (!session?.user) {
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

    const sapOrderRecord = await prisma.sap_orders.findUnique({
      where: { sap_order: sapOrder },
      include: { sap_order_items: true },
    })

    if (!sapOrderRecord) {
      return res.status(404).json({ message: 'Pedido SAP no encontrado' })
    }

    const picking = await prisma.pickings.create({
      data: {
        sap_order_id: sapOrder,
        sap_order_db_id: sapOrderRecord.id,
        status: 'IN_PROGRESS',
        created_by_user_id: Number(session.user.id) || null,
        lines: {
          create: sapOrderRecord.sap_order_items.map((item, idx) => ({
            sap_order_line_id: item.id?.toString() || `${sapOrder}-${idx + 1}`,
            sku: item.sku,
            description: item.product_name,
            quantity: item.quantity,
          })),
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
