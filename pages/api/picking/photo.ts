import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { pickingLineId, pickingId, photoType, s3Url, userId: providedUserId } = req.body as {
    pickingLineId?: number | string
    pickingId?: number | string
    photoType?: 'PICK' | 'PACK'
    s3Url?: string
    userId?: number
  }
  const userId = providedUserId ? Number(providedUserId) : null

  if (!photoType || !s3Url) {
    return res.status(400).json({ message: 'Datos incompletos' })
  }

  if (!['PICK', 'PACK'].includes(photoType)) {
    return res.status(400).json({ message: 'photoType debe ser PICK o PACK' })
  }

  try {
    let targetPickingId: number | null = null
    let targetLineId: number | null = null

    if (photoType === 'PICK') {
      if (!pickingLineId) return res.status(400).json({ message: 'pickingLineId es requerido para foto de picking' })

      const line = await prisma.picking_lines.findUnique({
        where: { id: Number(pickingLineId) },
        include: { picking: true },
      })

      if (!line || !line.picking) {
        return res.status(404).json({ message: 'Línea o picking no encontrado' })
      }

      targetPickingId = line.picking_id
      targetLineId = line.id

      await prisma.picking_photos.create({
        data: {
          picking_line_id: line.id,
          picking_id: line.picking_id,
          photo_type: photoType,
          s3_url: s3Url,
          uploaded_by_user_id: userId ?? undefined,
        },
      })

      const photos = await prisma.picking_photos.findMany({ where: { picking_line_id: line.id } })
      const hasPick = photos.some((p) => p.photo_type === 'PICK')
      const newStatus = hasPick ? 'PICKED' : 'PENDING'

      await prisma.picking_lines.update({
        where: { id: line.id },
        data: { status: newStatus },
      })
    } else {
      if (!pickingId && !pickingLineId) {
        return res.status(400).json({ message: 'Debe enviar pickingId para foto de embalaje' })
      }

      const pickingWhere: any = {}
      if (pickingId) pickingWhere.id = Number(pickingId)
      else if (pickingLineId) pickingWhere.lines = { some: { id: Number(pickingLineId) } }

      const picking = await prisma.pickings.findFirst({
        where: pickingWhere,
        include: { lines: { include: { photos: true } } },
      })

      if (!picking) {
        return res.status(404).json({ message: 'Picking no encontrado' })
      }

      targetPickingId = picking.id

      await prisma.picking_photos.create({
        data: {
          picking_id: picking.id,
          picking_line_id: pickingLineId ? Number(pickingLineId) : null,
          photo_type: 'PACK',
          s3_url: s3Url,
          uploaded_by_user_id: userId ?? undefined,
        },
      })

      // Marcar líneas como PACKED solo cuando ya tienen evidencia de picking
      const pickedLineIds = picking.lines
        .filter((line) => line.photos?.some((p) => p.photo_type === 'PICK'))
        .map((line) => line.id)

      if (pickedLineIds.length) {
        await prisma.picking_lines.updateMany({ where: { id: { in: pickedLineIds } }, data: { status: 'PACKED' } })
      }
    }

    if (!targetPickingId) return res.status(500).json({ message: 'No se pudo determinar picking' })

    const lineStatuses = await prisma.picking_lines.findMany({
      where: { picking_id: targetPickingId },
      select: { id: true, status: true },
    })

    const allPacked = lineStatuses.every((l) => l.status === 'PACKED')
    const anyPick = photoType === 'PACK' || lineStatuses.some((l) => l.status === 'PICKED' || l.status === 'PACKED')
    const pickingStatus = allPacked ? 'COMPLETED' : anyPick ? 'PACKED' : 'IN_PROGRESS'

    await prisma.pickings.update({
      where: { id: targetPickingId },
      data: { status: pickingStatus },
    })

    return res.status(200).json({ url: s3Url, pickingStatus, lineId: targetLineId })
  } catch (error) {
    console.error('photo upload error', error)
    return res.status(500).json({ message: 'Error subiendo foto' })
  }
}
