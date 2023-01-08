//prisma api connector
import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from "@prisma/client";

//sending data to prisma
export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const password: string = req.body.password ? req.body.password : null
    const email: string = req.body.useremail ? req.body.useremail : "nsalgado@imega.cl"

const prisma = new PrismaClient();

try {



const user = await prisma.users.findMany({where:{email: email, password: password}});



console.log(user);

res.status(200).json({user});}
catch{
console.log("error");
}

}