import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { id, observation, status, validatedBy, authorization_code } = req.body;

    try {
      // Obtener el estado actual de la orden
      const existingOrder = await prisma.orders.findUnique({
        where: { id },
      });

      if (!existingOrder) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }

      // Verificar si el cambio de estado a "Pagado" está permitido
      const statesNotAllowed = ['Pagado', 'Agendado', 'Procesado'];
      if (status === 'Pagado' && statesNotAllowed.includes(existingOrder.statusSAP)) {
        return res.status(400).json({ message: "No se puede cambiar el estado a Pagado para un pedido en estado Agendado, Procesado o Pagado" });
      }

      // Obtener la fecha y hora actual y ajustar por GMT-4
      const now = new Date();
      now.setHours(now.getHours() - 4);
      const validation_date = now.toISOString().slice(0, 19).replace('T', ' ');

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
    } catch (error) {
      console.error("Error al actualizar el pago:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    } finally {
      await prisma.$disconnect();
    }
  } else if (req.method === 'GET') {
    const order_id = req.query.id;
    try {
      const payments = await prisma.payments_validator.findMany({
        where: {
          order_id: Number(order_id),
        },
      });
      res.status(200).json(payments);
    } catch (error) {
      console.error("Error al obtener los pagos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}