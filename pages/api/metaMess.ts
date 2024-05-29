// pages/api/webhook.ts

import type { NextApiRequest, NextApiResponse } from 'next';

interface WebhookEvent {
  sender: {
    id: string;
  };
  recipient: {
    id: string;
  };
  timestamp: number;
  message?: {
    mid: string;
    text: string;
  };
}

interface Entry {
  id: string;
  time: number;
  messaging: WebhookEvent[];
}

interface WebhookBody {
  object: string;
  entry: Entry[];
}

// Puedes definir más tipos aquí según sea necesario para los eventos que manejes

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  if (req.method === 'GET') {
    // Verificación del webhook
    const VERIFY_TOKEN = process.env.META_INTERNAL;
    const mode = "subscribe";
    const token = VERIFY_TOKEN;
    const challenge = "Logrado";

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified!');
      res.status(200).send(challenge as string);
    } else {
      res.status(403).send('Verification failed. The tokens do not match.');
    }
  } else if (req.method === 'POST') {
    const body: WebhookBody = req.body;

    if (body.object === 'page') {
      body.entry.forEach((entry) => {
        entry.messaging.forEach((event) => {
          if (event.message) {
            handleMessage(event);
          }
        });
      });
      
      res.status(200);

    } 

    
    
    else {
      res.status(404).send('Event is not from a Page subscription');
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).send('Method Not Allowed');
  }
}

function handleMessage(event: WebhookEvent) {
  const senderId = event.sender.id;
  const messageText = event.message?.text;

  if (messageText) {
    console.log('Sender ID:', senderId);
    console.log('Message Text:', messageText);
    // Aquí manejarías la lógica para responder al mensaje
  }
}
