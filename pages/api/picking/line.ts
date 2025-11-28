import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { recalculatePickingState } from '@/lib/pickingStatus'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { lineId } = req.body as { lineId?: number }

  if (!lineId) return res.status(400).json({ message: 'lineId es requerido' })

  try {
    const line = await prisma.picking_lines.findUnique({
      where: { id: Number(lineId) },
      include: { picking: true },
    })

    if (!line || !line.picking) {
      return res.status(404).json({ message: 'Línea o picking no encontrado' })
    }

    if (line.picking.status === 'COMPLETED') {
      return res.status(400).json({ message: 'No se puede eliminar una línea de un picking completado' })
    }

    await prisma.picking_photos.deleteMany({ where: { picking_line_id: line.id } })
    await prisma.picking_lines.delete({ where: { id: line.id } })

    await recalculatePickingState(line.picking_id ?? line.picking.id)

    return res.status(200).json({ message: 'Línea eliminada' })
  } catch (error) {
    console.error('delete picking line error', error)
    return res.status(500).json({ message: 'No se pudo eliminar la línea' })
  }
}
