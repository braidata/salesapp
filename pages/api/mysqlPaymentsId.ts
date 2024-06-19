//prisma api connector
import { NextApiRequest, NextApiResponse } from 'next'

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

//sending data to prisma
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
      const { email, orderId, status } = req.body;
  
      try {
        let payments;
  
        if (orderId) {
          payments = await prisma.payments_validator.findMany({
            where: {
              id: parseInt(orderId),
              
            },
          });
        } else {
          payments = await prisma.payments_validator.findMany({
            where: {
              status: status || undefined,
            },
          });
        }
  
        res.status(200).json(payments);
      } catch (error) {
        console.error('Error al obtener los pagos:', error);
        res.status(500).json({ message: 'Error al obtener los pagos' });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  }