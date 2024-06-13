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
    const { conversationId } = req.query;

    try {
      const messages = await prisma.message.findMany({
        where: {
          conversationId: parseInt(conversationId as string),
        },
        include: {
          sender: true,
          receiver: true,
        },
      });

      res.status(200).json(messages);
    } catch (error) {
      console.error('Error al obtener los mensajes:', error);
      res.status(500).json({ message: 'Error al obtener los mensajes' });
    }
  } else if (req.method === 'POST') {
    const { senderId, receiverId, content, category, status, conversationId } = req.body;

    try {
      const message = await prisma.message.create({
        data: {
          senderId: parseInt(senderId),
          receiverId: parseInt(receiverId),
          content,
          category,
          status: status || 'unread',
          conversationId: parseInt(conversationId),
        },
      });

      // Crear una notificación para el receptor del mensaje
      await prisma.notification.create({
        data: {
          userId: parseInt(receiverId),
          content: `Nuevo mensaje de ${senderId}: ${content}`,
          category: 'message',
          status: 'unread',
        },
      });

      res.status(201).json(message);
    } catch (error) {
      console.error('Error al crear el mensaje:', error);
      res.status(500).json({ message: 'Error al crear el mensaje' });
    }
  } else if (req.method === 'DELETE') {
    const { id } = req.query;

    try {
      const deletedMessage = await prisma.message.delete({
        where: {
          id: parseInt(id as string),
        },
      });

      res.status(200).json(deletedMessage);
    } catch (error) {
      console.error('Error al eliminar el mensaje:', error);
      res.status(500).json({ message: 'Error al eliminar el mensaje' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}




