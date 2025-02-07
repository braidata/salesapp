// pages/api/gregario-contacts.ts
import type { NextApiRequest, NextApiResponse } from 'next';

// Definimos la forma general de la respuesta que da Gregario
interface GregarioContact {
  id: number;
  content_type: number;
  capture_client_id: number | null;
  address: string | null;
  created_at: string;
  updated_at: string;
  name: string;
  latitude: number;
  longitude: number;
  code: string;
  // etc. Ajusta según necesites
  // ...
}

// Definimos la forma completa de la respuesta
interface GregarioResponse {
  data_timestamp: string | null;
  data_hash: string;
  service_timestamp: string | null;
  count: number;
  pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: GregarioContact[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. Aseguramos método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido. Usa GET' });
  }

  try {
    // 2. URL base (con o sin parámetros de paginación, ajusta si lo deseas)
    const GREGARIO_API_URL =
      'https://imegaventus.gregario.app/tenants-api/1.0/prospect-clients/?page=1&page_size=100';

    // 3. Credenciales de la imagen (idealmente usar .env en producción)
    const username = process.env.USER_GREGARIO;
    const password = process.env.PASSWORD_GREGARIO;

    // 4. Armamos la cabecera Authorization con base64 (Basic Auth)
    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

    // 5. Llamamos a la API de Gregario
    const response = await fetch(GREGARIO_API_URL, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    // 6. Verificamos si la respuesta es 2xx
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error al obtener datos de Gregario:', errorText);
      return res.status(response.status).json({
        error: `Error al obtener datos de Gregario: ${errorText}`,
      });
    }

    // 7. Parseamos la respuesta a JSON con el tipo GregarioResponse
    const data = (await response.json()) as GregarioResponse;

    // 8. Retornamos TODO el objeto (data) o sólo el array (data.results).
    // Opción A: retornar el objeto completo tal como viene:
    // return res.status(200).json(data);

    // Opción B: retornar sólo el array de resultados (los prospect-clients):
    return res.status(200).json(data.results);
  } catch (error) {
    console.error('Error en /api/gregario-contacts:', error);
    return res.status(500).json({
      error: 'Ocurrió un error inesperado al obtener los contactos de Gregario.',
    });
  }
}
