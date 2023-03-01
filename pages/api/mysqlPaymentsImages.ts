import sharp from "sharp"    // npm install sharp

import { PrismaClient } from '@prisma/client';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const paymentId = req.body.order_id;
  const imagen = req.body.imagen;

  if (!paymentId || !imagen) {
    return res.status(400).json({ message: 'Faltan parámetros' });
  }

  const nombreArchivo = `payment_${paymentId}.webp`;
  const rutaArchivo = path.join(process.cwd(), 'uploads', nombreArchivo);

  // Comprime y ajusta el tamaño de la imagen a un ancho máximo de 800 píxeles y la guarda en formato WebP
  await sharp(imagen.buffer)
    .resize({ width: 800 })
    .webp({ quality: 80 })
    .toFile(rutaArchivo);

  // Actualiza la URL de la imagen en la base de datos del pago
  const payment = await prisma.payments.update({
    where: { order_id: paymentId },
    data: { imagenUrl: `/uploads/${nombreArchivo}` },
  });

  // Retorna la URL de la imagen para su uso en el front-end
  return res.status(200).json({ imagenUrl: payment.imagenUrl });
}