import prisma from './prisma'

export async function recalculatePickingState(pickingId: number) {
  const picking = await prisma.pickings.findUnique({
    where: { id: pickingId },
    include: {
      photos: true,
      lines: { include: { photos: true } },
    },
  })

  if (!picking) return null

  if (picking.status === 'COMPLETED') return 'COMPLETED'

  const hasPackingPhoto = picking.photos.some(
    (photo) => photo.photo_type === 'PACK' && photo.picking_line_id === null,
  )

  await Promise.all(
    picking.lines.map(async (line) => {
      const hasPickPhoto = line.photos.some((photo) => photo.photo_type === 'PICK')
      const nextStatus = hasPickPhoto ? (hasPackingPhoto ? 'PACKED' : 'PICKED') : 'PENDING'

      if (line.status !== nextStatus) {
        await prisma.picking_lines.update({ where: { id: line.id }, data: { status: nextStatus } })
      }
    }),
  )

  const refreshedLineStatuses = await prisma.picking_lines.findMany({
    where: { picking_id: pickingId },
    select: { status: true },
  })

  const allPacked = refreshedLineStatuses.length > 0 && refreshedLineStatuses.every((line) => line.status === 'PACKED')
  const anyPicked = refreshedLineStatuses.some((line) => line.status === 'PICKED' || line.status === 'PACKED')

  const nextPickingStatus = allPacked
    ? 'PACKED'
    : hasPackingPhoto && anyPicked
      ? 'PACKED'
      : anyPicked
        ? 'PICKED'
        : 'IN_PROGRESS'

  await prisma.pickings.update({ where: { id: pickingId }, data: { status: nextPickingStatus } })

  return nextPickingStatus
}
