// pages/api/mysqlStatusProcesando.ts
import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        const { id } = req.query as { id: string };
        if (!id) {
            return res.status(400).json({ message: 'ID de la orden es requerido' });
        }

        const existingOrder = await prisma.orders.findUnique({
            where: { id: parseInt(id) },
        });

        if (!existingOrder) {
            return res.status(404).json({ message: "Orden no encontrada" });
        }

        // Lista de estados que no deben ser cambiados
        const estadosNoModificables = ["Facturar", "Facturado", "Prefacturar"];

        // Verifica si el estado actual está en la lista de estados no modificables
        if (estadosNoModificables.includes(existingOrder.statusSAP)) {
            console.log(`Orden ${id} no actualizada. Estado actual: ${existingOrder.statusSAP}`);
            return res.status(200).json({ message: "Estado no cambiado", estado: existingOrder.statusSAP });
        }

        // Si el estado no está en la lista de no modificables, procede con la actualización
        const updatedOrder = await prisma.orders.update({
            where: { id: parseInt(id) },
            data: {
                statusSAP: "Procesando",
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
