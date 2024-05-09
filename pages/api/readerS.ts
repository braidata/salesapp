import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { key } = req.query;

    if (!key) {
      res.status(400).json({ error: 'Missing image key' });
      return;
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET as string,
      Key: key as string,
    };

    try {
      const url = await s3.getSignedUrlPromise('getObject', params);
      res.status(200).json({ url });
    } catch (error) {
      console.error('Error retrieving image:', error);
      res.status(500).json({ error: 'Error retrieving image' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}