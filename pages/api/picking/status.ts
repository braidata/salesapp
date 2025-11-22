import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import prisma from '@/lib/prisma'

const extractUserId = (session: any) =>
  Number(session?.token?.user?.id || session?.token?.sub || session?.user?.id) || null

const allowedStatuses = ['PENDING', 'IN_PROGRESS', 'PICKED', 'PACKED', 'COMPLETED']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const session = await getSession({ req })
  const userId = extractUserId(session)

  if (!session || !userId) return res.status(401).json({ message: 'No autenticado' })

  const { pickingId, status } = req.body as { pickingId?: number; status?: string }
  if (!pickingId || !status) return res.status(400).json({ message: 'Datos incompletos' })
  if (!allowedStatuses.includes(status)) return res.status(400).json({ message: 'Estado no válido' })

  try {
    if (status === 'COMPLETED') {
      const lines = await prisma.picking_lines.findMany({
        where: { picking_id: pickingId },
        select: { status: true },
      })
      const allPacked = lines.every((l) => l.status === 'PACKED')
      if (!allPacked) return res.status(400).json({ message: 'Todas las líneas deben estar PACKED' })
    }

    const picking = await prisma.pickings.update({
      where: { id: pickingId },
      data: { status: status as any },
      include: { lines: { include: { photos: true } } },
    })

    return res.status(200).json({ picking })
  } catch (error) {
    console.error('update status error', error)
    return res.status(500).json({ message: 'No se pudo actualizar estado' })
  }
}
