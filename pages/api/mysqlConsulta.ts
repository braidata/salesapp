//prisma api connector
import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from "@prisma/client";

//sending data to prisma
export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const name = req.body.name ? req.body.name : null
    const email = req.body.email ? req.body.email : null

const prisma = new PrismaClient();

try {



const user = await prisma.users.findMany();
const orders = await prisma.orders.findMany();
const order_items = await prisma.order_items.findMany();
const payments = await prisma.payments.findMany();

console.log(user);

res.status(200).json({user, orders, order_items, payments});}
catch{
console.log("error");
}

}