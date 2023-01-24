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


    {   select: {
        id: true,
        rol: true,
        permissions: true,
        },


        where: {
            id: id,
            name: name,
            email: email
        }
    }

);
const orders = await prisma.orders.findMany(
    {
        where: {
            user: email,
        }
    }
);
//const order_items = await prisma.order_items.findMany();
//const payments = await prisma.payments.findMany();

console.log(user);

res.status(200).json({user, orders});}
catch{
console.log("error");
}finally {
    await prisma.$disconnect();
    }

}

//order_items, payments