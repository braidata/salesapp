import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const adjustTimeZone = (dateString: string): string => {
    if (!dateString) return dateString;
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        date.setHours(date.getHours() - 4);
        return date.toISOString();
    } catch (error) {
        console.warn('Error adjusting timezone:', error);
        return dateString;
    }
};

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
            startDate,
            endDate,
            purchaseOrder,
            page = '1',
            perPage = '50'
        } = req.query;

        // Build where clause
        const where = {
            AND: [
                purchaseOrder ? { purchase_order: purchaseOrder as string } : {},
                startDate && endDate ? {
                    created_at: {
                        gte: new Date(startDate as string),
                        lte: new Date(endDate as string)
                    }
                } : {}
            ]
        };

        // Get total count for pagination
        const totalOrders = await prisma.sap_orders.count({ where });

        // Get paginated orders, only select needed fields
        const orders = await prisma.sap_orders.findMany({
            where,
            select: {
                purchase_order: true,
                sap_order: true,
                created_at: true,
                updated_at: true,
                status: true,
                status_code: true,
                // vtex_order_id: true, // Descomenta si tienes este campo en tu modelo
            },
            skip: (parseInt(page as string) - 1) * parseInt(perPage as string),
            take: parseInt(perPage as string),
            orderBy: {
                created_at: 'desc'
            }
        });

        // Transform dates and format response
        const transformedOrders = orders.map(order => ({
            purchaseOrder: order.purchase_order,
            sapOrder: order.sap_order,
            creationDate: order.created_at ? adjustTimeZone(order.created_at.toISOString()) : null,
            lastChange: order.updated_at ? adjustTimeZone(order.updated_at.toISOString()) : null,
            status: order.status,
            statusCode: order.status_code,
            // vtexOrderId: order.vtex_order_id || null, // Descomenta si tienes este campo
        }));

        return res.status(200).json({
            success: true,
            data: transformedOrders,
            metadata: {
                total: totalOrders,
                filtered: transformedOrders.length,
                page: parseInt(page as string),
                perPage: parseInt(perPage as string),
                pageCount: Math.ceil(totalOrders / parseInt(perPage as string))
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