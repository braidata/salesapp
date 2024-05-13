import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
      const { order_id } = req.body;
  
      try {
        const paymentsValidated = await prisma.payments_validator.findMany({
          where: {
            order_id: parseInt(order_id),
            status: 'Validado',
          },
        });
  
        const totalValidado = paymentsValidated.reduce((total, payment) => {
          const paymentAmount = parseFloat(payment.payment_amount || '0');
          return total + paymentAmount;
        }, 0);
  
        res.status(200).json({ total_validado: totalValidado });
      } catch (error) {
        console.error('Error al obtener el total validado:', error);
        res.status(500).json({ message: 'Error al obtener el total validado' });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  }