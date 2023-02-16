import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'POST') {
    try {
      const { order_id, method, rut_pagador, authorization_code, payment_count, payment_amount, payment_date } = req.body;
      const newPayment = await prisma.payments.create({
        data: {
          order_id: parseInt(order_id),
          method,
          rut_pagador,
          authorization_code,
          payment_count,
          payment_amount,
          payment_date,
          },
      });
      res.status(201).json(newPayment);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error creating payment' });
    }finally {
        await prisma.$disconnect();
        }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}