import type { NextApiRequest, NextApiResponse } from 'next';
import Busboy from 'busboy';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const busboy = Busboy({ headers: req.headers });

  busboy.on('file', function (fieldname: any, file: { pipe: (arg0: fs.WriteStream) => void; on: (arg0: string, arg1: () => void) => void; }, filename: any, encoding: any, mimetype: any) {
    console.log(`File [${fieldname
      }]: filename: ${filename.filename}`);

    const saveTo = `./uploads/${Date.now()}-${filename.filename}`;

    file.pipe(fs.createWriteStream(saveTo));

    file.on('end', function () {
      console.log(`File [${fieldname}] Finished`);
      console.log(`File2 [${fieldname
      }]: filename: ${filename.filename}`);
    });
  });

  busboy.on('finish', function () {
    console.log('Upload complete');
    res.status(200).json({ message: 'Image uploaded successfully' });
  });

  req.pipe(busboy);
}


// .then(response => {
//     const contentType = response.headers.get('content-type');
//     if (contentType && contentType.indexOf('image') !== -1) {
//       // La respuesta es una imagen
//       return response.arrayBuffer();
//     } else {
//       // La respuesta no es una imagen
//       throw new Error('La respuesta no es una imagen');
//     }
//   }).then(buffer => {
//     // Eliminar la cabecera
//     const header = 'data:image/jpeg;base64,';
//     const data = Buffer.from(buffer).toString('base64');
//     const imageData = data.replace(header, '');
//     // imageData contiene ahora el contenido de la imagen en formato base64
//     // Puedes guardar esto en un archivo o mostrar la imagen en tu aplicación
//   }).catch(error => {
//     console.error('Error al obtener la imagen', error);
//   });


