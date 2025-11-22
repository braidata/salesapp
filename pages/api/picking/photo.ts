import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import AWS from 'aws-sdk'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import type { Express } from 'express'
import prisma from '@/lib/prisma'

const upload = multer({ storage: multer.memoryStorage() })
export const config = { api: { bodyParser: false } }

function runMulter(req: NextApiRequest, res: NextApiResponse) {
  return new Promise<void>((resolve, reject) => {
    upload.single('file')(req as any, res as any, (err: any) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
})

const BUCKET = process.env.AWS_S3_BUCKET as string
const REGION = process.env.AWS_REGION as string

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const session = await getSession({ req })
  if (!session?.user) {
    return res.status(401).json({ message: 'No autenticado' })
  }

  try {
    await runMulter(req, res)
    const file = (req as any).file as Express.Multer.File | undefined
    const { pickingLineId, photoType } = (req.body || {}) as Record<string, string>

    if (!file) return res.status(400).json({ message: 'No file uploaded' })
    if (!pickingLineId || !photoType) return res.status(400).json({ message: 'Datos incompletos' })
    if (!['PICK', 'PACK'].includes(photoType)) {
      return res.status(400).json({ message: 'photoType debe ser PICK o PACK' })
    }

    const line = await prisma.picking_lines.findUnique({
      where: { id: Number(pickingLineId) },
      include: { picking: true, photos: true },
    })

    if (!line || !line.picking) {
      return res.status(404).json({ message: 'Línea o picking no encontrado' })
    }

    const ext = path.extname(file.originalname) || '.jpg'
    const key = `picking/${line.picking.sap_order_id}/line-${line.sap_order_line_id || line.id}/${photoType.toLowerCase()}-${uuidv4()}${ext}`

    await s3
      .upload({
        Bucket: BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
      .promise()

    const publicBase =
      process.env.AWS_S3_PUBLIC_BASE_URL || `https://${BUCKET}.s3.${REGION}.amazonaws.com`
    const url = `${publicBase}/${key}`

    const photo = await prisma.picking_photos.create({
      data: {
        picking_line_id: line.id,
        photo_type: photoType as any,
        s3_url: url,
        uploaded_by_user_id: Number(session.user.id) || null,
      },
    })

    const photos = await prisma.picking_photos.findMany({ where: { picking_line_id: line.id } })
    const hasPick = photos.some((p) => p.photo_type === 'PICK')
    const hasPack = photos.some((p) => p.photo_type === 'PACK')
    const newStatus = hasPack ? 'PACKED' : hasPick ? 'PICKED' : 'PENDING'

    await prisma.picking_lines.update({
      where: { id: line.id },
      data: { status: newStatus as any },
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
      data: { status: pickingStatus as any },
    })

    return res.status(200).json({
      photo,
      url,
      pickingStatus,
      lineStatus: newStatus,
    })
  } catch (error) {
    console.error('photo upload error', error)
    return res.status(500).json({ message: 'Error subiendo foto' })
  }
}
