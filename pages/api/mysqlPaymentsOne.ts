//prisma api connector
import { NextApiRequest, NextApiResponse } from 'next'

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
      const payment_id: string | any = req.query.payment_id;
  
      try {
        const payment = await prisma.payments_validator.findUnique({
          where: {
            id: parseInt(payment_id),
          },
        });
  
        if (!payment || payment.id !== parseInt(payment_id)) {
          res.status(404).json({ message: 'Pago no encontrado' });
          return;
        }
  
        res.status(200).json(payment);
      } catch (error) {
        console.error('Error al obtener el pago:', error);
        res.status(500).json({ message: 'Error al obtener el pago' });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  }

