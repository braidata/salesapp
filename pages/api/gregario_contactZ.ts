import type { NextApiRequest, NextApiResponse } from 'next';
import * as AWS from 'aws-sdk';
import * as XLSX from 'xlsx';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

interface GregarioResponse {
  pages: number;
  results: any[];
}

async function fetchGregarioPage(pageNumber: number, authHeader: string): Promise<GregarioResponse> {
  const url = `https://imegaventus.gregario.app/tenants-api/1.0/opportunities/?page=${pageNumber}&page_size=100`;
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

function createExcelBuffer(contacts: any[]): Buffer {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(contacts);
  
  const columnWidths = Object.keys(contacts[0]).map(() => ({ wch: 20 }));
  worksheet['!cols'] = columnWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contactos');
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

async function uploadToS3(buffer: Buffer, batchNumber: number): Promise<string> {
  const params = {
    Bucket: BUCKET_NAME!,
    Key: `gregario-contacts_2/contactos_gregario_batch_nuevo_${batchNumber}.xlsx`,
    Body: buffer,
    ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };

  const data = await s3.upload(params).promise();
  return data.Location;
}

async function processBatch(startPage: number, endPage: number, authHeader: string): Promise<any[]> {
  let contacts: any = [];
  
  for (let page = startPage; page <= endPage; page++) {
    try {
      console.log(`Procesando página ${page} del lote ${startPage}-${endPage}`);
      const data = await fetchGregarioPage(page, authHeader);
      contacts = [...contacts, ...data.results];
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error en página ${page}:`, error);
      continue;
    }
  }
  
  return contacts;
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

    console.log('Obteniendo información de la primera página...');
    const firstPage = await fetchGregarioPage(1, authHeader);
    const totalPages = firstPage.pages;
    console.log(`Total de páginas a procesar: ${totalPages}`);

    const BATCH_SIZE = 50;
    const batchUrls: string[] = [];

    for (let i = 1; i <= totalPages; i += BATCH_SIZE) {
      const endPage = Math.min(i + BATCH_SIZE - 1, totalPages);
      console.log(`Procesando lote de páginas ${i} a ${endPage}`);
      
      const batchContacts = await processBatch(i, endPage, authHeader);
      console.log(`Subiendo lote ${Math.floor(i/BATCH_SIZE)} con ${batchContacts.length} contactos`);
      
      const batchUrl = await uploadToS3(createExcelBuffer(batchContacts), Math.floor(i/BATCH_SIZE));
      batchUrls.push(batchUrl);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return res.status(200).json({
      message: 'Archivos Excel generados y subidos con éxito',
      totalArchivos: batchUrls.length,
      files: batchUrls
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
}