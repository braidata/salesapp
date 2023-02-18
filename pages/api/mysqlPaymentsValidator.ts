//payments validator, writes status, date of a validation ond observations
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse,
// ) {
  
//     try {
//       const { id, validation_date, status, observation } = req.body;
//       //modifica entrada existente según id
//       const newPayment = await prisma.payments.update({
//         where: {
//             id: parseInt(id) ? parseInt(id) : 156,
//             },
//         data: {
//             validation_date: validation_date ? validation_date : new Date(),
//             status : status ? status : 'no validado',
//             observation: observation ? observation : 'sin observaciones',
//             },
//         });
//       res.status(201).json(newPayment);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Error updating payment' });
//     }finally {
//         await prisma.$disconnect();
//         }
  
// }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  try {

  
    //const { id, validation_date, status, observation } = req.body;
    const data = req.body;

    const id = JSON.parse(data).idi;
    const validation_date = JSON.parse(data).validation_date;
    const status = JSON.parse(data).status;
    const observation = JSON.parse(data).observacion;



  

    const updatedPayment = await prisma.payments.update({
      where: { id: Number(id) },
      data: {
        validation_date: validation_date,
        status: status ,
        observation: observation ,
      },
    });

    res.json(updatedPayment);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating payment' });
  } finally {
    console.log("finally")
    await prisma.$disconnect();


}

}

