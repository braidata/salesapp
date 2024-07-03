// pages/api/mysqlGetOrderStatus.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid order ID' });
  }

  try {
    const order = await prisma.orders.findUnique({
      where: { id: parseInt(id) },
      select: { statusSAP: true }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ status: order.statusSAP });
  } catch (error) {
    console.error('Error fetching order status:', error);
    res.status(500).json({ message: 'Error fetching order status' });
  } finally {
    await prisma.$disconnect();
  }
}