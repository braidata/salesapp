import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { id } = req.body;

    try {
      await prisma.notification.update({
        where: { id },
        data: { status: 'read' },
      });

      res.status(200).json({ message: 'Notificación marcada como leída' });
    } catch (error) {
      console.error('Error al marcar la notificación como leída:', error);
      res.status(500).json({ message: 'Error al marcar la notificación como leída' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
