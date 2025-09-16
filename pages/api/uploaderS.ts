// pages/api/uploaderS.ts
import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
});

const upload = multer({ storage: multer.memoryStorage() });
export const config = { api: { bodyParser: false } };

// Promisificar multer para que Next espere la respuesta
function runMulter(req: NextApiRequest, res: NextApiResponse) {
  return new Promise<void>((resolve, reject) => {
    upload.single('file')(req as unknown as Request, res as any, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await runMulter(req, res);
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const folder = (req.query.folder as string | undefined)?.replace(/^\/+|\/+$/g, '');
    const fileName = `${uuidv4()}_${file.originalname}`;
    const Key = folder ? `${folder}/${fileName}` : fileName;
    const Bucket = process.env.AWS_S3_BUCKET as string;
    const Region = process.env.AWS_REGION as string;

    // Subir SIN ACL (Object Ownership: Bucket owner enforced)
    await s3
      .upload({
        Bucket,
        Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // NO ACL aquí
      })
      .promise();

    // URL pública (funciona si tu política permite GetObject)
    const publicBase =
      process.env.AWS_S3_PUBLIC_BASE_URL || `https://${Bucket}.s3.${Region}.amazonaws.com`;
    const url = `${publicBase}/${Key}`;

    // Presigned URL de respaldo por si aún no está pública
    const presignedUrl = s3.getSignedUrl('getObject', { Bucket, Key, Expires: 60 * 60 }); // 1h

    return res.status(200).json({
      message: 'File uploaded successfully',
      key: Key,
      url,            // pública (si la política lo permite)
      presignedUrl,   // respaldo inmediato
    });
  } catch (error: any) {
    console.error('S3 uploader error:', error);
    return res.status(500).json({ error: 'Error uploading file' });
  }
}
