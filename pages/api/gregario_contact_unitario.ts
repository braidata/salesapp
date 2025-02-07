import type { NextApiRequest, NextApiResponse } from 'next';

async function fetchGregarioContact(id: string, authHeader: string): Promise<any> {
  const url = `https://imegaventus.gregario.app/tenants-api/1.0/opportunities/${id}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Contacto no encontrado');
    }
    throw new Error(`Error en la búsqueda: ${await response.text()}`);
  }

  return await response.json();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Obtener el ID de los query params
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Se requiere un ID válido' });
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(
      `${process.env.USER_GREGARIO}:${process.env.PASSWORD_GREGARIO}`
    ).toString('base64');

    const contact = await fetchGregarioContact(id, authHeader);

    return res.status(200).json({
      message: 'Contacto encontrado',
      contact
    });

  } catch (error: any) {
    console.error('Error:', error);
    
    if (error.message === 'Contacto no encontrado') {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }
    
    return res.status(500).json({ error: 'Error al buscar el contacto' });
  }
}