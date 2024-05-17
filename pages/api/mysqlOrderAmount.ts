import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { order_id } = req.method === 'POST' ? req.body : req.query;

  if (!order_id) {
    res.status(400).json({ message: 'Missing order_id parameter' });
    return;
  }

  try {
    const order = await prisma.orders.findUnique({
      where: { id: parseInt(order_id as string) },
      select: {
        order_items: {
          select: {
            price: true,
            quantity: true,
          },
        },
      },
    });

    const totalPedido = order?.order_items.reduce((total: number, item: { price: any; quantity: string }) => {
      const price = parseFloat(item.price || '0');
      const quantity = parseInt(item.quantity);
      const ivaChileno = 1.19; // IVA chileno del 19%
      const totalConIva = total + price * quantity * ivaChileno;
      return Math.round(totalConIva / 10) * 10; // Truncar los decimales para que el número termine en cero
    }, 0);

    res.status(200).json({ total_pedido: totalPedido || 0 });
  } catch (error) {
    console.error('Error al obtener el total del pedido:', error);
    res.status(500).json({ message: 'Error al obtener el total del pedido' });
  }
}