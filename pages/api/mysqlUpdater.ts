// pages/api/editDelete.js
import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const prisma = new PrismaClient();

    try {
        if (req.method === "PUT") {
            const { id, ...data } = req.body;
            const updatedOrder = await prisma.orders.update({
                where: { id },
                data,
            });
            res.status(200).json({ updatedOrder });
        } else if (req.method === "DELETE") {
            const { id } = req.body;
            await prisma.orders.delete({
                where: { id },
            });
            res.status(200).json({ message: "Order deleted successfully" });
        } else {
            res.status(405).json({ message: "Method not allowed" });  // Método no permitido
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });  // Error interno del servidor
    } finally {
        await prisma.$disconnect();
    }
}