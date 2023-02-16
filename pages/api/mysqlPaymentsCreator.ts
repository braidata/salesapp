//prisma api connector
import { NextApiRequest, NextApiResponse } from 'next'

import { PrismaClient, Prisma } from "@prisma/client";



//sending data to prisma
export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    let pagos: Prisma.paymentsCreateInput

    const data = req.body;

    const rut = JSON.parse(data).rut_pagador;
    const oId = JSON.parse(data).order_id;
    const monto = JSON.parse(data).payment_amount;
    const fecha = JSON.parse(data).payment_date;
    const count = JSON.parse(data).payment_count;
    const auth = JSON.parse(data).authorization_code;
    const method = JSON.parse(data).payment_method;
    

    console.log("los pagos son:", data, "rut:", rut)

const prisma = new PrismaClient();

try {

// const payment = await prisma.payments.findMany({where:{
//      order_id: parseInt(oId)
// }});

//interfaz para data in the create


//interfaz para data in the create
//datos para el pago

//datos para el pago
pagos = {
    orders: oId,
    rut_pagador: rut,
    payment_amount: monto,
    payment_date: fecha,
    payment_count: count,
    authorization_code: auth,
    method: method
}



//create a new payment in the database

const payment = await prisma.payments.create({
    data:  pagos
    });






res.status(200).json({payment});}
catch{
console.log("error");
} finally {
    await prisma.$disconnect();
    }

}

