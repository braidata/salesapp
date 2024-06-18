import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import atob from 'atob';

if (typeof global.atob === 'undefined') {
  global.atob = atob;
}

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { userId, category, role } = req.query;

    try {
      let notifications;
      console.log("category", category)
      if (category === 'Nuevo Pago') {
        // Si es un validador, obtiene todas las notificaciones de la categoría 'payment'
        notifications = await prisma.notification.findMany({
          where: {
            category: category as string,
          },
        });
      } else if(category==='Nueva Validación') {
        // Si es un vendedor, obtiene solo sus notificaciones de la categoría 'payment' or 'Nueva Validación'
        notifications = await prisma.notification.findMany({
          where: {
            userId: userId as string,
            category: category as string,
          },
        });
      }

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
  } else if (req.method === 'PUT') {
    const { id, status } = req.body;

    try {
      const updatedNotification = await prisma.notification.update({
        where: { id: parseInt(id as string) },
        data: { status },
      });

      res.status(200).json(updatedNotification);
    } catch (error) {
      console.error('Error al actualizar la notificación:', error);
      res.status(500).json({ message: 'Error al actualizar la notificación' });
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
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
