import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { id, observation, status, validatedBy, order_date, team, banco_destino, imagenUrl, textoImg, rut_cliente, authorization_code } = req.body;

    // Obtener la fecha y hora actual y ajustar por GMT-4
    const now = new Date();
    now.setHours(now.getHours() - 4);
    const validation_date = now.toISOString().slice(0, 16).replace('T', ' ');

    // Actualizar el estado del pago
    const updatedPayment = await prisma.payments_validator.update({
      where: {
        id: id,
      },
      data: {
        observation,
        status,
        validation_date,
        validatedBy,
        authorization_code,
      },
    });

    res.status(200).json(updatedPayment);
  } else if (req.method === 'GET') {
    const order_id = req.query.id;
    const payments = await prisma.payments_validator.findMany({
      where: {
        order_id: Number(order_id),
        
      },
    });
    res.status(200).json(payments);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}