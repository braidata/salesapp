// pages/api/generate-token.ts
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ventus-secreto-super-seguro-2024';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    // Generar token
    const token = jwt.sign(
      {
        authorized: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 días
      },
      JWT_SECRET
    );

    console.log('Secret usado:', JWT_SECRET); // Para debugging
    console.log('Token generado:', token);

    return res.status(200).json({
      success: true,
      token
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al generar el token'
    });
  }
}