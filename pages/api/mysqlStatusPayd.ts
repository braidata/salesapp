// pages/api/updateOrderStatus.ts
import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    const prisma = new PrismaClient();

    try {
        const { id } = req.query as { id: string };
        const { newStatus } = req.body as { newStatus: string };

        const existingOrder = await prisma.orders.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingOrder) {
            return res.status(404).json({ message: "Orden no encontrada" });
        }

        // Verifica el estado actual de la orden
        const { statusSAP } = existingOrder;
        const statusesNotAllowed = ["Pagado", "Agendado", "Procesado"];

        if (newStatus === "Pagado" && statusesNotAllowed.includes(statusSAP)) {
            return res.status(400).json({ message: `No se puede cambiar el estado a Pagado. El estado actual es ${statusSAP}.` });
        }

        // Actualiza el estado
        const updatedOrder = await prisma.orders.update({
            where: { id: parseInt(id) },
            data: {
                statusSAP: newStatus,
            },
        });

        const nuevoEstado = updatedOrder.statusSAP;

        console.log(`Orden ${id} actualizada a estado: ${nuevoEstado}`);
        res.status(200).json({ estado: nuevoEstado });

    } catch (error) {
        console.error("Error al actualizar la orden:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    } finally {
        await prisma.$disconnect();
    }
}