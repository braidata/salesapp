import type { NextApiRequest, NextApiResponse } from 'next';
import * as AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

interface GregarioResponse {
  pages: number;
  results: any[];
  total: number;  // Agregamos este campo para capturar el total
}

async function fetchGregarioPage(pageNumber: number, authHeader: string): Promise<GregarioResponse> {
  const url = `https://imegaventus.gregario.app/tenants-api/1.0/opportunities/?page=${pageNumber}&page_size=1`;
  const response = await fetch(url, {
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Error en página ${pageNumber}: ${await response.text()}`);
  }

  return await response.json();
}

async function uploadReport(data: any): Promise<string> {
  const report = {
    fechaConsulta: new Date().toISOString(),
    totalContactos: data.totalContactos,
    totalPaginas: data.totalPaginas,
    estimacionTiempoDescarga: `${Math.ceil(data.totalPaginas / 50)} lotes de 50 páginas`,
  };

  const params = {
    Bucket: BUCKET_NAME!,
    Key: 'gregario-contacts/reporte_total_contactos.json',
    Body: JSON.stringify(report, null, 2),
    ContentType: 'application/json'
  };

  const uploadResult = await s3.upload(params).promise();
  return uploadResult.Location;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(
      `${process.env.USER_GREGARIO}:${process.env.PASSWORD_GREGARIO}`
    ).toString('base64');

    console.log('Consultando total de registros...');
    const firstPage = await fetchGregarioPage(1, authHeader);
    
    const totalPages = firstPage.pages;
    const totalContacts = firstPage.total; // Asumiendo que la API devuelve el total

    const reportData = {
      totalContactos: totalContacts,
      totalPaginas: totalPages,
    };

    console.log(`Total de contactos encontrados: ${totalContacts}`);
    console.log(`Total de páginas: ${totalPages}`);

    const reportUrl = await uploadReport(reportData);

    return res.status(200).json({
      message: 'Conteo completado',
      totalContactos: totalContacts,
      totalPaginas: totalPages,
      reportUrl
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
}