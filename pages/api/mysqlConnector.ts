//prisma api connector
import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from "@prisma/client";

//sending data to prisma
export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const name = req.body.name ? req.body.name : null
    const email = req.body.email ? req.body.email : null
    const ownerId = req.body.ownerId ? req.body.ownerId : null

const prisma = new PrismaClient();

try {

const user2 = await prisma.users.create({

    data: {
    
    name,
    
    email,

    ownerId
    
    }})

const user = await prisma.users.findMany();

console.log(user2);

res.status(200).json(user);}
catch{
console.log("error");
} finally {
    await prisma.$disconnect();
    }

}

// //receiving data from prisma


// export default async function handler(req: NextApiRequest, res: NextApiResponse) {

// const prisma = new PrismaClient();

// const user = await prisma.users.findMany();

// console.log(user);

// res.status(200).json(user);

// }

// //prisma api connector

// import { NextApiRequest, NextApiResponse } from 'next'

// import { PrismaClient } from "@prisma/client";

// //sending data to prisma

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {

//     const nombre = req.body.nombre
//     const mail = req.body.mail

// const prisma = new PrismaClient();

// const user = await prisma.users.findMany();

// const user2 = await prisma.users.create(

// const prismaConnector = async (nombre: any, mail: any) => {

// const prisma = new PrismaClient();



// try{

// const user = await prisma.users.findMany();

// const user2 = await prisma.users.create({

//     data: {
    
//     name: {nombre},
    
//     email: {mail}
    
//     }})




// console.log(user);
// return;}

// catch(e){

// console.log(e);

// }

// }







 
















