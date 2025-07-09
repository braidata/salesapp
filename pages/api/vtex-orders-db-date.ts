import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    total: number;
    filtered: number;
    processing_time: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  const startTime = Date.now();

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const {
      startDate,
      endDate,
      status,
      page = '1',
      perPage = '1000'
    } = req.query;

    // Validate dates
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    // Build where clause
    const where = {
      AND: [
        {
          creation_date: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
          }
        },
        status ? { status: status as string } : {}
      ]
    };

    // Get total count for pagination
    const totalOrders = await prisma.vtex_orders.count({ where });

    // Get paginated orders, only select needed fields
    const orders = await prisma.vtex_orders.findMany({
      where,
      select: {
        vtex_order_id: true,
        creation_date: true,
        status: true
      },
      skip: (parseInt(page as string) - 1) * parseInt(perPage as string),
      take: parseInt(perPage as string),
      orderBy: {
        creation_date: 'desc'
      }
    });

    // Transform data to minimal format
    const transformedOrders = orders.map(order => ({
      orderId: order.vtex_order_id,
      creationDate: order.creation_date?.toISOString(),
      status: order.status
    }));

    const processingTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      data: transformedOrders,
      metadata: {
        total: totalOrders,
        filtered: transformedOrders.length,
        processing_time: processingTime
      }
    });

  } catch (error) {
    console.error('Database query error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error querying database'
    });
  } finally {
    await prisma.$disconnect();
  }
}