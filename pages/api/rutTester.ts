import { validateRUT, getCheckDigit, generateRandomRUT } from "validar-rut";
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next"
import  authOptions  from "./auth/[...nextauth]"



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions)

    
    
    if (!session) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    else {

    const rut = req.query.rut as string;
    const isValid = validateRUT(rut);
    const checkDigit = getCheckDigit(rut);
    res.status(200).json({ rut, isValid, checkDigit });
    }
}
