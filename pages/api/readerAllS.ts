import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET as string,
    };

    try {
      const data = await s3.listObjectsV2(params).promise();

      const images = data.Contents?.map((obj) => ({
        key: obj.Key,
        url: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${obj.Key}`,
      }));

      res.status(200).json({ images });
    } catch (error) {
      console.error('Error retrieving images:', error);
      res.status(500).json({ error: 'Error retrieving images' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}