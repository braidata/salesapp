import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const prisma = new PrismaClient();

    try {
        switch (req.query.method) {
            case 'GET':
                const date = req.query.date as string;
                const orders = await prisma.orders.findMany({
                    select: {
                        "id": true,
                        "customer_name": true,
                        "customer_last_name": true,
                        "customer_email": true,
                        "customer_phone": true,
                        "billing_commune": true,
                        "billing_street": true,
                        "billing_number": true,
                        "billing_department": true,
                        "billing_company_name": true,
                        "Shipping_commune": true,
                        "Shipping_street": true,
                        "Shipping_number": true,
                        "Shipping_department": true,
                        "Shipping_Fecha_de_Despacho_o_Retiro": true,
                        "Shipping_Observacion": true,
                    },
                    where: {
                        Shipping_Fecha_de_Despacho_o_Retiro: date,
                    }
                });
                res.status(200).json({ orders });
                break;

                case 'PUT':
                    const id = Number(req.query.id);
                    const newDate = req.query.newDate as string;
    
                    const updatedOrder = await prisma.orders.update({
                        where: { id: id },
                        data: {
                            Shipping_Fecha_de_Despacho_o_Retiro: newDate
                        }
                    });
                    res.status(200).json({ updatedOrder });
                    break;
    
                default:
                    res.setHeader('Allow', ['GET', 'PUT']);
                    res.status(405).end(`Method ${req.query.method} Not Allowed`);
            }
        } catch (error) {
            console.log("error", error);
            res.status(500).json({ error: "Unexpected error." });
        } finally {
            await prisma.$disconnect();
        }
    }