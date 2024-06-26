// prisma api connector
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from "@prisma/client";

import atob from 'atob';

// Definir globalmente atob si no está definido
if (typeof global.atob === 'undefined') {
  global.atob = atob;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const email: string = req.body.email ? req.body.email : "null";
  const prisma = new PrismaClient();

  try {
    const user = await prisma.users.findMany({
      where: { email: email },
      select: { permissions: true, rol: true, team: true }
    });

    res.status(200).json({ user });
  } catch {
    console.log("error");
  } finally {
    await prisma.$disconnect();
  }
}