//prisma api connector
import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from "@prisma/client";

//sending data to prisma
export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const name = req.body.name ? req.body.name : null
    const email = req.body.email ? req.body.email : null
    const id = req.body.id ? req.body.id : null
    

    const prisma = new PrismaClient();

    try {

        //const userdos = await prisma.users.findMany()

        const user = await prisma.users.findMany(


            {
                select: {
                    id: true,
                    rol: true,
                    permissions: true,
                },


                where: {
                    id: id,
                    name: name,
                    email: email
                },

                
            }

        );
        /**
         * await prisma.orders.findMany({
          select: {
            "id": true,
              "customer_name" : true,
            "customer_last_name": true,
          "customer_email" : true,
          "payments" : true,
          "order_items": true,
          "user": true,
          },
          take: 100
        })
         */
        const orders = await prisma.orders.findMany(
            {

                select: {
                    "id": true,
                    "order_date": true,
                    "customer_name": true,
                    "customer_last_name": true,
                    "customer_email": true,
                    "customer_phone": true,
                    "customer_rut": true,
                    "Shipping_Fecha_de_Despacho_o_Retiro": true,
                    "payments": true,
                    "order_items": true,
                    "user": true,
                    "statusSAP": true,
                    "billing_company_name": true,
                    "respuestaSAP": true,
                    "dealId": true,

                },
                where: {
                    user: email,
                },

                orderBy: {
                    order_date: 'desc',  // Ordena las órdenes por fecha en orden descendente
                },
            }
        );
        //const order_items = await prisma.order_items.findMany();
        //const payments = await prisma.payments.findMany();

        console.log(user);

        res.status(200).json({ orders });
    }
    catch {
        console.log("error");
    } finally {
        await prisma.$disconnect();
    }

}

//order_items, payments