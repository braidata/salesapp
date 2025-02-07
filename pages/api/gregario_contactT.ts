import type { NextApiRequest, NextApiResponse } from 'next';
import * as AWS from 'aws-sdk';
import * as XLSX from 'xlsx';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

async function fetchContactIds(pageNumber: number, authHeader: string): Promise<any> {
  const url = `https://imegaventus.gregario.app/tenants-api/1.0/opportunities/?page=${pageNumber}&page_size=100`;
  const response = await fetch(url, {
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' }
  });

  if (!response.ok) throw new Error(`Error obteniendo IDs página ${pageNumber}: ${await response.text()}`);
  return await response.json();
}

async function fetchContactDetails(ids: number[], authHeader: string): Promise<any[]> {
  const url = `https://imegaventus.gregario.app/tenants-api/1.0/opportunities/?id__in=${ids.join(',')}`;
  const response = await fetch(url, {
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' }
  });

  if (!response.ok) throw new Error(`Error obteniendo detalles para IDs ${ids}: ${await response.text()}`);
  const data = await response.json();
  
  return data.results.map((contact: any) => ({
    id: contact.id,
    name: contact.name,
    address: contact.address,
    emails: contact.emails,
    phones: contact.phones,
    latitude: contact.latitude,
    longitude: contact.longitude,
    description: contact.description,
    features: contact.features,
    created_at: contact.created_at,
    updated_at: contact.updated_at,
    code: contact.code,
    url: contact.url,
    price_reference: contact.price_reference,
    stars: contact.stars,
    administrative_area: contact.administrative_area,
    sub_administrative_area: contact.sub_administrative_area,
    locality: contact.locality,
    country: contact.country,
    state: contact.state
  }));
}

function createExcelBuffer(contacts: any[]): Buffer {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(contacts.map(contact => ({
    ...contact,
    emails: contact.emails?.join(', ') || '',
    phones: contact.phones?.join(', ') || '',
    features: contact.features?.join(', ') || ''
  })));

  worksheet['!cols'] = Object.keys(contacts[0]).map(() => ({ wch: 25 }));
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contactos');
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

async function uploadToS3(buffer: Buffer, batchNumber: number): Promise<string> {
  const params = {
    Bucket: BUCKET_NAME!,
    Key: `gregario-contacts_2/contactos_gregario_batch_new_${batchNumber}.xlsx`,
    Body: buffer,
    ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };

  const data = await s3.upload(params).promise();
  return data.Location;
}

async function processBatch(ids: number[], batchNumber: number, authHeader: string): Promise<string> {
  console.log(`Procesando lote ${batchNumber} con ${ids.length} IDs`);
  const contacts = await fetchContactDetails(ids, authHeader);
  console.log(`Obtenidos ${contacts.length} contactos completos del lote ${batchNumber}`);
  
  const excelBuffer = createExcelBuffer(contacts);
  return await uploadToS3(excelBuffer, batchNumber);
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

    console.log('Iniciando recolección de datos...');
    const firstPage = await fetchContactIds(1, authHeader);
    const totalPages = firstPage.pages;
    console.log(`Total de páginas a procesar: ${totalPages}`);

    const batchUrls: string[] = [];
    let allIds: number[] = [];

    // Recolección de todos los IDs
    for (let i = 1; i <= totalPages; i++) {
      console.log(`Obteniendo IDs de página ${i}/${totalPages}`);
      const pageData = await fetchContactIds(i, authHeader);
      const pageIds = pageData.results.map((item: any) => item.id);
      allIds = [...allIds, ...pageIds];
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Total de IDs recolectados: ${allIds.length}`);

    // Procesamiento en lotes de 100
    const BATCH_SIZE = 100;
    for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
      const batchIds = allIds.slice(i, i + BATCH_SIZE);
      const batchUrl = await processBatch(batchIds, Math.floor(i/BATCH_SIZE), authHeader);
      batchUrls.push(batchUrl);
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log(`Progreso: ${Math.min(i + BATCH_SIZE, allIds.length)}/${allIds.length} contactos procesados`);
    }

    return res.status(200).json({
      message: 'Proceso completado con éxito',
      totalContactos: allIds.length,
      totalArchivos: batchUrls.length,
      files: batchUrls
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
}