import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const name = req.body.name ? req.body.name : null;
  const email = req.body.email ? req.body.email : null;
  const id = req.body.id ? req.body.id : null;
  const companyName = req.body.companyName ? req.body.companyName : null;

  const prisma = new PrismaClient();

  try {
    const user = await prisma.users.findMany({
      select: {
        id: true,
        rol: true,
        permissions: true,
      },
      where: {
        id: id,
        name: name,
        email: email,
      },
    });

    const where = {
      user: email,
      ...(companyName && { billing_company_name: companyName }),
    };

    const orders = await prisma.orders.findMany({
      select: {
        "id": true,
        "order_date": true,
        "customer_name": true,
        "customer_last_name": true,
        "customer_email": true,
        "customer_phone": true,
        "customer_rut": true,
        "Shipping_Fecha_de_Despacho_o_Retiro": true,
        "Shipping_Tipo_de_Despacho": true,
        "payments": true,
        "order_items": true,
        "user": true,
        "statusSAP": true,
        "billing_company_name": true,
        "billing_company_rut": true,
        "respuestaSAP": true,
        "dealId": true,
      },
      where,
      orderBy: {
        order_date: 'desc',
      },
    });

    console.log(user);
    res.status(200).json({ orders });
  } catch {
    console.log("error");
  } finally {
    await prisma.$disconnect();
  }
}