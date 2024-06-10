import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'POST') {
    try {
      const { order_id, order_date, textoImg, team, rut_pagador, observation, status, payment_amount, payment_date, rut_cliente, banco_destino, imagenUrl, createdBy, sapId } = req.body;
      const newPayment = await prisma.payments_validator.create({
        data: {
          order_id: parseInt(order_id),
          order_date,
          payment_date,
          rut_cliente,
          rut_pagador, 
          sapId,
          banco_destino,
          imagenUrl,
          textoImg,
          team,
          payment_amount,
          observation,
          status,
          createdBy,
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