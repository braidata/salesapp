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
    const { postId } = req.query;

    try {
      const comments = await prisma.comment.findMany({
        where: {
          postId: parseInt(postId as string),
        },
      });

      res.status(200).json(comments);
    } catch (error) {
      console.error('Error al obtener los comentarios:', error);
      res.status(500).json({ message: 'Error al obtener los comentarios' });
    }
  } else if (req.method === 'POST') {
    const { content, postId, userId, category, status } = req.body;

    try {
      const comment = await prisma.comment.create({
        data: {
          content,
          postId: parseInt(postId),
          userId: parseInt(userId),
          category,
          status: status || 'active',
        },
      });

      // Crear una notificación para el autor del post
      const post = await prisma.posts.findUnique({
        where: { id: parseInt(postId) },
        include: { author: true }
      });

      if (post) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            content: `Nuevo comentario en tu post: ${post.title}`,
            category: 'comment'
          }
        });
      }

      res.status(201).json(comment);
    } catch (error) {
      console.error('Error al crear el comentario:', error);
      res.status(500).json({ message: 'Error al crear el comentario' });
    }
  } else if (req.method === 'DELETE') {
    const { id } = req.query;

    try {
      const deletedComment = await prisma.comment.delete({
        where: {
          id: parseInt(id as string),
        },
      });

      res.status(200).json(deletedComment);
    } catch (error) {
      console.error('Error al eliminar el comentario:', error);
      res.status(500).json({ message: 'Error al eliminar el comentario' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}



