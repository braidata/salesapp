//prisma api connector
import { NextApiRequest, NextApiResponse } from 'next'

import { PrismaClient } from "@prisma/client";



//sending data to prisma
export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const data = req.body;

    const rut = JSON.parse(data).rut_pagador;
    const oId = JSON.parse(data).order_id;
    

    console.log("los pagos son:", data, "rut:", rut)

const prisma = new PrismaClient();

try {

const payment = await prisma.payments.findMany({where:{
     order_id: parseInt(oId)
}});


//generate a payment with order_id as an optional value to find in the where clause
// const payment = await prisma.payments.create({
//    data: {
//        order_id,
//        rut_pagador,
//        payment_amount,
//        payment_date,
//        payment_count,
//        authorization_code,
//        }
//    });


res.status(200).json({payment});}
catch{
console.log("error");
} finally {
    await prisma.$disconnect();
    }

}