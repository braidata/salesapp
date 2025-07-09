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

// Helper para obtener status SAP externo
async function fetchStatusSAP(purchaseOrder: string) {
    try {
        const url = `https://test-ventus-sales.ventuscorp.cl/api/apiSAPEstados?REFCLIENTE=${encodeURIComponent(purchaseOrder)}`;
        console.log('🌐 Consultando status_SAP:', url);
        const resp = await fetch(url, { timeout: 5000 });
        if (!resp.ok) {
            console.warn(`⚠️ status_SAP no encontrado para ${purchaseOrder}: ${resp.status}`);
            return null;
        }
        const data = await resp.json();
        console.log('✅ status_SAP response:', data);
        return data;
    } catch (err) {
        console.error('❌ Error consultando status_SAP:', err);
        return null;
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        console.log('❌ Method not allowed:', req.method);
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
            perPage = '5000'
        } = req.query;

        console.log('🔎 Params:', { startDate, endDate, status, page, perPage });

        if (!startDate || !endDate) {
            console.log('❌ Falta startDate o endDate');
            return res.status(400).json({
                success: false,
                error: 'startDate and endDate are required'
            });
        }

        // --- VTEX ---
        const vtexWhere = {
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

        console.log('🔎 VTEX where:', JSON.stringify(vtexWhere, null, 2));

        const vtexOrders = await prisma.vtex_orders.findMany({
            where: vtexWhere,
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

        console.log(`🔎 VTEX orders encontrados: ${vtexOrders.length}`);
        if (vtexOrders.length > 0) {
            console.log('🔎 Primeros VTEX orders:', vtexOrders.slice(0, 3));
        }

        // Buscar todos los SAP que correspondan a los vtex_order_id encontrados
        const vtexIds = vtexOrders.map(o => o.vtex_order_id);
        console.log('🔎 vtexIds extraídos:', vtexIds);

        const sapOrders = await prisma.sap_orders.findMany({
            where: {
                purchase_order: { in: vtexIds }
            },
            select: {
                purchase_order: true,
                sap_order: true,
                created_at: true,
                updated_at: true,
                status: true,
                status_code: true
            }
        });

        console.log(`🔎 SAP orders encontrados: ${sapOrders.length}`);
        if (sapOrders.length > 0) {
            console.log('🔎 Primeros SAP orders:', sapOrders.slice(0, 3));
        }

        // Indexar SAP por purchase_order
        const sapByPurchaseOrder: Record<string, any> = {};
        for (const sap of sapOrders) {
            sapByPurchaseOrder[sap.purchase_order] = sap;
        }

        // Verificación de coincidencias
        let matchCount = 0;
        for (const vtexId of vtexIds) {
            if (sapByPurchaseOrder[vtexId]) {
                matchCount++;
                console.log(`✅ Coincidencia: vtex_order_id ${vtexId} <-> purchase_order SAP`);
            }
        }
        console.log(`🔎 Total coincidencias VTEX-SAP: ${matchCount} de ${vtexIds.length}`);

        // Unificar datos respetando nombres originales y agregando status_SAP
        const unifiedOrders = await Promise.all(
            vtexOrders.map(async order => {
                const sap = sapByPurchaseOrder[order.vtex_order_id] || null;
                let status_SAP = null;
                if (sap) {
                    status_SAP = await fetchStatusSAP(sap.purchase_order);
                }
                return {
                    vtex_order_id: order.vtex_order_id,
                    creation_date: order.creation_date,
                    status: order.status,
                    sap: sap
                        ? {
                            purchase_order: sap.purchase_order,
                            sap_order: sap.sap_order,
                            created_at: sap.created_at,
                            updated_at: sap.updated_at,
                            status: sap.status,
                            status_code: sap.status_code
                        }
                        : null,
                    status_SAP: status_SAP || null
                };
            })
        );

        if (unifiedOrders.length > 0) {
            console.log('🔎 Primeros unifiedOrders:', unifiedOrders.slice(0, 3));
        }

        return res.status(200).json({
            success: true,
            data: {
                orders: unifiedOrders
            },
            metadata: {
                total: unifiedOrders.length,
                page: parseInt(page as string),
                perPage: parseInt(perPage as string)
            }
        });

    } catch (error) {
        console.error('❌ Database query error:', error);
        return res.status(500).json({
            success: false,
            error: 'Error querying database'
        });
    } finally {
        await prisma.$disconnect();
    }
}