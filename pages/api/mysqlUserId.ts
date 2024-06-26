import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  try {
    const user = await prisma.users.findUnique({
      where: {
        id: parseInt(userId as string),
      },
    });

    if (user) {
      res.status(200).json({ name: user.name });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user name:', error);
    res.status(500).json({ message: 'Error fetching user name' });
  }
}
