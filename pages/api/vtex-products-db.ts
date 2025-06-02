import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const {
      page = '1',
      perPage = '50',
      categoryId,
      brandId
    } = req.query;

    const where = {
      ...(categoryId ? { category_id: categoryId as string } : {}),
      ...(brandId ? { brand_id: brandId as string } : {})
    };

    const [total, products] = await Promise.all([
      prisma.vtex_products.count({ where }),
      prisma.vtex_products.findMany({
        where,
        skip: (parseInt(page as string) - 1) * parseInt(perPage as string),
        take: parseInt(perPage as string),
        orderBy: {
          name: 'asc'
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      data: products,
      metadata: {
        total,
        page: parseInt(page as string),
        perPage: parseInt(perPage as string),
        pageCount: Math.ceil(total / parseInt(perPage as string))
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