// pages/api/mysqlUpdater.ts
import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    // if (req.method !== "PUT") {
    //     return res.status(405).json({ message: "Method not allowed" });
    // }

    const prisma = new PrismaClient();

    try {
        const { id } = req.query as { id: string };
        const existingOrder = await prisma.orders.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        const updatedOrder = await prisma.orders.update({
            where: { id: parseInt(id) },
            data: {
                status: "0",
                statusSAP: "Borrado",
                //verifica que el dealId no tenga " ELIMINADO" al final
                dealId: existingOrder.dealId.includes(" ELIMINADO") ? existingOrder.dealId :
                existingOrder.dealId + " ELIMINADO", // Concatenando "delete" al dealId existente
                
            },
        });

        res.status(200).json({ updatedOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        await prisma.$disconnect();
    }
}

