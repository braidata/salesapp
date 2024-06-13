import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import atob from 'atob';

// Definir globalmente atob si no está definido
if (typeof global.atob === 'undefined') {
  global.atob = atob;
}

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { userId } = req.query;

    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId: parseInt(userId as string),
        },
      });

      res.status(200).json(notifications);
    } catch (error) {
      console.error('Error al obtener las notificaciones:', error);
      res.status(500).json({ message: 'Error al obtener las notificaciones' });
    }
  } else if (req.method === 'POST') {
    const { userId, content, category, status } = req.body;

    try {
      const notification = await prisma.notification.create({
        data: {
          userId: parseInt(userId),
          content,
          category,
          status: status || 'unread',
        },
      });

      res.status(201).json(notification);
    } catch (error) {
      console.error('Error al crear la notificación:', error);
      res.status(500).json({ message: 'Error al crear la notificación' });
    }
  } else if (req.method === 'DELETE') {
    const { id } = req.query;

    try {
      const deletedNotification = await prisma.notification.delete({
        where: {
          id: parseInt(id as string),
        },
      });

      res.status(200).json(deletedNotification);
    } catch (error) {
      console.error('Error al eliminar la notificación:', error);
      res.status(500).json({ message: 'Error al eliminar la notificación' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

