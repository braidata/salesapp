function printNestedObjects(obj: any, depth = 0) {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      console.log(`${'  '.repeat(depth)}${key}:`);
      printNestedObjects(obj[key], depth + 1);
    } else if (typeof obj[key] === 'string' && obj[key].length > 1) {
      console.log(`${'  '.repeat(depth)}${key}: ${obj[key]}`);
    } 
  }
  console.log(`${obj}`);
}

export default function handler(req: { method: string; body: any; query: { [x: string]: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): void; new(): any; }; send: { (arg0: any): void; new(): any; }; end: { (arg0: string): void; new(): any; }; }; setHeader: (arg0: string, arg1: string[]) => void; }) {
  if (req.method === 'POST') {
    const data = req.body;
    console.log('Received webhook:');
    printNestedObjects(data);

    res.status(200).json({ message: 'Webhook recibido y procesado con éxito' });
  } else if (req.method === 'GET') {
    const verifiedToken = process.env.META_INTERNAL;
    if (req.query['hub.verify_token'] === verifiedToken) {
      res.status(200).send(req.query['hub.challenge']);
    } else {
      res.status(403).end('Acceso denegado');
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}