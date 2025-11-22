import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import prisma from '@/lib/prisma'

const extractUserId = (session: any) =>
  Number(session?.token?.user?.id || session?.token?.sub || session?.user?.id) || null

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const session = await getSession({ req })
  const userId = extractUserId(session)

  if (!session || !userId) {
    return res.status(401).json({ message: 'No autenticado' })
  }

  const { pickingLineId, photoType, s3Url } = req.body as {
    pickingLineId?: number | string
    photoType?: 'PICK' | 'PACK'
    s3Url?: string
  }

  if (!pickingLineId || !photoType || !s3Url) {
    return res.status(400).json({ message: 'Datos incompletos' })
  }

  if (!['PICK', 'PACK'].includes(photoType)) {
    return res.status(400).json({ message: 'photoType debe ser PICK o PACK' })
  }

  try {
    const line = await prisma.picking_lines.findUnique({
      where: { id: Number(pickingLineId) },
      include: { picking: true },
    })

    if (!line || !line.picking) {
      return res.status(404).json({ message: 'Línea o picking no encontrado' })
    }

    const photo = await prisma.picking_photos.create({
      data: {
        picking_line_id: line.id,
        photo_type: photoType,
        s3_url: s3Url,
        uploaded_by_user_id: userId,
      },
    })

    const photos = await prisma.picking_photos.findMany({ where: { picking_line_id: line.id } })
    const hasPick = photos.some((p) => p.photo_type === 'PICK')
    const hasPack = photos.some((p) => p.photo_type === 'PACK')
    const newStatus = hasPack ? 'PACKED' : hasPick ? 'PICKED' : 'PENDING'

    await prisma.picking_lines.update({
      where: { id: line.id },
      data: { status: newStatus },
    })

    const lineStatuses = await prisma.picking_lines.findMany({
      where: { picking_id: line.picking_id },
      select: { status: true },
    })

    const allPacked = lineStatuses.every((l) => l.status === 'PACKED')
    const anyPick = lineStatuses.some((l) => l.status === 'PICKED' || l.status === 'PACKED')
    const pickingStatus = allPacked ? 'COMPLETED' : anyPick ? 'PICKED' : 'IN_PROGRESS'

    await prisma.pickings.update({
      where: { id: line.picking_id },
      data: { status: pickingStatus },
    })

    return res.status(200).json({ photo, url: s3Url, pickingStatus, lineStatus: newStatus })
  } catch (error) {
    console.error('photo upload error', error)
    return res.status(500).json({ message: 'Error subiendo foto' })
  }
}
