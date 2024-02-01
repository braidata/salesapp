import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

// Asegúrate de que Next.js pueda parsear el cuerpo JSON
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Ajusta según tus necesidades
    },
  },
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const apiKey = process.env.KEY_ENVIAME;
  if (!apiKey) {
    res.status(500).json({ error: 'API key is not set in environment variables' });
    return;
  }

  // Asegurarte de que la solicitud sea un método POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Extraer datos del cuerpo de la solicitud
  const { weight, from_place, to_place, carrier, service, length, height, width } = req.body;

  try {
    const response = await axios.get(`https://stage.api.enviame.io/api/v1/prices?weight=${weight}&from_place=${from_place}&to_place=${to_place}&carrier=${carrier}&service=${service}&length=${length}&height=${height}&width=${width}`, {
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

