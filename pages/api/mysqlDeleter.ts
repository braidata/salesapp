// pages/api/editOrder.ts
import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    try {
        if (req.method === "PUT") {
            const { id, ...data } = req.body as { id: number; dealId: string };

            // Generar un número aleatorio de dos dígitos
            const randomTwoDigitNumber: number = Math.floor(Math.random() * 90 + 10);

            const updatedOrder = await prisma.orders.update({
                where: { id },
                data: {
                    ...data,
                    status: "0", // Cambiar status a 1
                    dealId: `${data.dealId}${randomTwoDigitNumber}`, // Concatenar número aleatorio a dealId
                },
            });
            res.status(200).json({ updatedOrder });
        } else {
            res.status(405).json({ message: "Method not allowed" }); // Método no permitido
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" }); // Error interno del servidor
    } finally {
        await prisma.$disconnect();
    }
}
