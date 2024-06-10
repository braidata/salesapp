// pages/api/getPageInfo.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Define un tipo para la respuesta de la API para mejorar la claridad y el manejo de errores.
interface ApiResponse {
  name?: string;
  category?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method === 'GET') {
    const pageAccessToken = process.env.META_EXTERNAL; // Asegúrate de que este es tu token de acceso válido
    const pageId = '1639249299679845'; // Reemplaza esto con el ID de tu página

    try {
      const response = await axios.get(`https://graph.facebook.com/v12.0/${pageId}?fields=name,category&access_token=${pageAccessToken}`);
      // Envía la respuesta exitosa de vuelta al cliente.
      res.status(200).json(response.data);
    } catch (error) {
      console.error("Error obteniendo información de la página:", error);
      // Maneja errores, como tokens inválidos o problemas de red.
      res.status(500).json({ error: 'Error obteniendo información de la página' });
    }
  } else {
    // Método no permitido
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}