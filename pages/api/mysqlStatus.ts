// pages/api/mysqlUpdater.ts
import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {

    const prisma = new PrismaClient();

    try {
        const { id } = req.query as { id: string};
        const existingOrder = await prisma.orders.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        const updatedOrder = await prisma.orders.update({
            where: { id: parseInt(id) },
            data: {
                
                statusSAP: "Error SAP",

                
            },
        });
        
        const datos  = updatedOrder.statusSAP
        
        //console log statusSAP
        console.log(datos);
        res.status(200).json({ datos});
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        await prisma.$disconnect();
    }
}
