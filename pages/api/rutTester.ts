import { validateRUT, getCheckDigit, generateRandomRUT } from "validar-rut";
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import authOptions from "./auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // ⚠️ Reemplazar con tu dominio en producción
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end(); // Preflight OK
    return;
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const rut = req.query.rut as string;
  const isValid = validateRUT(rut);
  const checkDigit = getCheckDigit(rut);
  res.status(200).json({ rut, isValid, checkDigit });
}
