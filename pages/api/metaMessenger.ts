// import type { NextApiRequest, NextApiResponse } from 'next';

// export default function handler(req: NextApiRequest, res: NextApiResponse<string>) {
//   // Asegúrate de que sea una solicitud GET
//   if (req.method === 'GET') {
//     // Extraer los parámetros de verificación del webhook de la query string
//     const mode = "subscribe";
//     const token = process.env.META_INTERNAL;
//     const challenge = "hello";

//     // El VERIFY_TOKEN debe ser el que configuraste en Facebook, y se obtiene de las variables de entorno
//     const VERIFY_TOKEN = process.env.META_INTERNAL; // Asegúrate de que META_INTERNAL esté configurado en tu entorno

//     // Si los parámetros coinciden, devuelve el challenge.
//     if (mode === 'subscribe' && token === VERIFY_TOKEN) {
//       console.log('Webhook verified!');
//       // Aquí debes enviar de vuelta el challenge que Facebook envió
//       res.status(200).send(challenge as string);
//     } else {
//       // Si no coinciden, responde con un error
//       res.status(403).send('Verification failed. The tokens do not match.');
//     }
//   } else {
//     // Si no es una solicitud GET, devuelve un 405 Method Not Allowed
//     res.status(405).send('Method Not Allowed');
//   }
// }

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const pageId = '1639249299679845'; // Reemplaza esto con el ID de tu página

    const pageAccessToken = process.env.META_EXTERNAL; // Tu token de acceso a la página


    try {
      const response = await axios.post(`https://graph.facebook.com/v12.0/${pageId}/messages?recipient={'id':3088096534578920}&messaging_type=RESPONSE&message={'text':'Te recomiendo esta categoría: https://ventuscorp.cl/product-category/linea-calor/hornos/hornos-pizzeros/'}&access_token=${pageAccessToken}`);
      res.status(200).json({ messageId: response.data.message_id });
    } catch (error) {
      res.status(500).json({ error });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
