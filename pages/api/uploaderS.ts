import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const upload = multer({
  storage: multer.memoryStorage(),
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    upload.single('file')(req as unknown as Request, res as any, async (err) => {
      if (err) {
        console.error('Error parsing form:', err);
        res.status(500).json({ error: 'Error parsing form' });
        return;
      }

      const file = (req as any).file;
      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const fileName = `${uuidv4()}_${file.originalname}`;

      const params = {
        Bucket: process.env.AWS_S3_BUCKET as string,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      try {
        await s3.upload(params).promise();
        res.status(200).json({ message: 'File uploaded successfully', imageKey: fileName });
      } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Error uploading file' });
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}