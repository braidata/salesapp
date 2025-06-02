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
      perPage = '100',
      includeItems = 'true',
      includePayments = 'true'
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

    // Get paginated orders with relations
    const orders = await prisma.vtex_orders.findMany({
      where,
      include: {
        vtex_order_items: includeItems === 'true',
        vtex_order_payments: includePayments === 'true'
      },
      skip: (parseInt(page as string) - 1) * parseInt(perPage as string),
      take: parseInt(perPage as string),
      orderBy: {
        creation_date: 'desc'
      }
    });

    // Transform data to match VTEX API format
    const transformedOrders = orders.map(order => ({
      orderId: order.vtex_order_id,
      sequence: order.sequence,
      status: order.status,
      statusDescription: order.status_description,
      value: Number(order.total_value) * 100, // Convert to cents
      creationDate: order.creation_date?.toISOString(),
      lastChange: order.last_change?.toISOString(),
      authorizedDate: order.authorized_date?.toISOString(),
      invoicedDate: order.invoiced_date?.toISOString(),
      isCompleted: order.is_completed,

      clientProfileData: {
        email: order.customer_email,
        firstName: order.customer_first_name,
        lastName: order.customer_last_name,
        document: order.customer_document,
        phone: order.customer_phone,
        isCorporate: order.customer_is_corporate
      },

      items: order.vtex_order_items?.map(item => ({
        uniqueId: item.vtex_unique_id,
        id: item.product_id,
        productId: item.product_id,
        name: item.product_name,
        refId: item.ref_id,
        quantity: item.quantity,
        price: Number(item.unit_price) * 100, // Convert to cents
        listPrice: Number(item.unit_price) * 100,
        sellingPrice: Number(item.selling_price) * 100,
        additionalInfo: {
          brandName: item.brand_name
        }
      })),

      paymentData: {
        transactions: [{
          payments: order.vtex_order_payments?.map(payment => ({
            paymentSystemName: payment.payment_system_name,
            value: Number(payment.payment_value) * 100, // Convert to cents
            installments: payment.installments
          }))
        }]
      },

      // Include raw data if available
      raw_vtex_data: order.raw_vtex_data
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