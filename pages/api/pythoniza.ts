import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  const order_id = req.query ? req.query.id : "12354";
  const perro = req.query ? req.query : "12354";

  try {

    const pyResponse = await fetch('http://localhost:7777/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gato: order_id,
        perro: perro,
      }),
    });

    // Lee la respuesta como JSON
    const pyResponseJson = await pyResponse.json();

    console.log("la data", pyResponseJson);

    // Devuelve la respuesta como JSON
    res.status(200).json(pyResponseJson);
      
  } catch (error) {

    console.error(error);

    res.status(500).json({ error: 'Error creating file' });

  }

}

// import { NextApiRequest, NextApiResponse } from 'next';
// import fs from 'fs';
// import path from 'path';


// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   // Obtiene el nombre de la imagen de la URL
//   const { imageName } = req.query;

//   try {
//     // Lee la imagen desde la carpeta uploads
//     const imagePath = path.join(process.cwd(), 'uploads', imageName as string);
//     const imageData = fs.readFileSync(imagePath);

//     // Envía la imagen como datos binarios a la API de Python
//     const pyResponse = await fetch('http://localhost:7777/api', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         image: imageData.toString('base64'),
//       }),
//     });

//     // Lee la respuesta como JSON
//     const pyResponseJson = await pyResponse.json();

//     // Devuelve la respuesta como JSON
//     res.status(200).json(pyResponseJson);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Error processing image' });
//   }
// }