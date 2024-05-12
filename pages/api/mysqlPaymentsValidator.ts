import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { id,    observation, status, order_date, team, banco_destino, imagenUrl, textoImg, rut_cliente } = req.body;

    // Obtener la fecha y hora actual
    const validation_date = new Date().toString();

    // Actualizar el estado del pago
    const updatedPayment = await prisma.payments_validator.update({
      where: {
        id: id,
      },
      data: {
        observation,
        status,
        validation_date,
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
