//prisma api connector
import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from "@prisma/client";

//sending data to prisma
export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const date = req.body.date ? req.body.date : req.query.date
    

    const prisma = new PrismaClient();

    try {
        const orders = await prisma.orders.findMany(
            {

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
                    "Shipping_Tipo_de_Despacho": true,
                    "Shipping_Observacion": true,
                    "order_date": true,
                    "respuestaSAP": true,
                    "statusSAP": true,
                    "order_class": true,
                    "user": true,
                    
                },
                where: {
                    Shipping_Fecha_de_Despacho_o_Retiro: date,
                    statusSAP: {
                        in: ['Facturar'],
                      },

                }
            }
        );
        res.status(200).json({ orders });
    }
    catch {
        console.log("error");
    } finally {
        await prisma.$disconnect();
    }

}