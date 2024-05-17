import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const paymentId = parseInt(req.query.id as string);

    try {
      const deletedPayment = await prisma.payments_validator.update({
        where: {
          id: paymentId,
        },
        data: {
          status: 'Borrado',
        },
      });

      res.status(200).json(deletedPayment);
    } catch (error) {
      console.error('Error al eliminar el pago:', error);
      res.status(500).json({ message: 'Error al eliminar el pago' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}