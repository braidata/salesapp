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
    const { authorId, orderId, paymentValidatorId } = req.query;

    try {
      let posts;
      if (orderId) {
        posts = await prisma.posts.findMany({
          where: {
            orderId: parseInt(orderId as string),
          },
        });
      } else if (paymentValidatorId) {
        posts = await prisma.posts.findMany({
          where: {
            paymentValidatorId: parseInt(paymentValidatorId as string),
          },
        });
      } else if (authorId) {
        posts = await prisma.posts.findMany({
          where: {
            authorId: parseInt(authorId as string),
          },
        });
      } else {
        posts = await prisma.posts.findMany();
      }

      res.status(200).json(posts);
    } catch (error) {
      console.error('Error al obtener los posts:', error);
      res.status(500).json({ message: 'Error al obtener los posts' });
    }
  } else if (req.method === 'POST') {
    const { title, content, authorId, orderId, paymentValidatorId } = req.body;

    try {
      const post = await prisma.posts.create({
        data: {
          title,
          content,
          authorId: parseInt(authorId),
          orderId: orderId ? parseInt(orderId) : null,
          paymentValidatorId: paymentValidatorId ? parseInt(paymentValidatorId) : null,
        },
      });

      res.status(201).json(post);
    } catch (error) {
      console.error('Error al crear el post:', error);
      res.status(500).json({ message: 'Error al crear el post' });
    }
  } else if (req.method === 'DELETE') {
    const { id } = req.query;

    try {
      const deletedPost = await prisma.posts.delete({
        where: {
          id: parseInt(id as string),
        },
      });

      res.status(200).json(deletedPost);
    } catch (error) {
      console.error('Error al eliminar el post:', error);
      res.status(500).json({ message: 'Error al eliminar el post' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

