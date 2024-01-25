import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const apiKey = process.env.KEY_ENVIAME;

  if (!apiKey) {
    res.status(500).json({ error: 'API key is not set in environment variables' });
    return;
  }

  try {
    const params = {
      weight: 1,
      from_place: 'Santiago',
      to_place: 'La serena',
      carrier: 'SKN',
      service: 'nextday',
      length: 12,
      height: 25,
      width: 30,
    };

    const response = await axios.get('https://api.enviame.io/api/v1/prices', {
      params,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: 'An error occurred', details: error.message });
  }
};
