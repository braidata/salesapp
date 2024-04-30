import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import formidable, { File } from 'formidable';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form data:', err);
        return res.status(500).json({ error: 'Error processing file' });
      }
    
      const file = files.file as File;
      if (!file) {
        console.error('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
      }
    
      console.log('Archivo recibido en la API de Next.js:', file.originalFilename);

      // Create a new FormData instance
      const formData = new FormData();
      formData.append('file', await fs.readFile(file.filepath), file.originalFilename || 'uploaded_file');

      try {
        const pyResponse = await fetch('http://localhost:7777/api/ocr', {
          method: 'POST',
          body: formData as any,
        });

        // Read the response as JSON
        const pyResponseJson = await pyResponse.json();
        console.log('OCR result:', pyResponseJson);

        // Return the response as JSON
        res.status(200).json(pyResponseJson);
      } catch (error) {
        console.error('Error processing OCR:', error);
        res.status(500).json({ error: 'Error processing file' });
      } finally {
        // Clean up the temporary file
        await fs.unlink(file.filepath);
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
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