//prisma api connector
import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from "@prisma/client";

//sending data to prisma
export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    
    const email: string = req.body.email ? req.body.email : "null"

const prisma = new PrismaClient();

try {



const user = await prisma.users.findMany({where:{email: email}, select: {permissions: true, rol: true}});
//agregale un select a esto const user = await prisma.users.findMany({where:{email: email}});
//const user = await prisma.users.findMany({where:{email: email}, select: {id: true, name: true, email: true, password: true, role: true, createdAt: true, updatedAt: true}});



//console.log(user);

res.status(200).json({user });}
catch{
console.log("error");
} finally {
    await prisma.$disconnect();
    }

}