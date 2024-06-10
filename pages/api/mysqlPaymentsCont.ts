import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'PUT') {
    try {
      const { id, textoImg, team, rut_pagador, observation, editedBy, payment_amount, payment_date, banco_destino, imagenUrl, contId } = req.body;
      const updatedPayment = await prisma.payments_validator.update({
        where: { id: parseInt(id) },
        data: {
          payment_date,
          rut_pagador, 
          banco_destino,
          imagenUrl,
          textoImg,
          team,
          payment_amount,
          observation,
          editedBy, // Usar createdBy aquí
          contId,
        },
      });
      res.status(200).json(updatedPayment);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error updating payment' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}