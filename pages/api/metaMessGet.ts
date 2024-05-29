// pages/api/getMessages.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // Token de acceso de la página de Facebook, debe ser almacenado de forma segura, no directamente en el código
    const pageAccessToken = process.env.META_EXTERNAL;
    
    try {
      // Realiza una solicitud a la Graph API para obtener mensajes
      const response = await axios.get(`https://graph.facebook.com/v12.0/me/conversations?access_token=${pageAccessToken}`);
      // Envía los mensajes como respuesta de la API
      res.status(200).json(response.data);
    } catch (error) {
      // Maneja los errores de la solicitud
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  } else {
    // Si no es una solicitud GET, devuelve un error 405 Method Not Allowed
    res.setHeader('Allow', ['GET']);
    res.status(405).end('Method Not Allowed');
  }
}
