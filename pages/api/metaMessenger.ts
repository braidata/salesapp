import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const pageAccessToken = process.env.META_EXTERNAL; // Tu token de acceso a la página
    const { recipientId, messageText } = req.body;

    const messageData = {
      recipient: { id: recipientId },
      message: { text: messageText }
    };

    try {
      const response = await axios.post(`https://graph.facebook.com/v12.0/me/messages?access_token=${pageAccessToken}`, messageData);
      res.status(200).json({ messageId: response.data.message_id });
    } catch (error) {
      res.status(500).json({ error });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
