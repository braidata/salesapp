import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { email } = req.body;
    const prisma = new PrismaClient();

    try {
      // Obtener el equipo del usuario logueado
      const loggedInUser = await prisma.users.findUnique({
        where: { email },
        select: { team: true },
      });

      if (!loggedInUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      const loggedInUserTeam = loggedInUser.team;
      console.log("logged team",email, loggedInUserTeam)
      // Obtener los usuarios del mismo equipo
      const teamUsers = await prisma.users.findMany({
        where: { team: loggedInUserTeam },
        select: { name: true, email: true },
      });

      res.status(200).json({ users: teamUsers });
      console.log("team", teamUsers )
    } catch (error) {
      console.error('Error fetching team users:', error);
      res.status(500).json({ message: 'Internal server error' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}