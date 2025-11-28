import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { recalculatePickingState } from '@/lib/pickingStatus'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['POST', 'PUT', 'DELETE'].includes(req.method || '')) {
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

  if (req.method !== 'DELETE' && (!photoType || !s3Url)) {
    return res.status(400).json({ message: 'Datos incompletos' })
  }

  if (!['PICK', 'PACK'].includes(photoType)) {
    return res.status(400).json({ message: 'photoType debe ser PICK o PACK' })
  }

  try {
    let targetPickingId: number | null = null
    let targetLineId: number | null = null

    const ensureNotCompleted = async (id: number) => {
      const current = await prisma.pickings.findUnique({ where: { id }, select: { status: true } })
      if (current?.status === 'COMPLETED') {
        throw new Error('El picking está completado y no permite cambios')
      }
    }

    if (photoType === 'PICK') {
      if (!pickingLineId) return res.status(400).json({ message: 'pickingLineId es requerido para foto de picking' })

      const line = await prisma.picking_lines.findUnique({
        where: { id: Number(pickingLineId) },
        include: { picking: true },
      })

      if (!line || !line.picking) {
        return res.status(404).json({ message: 'Línea o picking no encontrado' })
      }

      await ensureNotCompleted(line.picking_id || line.picking.id)

      targetPickingId = line.picking_id
      targetLineId = line.id

      if (req.method === 'DELETE') {
        const latestPhoto = await prisma.picking_photos.findFirst({
          where: { picking_line_id: line.id, photo_type: 'PICK' },
          orderBy: { uploaded_at: 'desc' },
        })

        if (!latestPhoto) return res.status(404).json({ message: 'No hay foto para eliminar' })

        await prisma.picking_photos.delete({ where: { id: latestPhoto.id } })
      } else if (req.method === 'PUT') {
        const latestPhoto = await prisma.picking_photos.findFirst({
          where: { picking_line_id: line.id, photo_type: 'PICK' },
          orderBy: { uploaded_at: 'desc' },
        })

        if (!latestPhoto) return res.status(404).json({ message: 'No hay foto previa para reemplazar' })

        await prisma.picking_photos.update({
          where: { id: latestPhoto.id },
          data: { s3_url: s3Url as string, uploaded_by_user_id: userId ?? undefined },
        })
      } else {
        await prisma.picking_photos.create({
          data: {
            picking_line_id: line.id,
            picking_id: line.picking_id,
            photo_type: photoType,
            s3_url: s3Url,
            uploaded_by_user_id: userId ?? undefined,
          },
        })
      }
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

      await ensureNotCompleted(picking.id)

      targetPickingId = picking.id

      if (req.method === 'DELETE') {
        const packPhoto = await prisma.picking_photos.findFirst({
          where: { picking_id: picking.id, picking_line_id: null, photo_type: 'PACK' },
          orderBy: { uploaded_at: 'desc' },
        })

        if (!packPhoto) return res.status(404).json({ message: 'No hay foto de embalaje para eliminar' })

        await prisma.picking_photos.delete({ where: { id: packPhoto.id } })
      } else if (req.method === 'PUT') {
        const packPhoto = await prisma.picking_photos.findFirst({
          where: { picking_id: picking.id, picking_line_id: null, photo_type: 'PACK' },
          orderBy: { uploaded_at: 'desc' },
        })

        if (!packPhoto) return res.status(404).json({ message: 'No hay foto de embalaje previa para reemplazar' })

        await prisma.picking_photos.update({
          where: { id: packPhoto.id },
          data: { s3_url: s3Url as string, uploaded_by_user_id: userId ?? undefined },
        })
      } else {
        await prisma.picking_photos.create({
          data: {
            picking_id: picking.id,
            picking_line_id: pickingLineId ? Number(pickingLineId) : null,
            photo_type: 'PACK',
            s3_url: s3Url,
            uploaded_by_user_id: userId ?? undefined,
          },
        })
      }
    }

    if (!targetPickingId) return res.status(500).json({ message: 'No se pudo determinar picking' })

    const pickingStatus = await recalculatePickingState(targetPickingId)

    return res.status(200).json({ url: s3Url, pickingStatus, lineId: targetLineId })
  } catch (error) {
    console.error('photo upload error', error)
    const message = error instanceof Error ? error.message : 'Error subiendo foto'
    const code = message.includes('completado') ? 400 : 500
    return res.status(code).json({ message })
  }
}
