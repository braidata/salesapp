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
    const { userId, postId } = req.query;

    try {
      let conversations;
      if (postId) {
        conversations = await prisma.conversation.findMany({
          where: {
            postId: parseInt(postId as string),
          },
          include: {
            users: true,
            messages: true,
          },
        });
      } else if (userId) {
        conversations = await prisma.conversation.findMany({
          where: {
            users: {
              some: {
                id: parseInt(userId as string),
              },
            },
          },
          include: {
            users: true,
            messages: true,
          },
        });
      } else {
        conversations = await prisma.conversation.findMany({
          include: {
            users: true,
            messages: true,
          },
        });
      }

      res.status(200).json(conversations);
    } catch (error) {
      console.error('Error al obtener las conversaciones:', error);
      res.status(500).json({ message: 'Error al obtener las conversaciones' });
    }
  } else if (req.method === 'POST') {
    const { userIds, title, postId } = req.body;

    try {
      const conversation = await prisma.conversation.create({
        data: {
          title,
          users: {
            connect: userIds.map((id: number) => ({ id })),
          },
          postId: postId ? parseInt(postId) : null,
        },
      });

      res.status(201).json(conversation);
    } catch (error) {
      console.error('Error al crear la conversación:', error);
      res.status(500).json({ message: 'Error al crear la conversación' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
