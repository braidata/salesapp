//prisma api connector
import { NextApiRequest, NextApiResponse } from 'next'

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

//sending data to prisma
export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const data = req.body;
    const oId = data.order_id || req.query.id;
    

    console.log("los pagos son:", data)



try {

const payment = await prisma.payments_validator.findMany({where:{
     order_id: parseInt(oId)
}});





res.status(200).json({payment});}
catch{
console.log("error");
} finally {
    await prisma.$disconnect();
    }

}