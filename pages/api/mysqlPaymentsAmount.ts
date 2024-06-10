import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { order_id } = req.body;

    try {
      const payments = await prisma.payments_validator.findMany({
        where: {
          order_id: parseInt(order_id),
          NOT: {
            status: {
              in: ['Borrado', 'Rechazado'],
            },
          },
        },
        select: {
          payment_amount: true,
        },
      });

      const totalPagado = payments.reduce((total, payment) => {
        const amount = parseFloat(payment.payment_amount || '0');
        return total + amount;
      }, 0);

      res.status(200).json({ total_pagado: totalPagado });
    } catch (error) {
      console.error('Error al obtener el total pagado:', error);
      res.status(500).json({ message: 'Error al obtener el total pagado' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}