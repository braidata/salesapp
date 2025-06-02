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
            perPage = '50',
            includeItems = 'true'
        } = req.query;

        // Build where clause
        const where = {
            AND: [
                // If specific purchase order is requested
                purchaseOrder ? { purchase_order: purchaseOrder as string } : {},
                // Date range if provided
                startDate && endDate ? {
                    creation_date: {
                        gte: new Date(startDate as string),
                        lte: new Date(endDate as string)
                    }
                } : {}
            ]
        };

        // Get total count for pagination
        const totalOrders = await prisma.sap_orders.count({ where });

        // Get paginated orders with relations
        const orders = await prisma.sap_orders.findMany({
            where,
            include: {
                sap_order_items: includeItems === 'true'
            },
            skip: (parseInt(page as string) - 1) * parseInt(perPage as string),
            take: parseInt(perPage as string),
            orderBy: {
                creation_date: 'desc'
            }
        });

        // Transform dates and format response
        const transformedOrders = orders.map(order => ({
            purchaseOrder: order.purchase_order,
            sapOrder: order.sap_order,
            customer: order.customer_code,
            creationDate: order.creation_date ? adjustTimeZone(order.creation_date.toISOString()) : null,
            status: order.status,
            statusCode: order.status_code,
            totalAmount: order.total_amount,
            documentType: order.document_type,
            documentTypeText: order.document_type_text,
            document: order.document_number,
            febosFC: order.febos_fc,
            items: order.sap_order_items?.map(item => ({
                sku: item.sku,
                name: item.product_name,
                quantity: item.quantity,
                amount: item.amount
            })) || [],
            rawData: order.raw_sap_data
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