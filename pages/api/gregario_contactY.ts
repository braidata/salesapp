import type { NextApiRequest, NextApiResponse } from 'next';
import * as AWS from 'aws-sdk';
import * as XLSX from 'xlsx';

// AWS S3 Configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

// Interfaces
interface GregarioContact {
  id: number;
  content_type: number;
  capture_client_id: number | null;
  address: string | null;
  created_at: string;
  updated_at: string;
  name: string;
  latitude: number;
  longitude: number;
  code: string;
}

interface GregarioResponse {
  data_timestamp: string | null;
  data_hash: string;
  service_timestamp: string | null;
  count: number;
  pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: GregarioContact[];
}

async function fetchGregarioPage(pageNumber: number, authHeader: string): Promise<GregarioResponse> {
  const url = `https://imegaventus.gregario.app/tenants-api/1.0/opportunities/?page=${pageNumber}&page_size=100`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al obtener datos de Gregario en página ${pageNumber}: ${errorText}`);
  }

  return await response.json() as GregarioResponse;
}

function createExcelBuffer(contacts: GregarioContact[]): Buffer {
  const worksheetData = contacts.map(contact => ({
    ID: contact.id,
    Nombre: contact.name,
    Dirección: contact.address || '',
    Código: contact.code,
    Latitud: contact.latitude,
    Longitud: contact.longitude,
    'Fecha Creación': contact.created_at,
    'Última Actualización': contact.updated_at,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  const columnWidths = [
    { wch: 10 }, // ID
    { wch: 30 }, // Nombre
    { wch: 40 }, // Dirección
    { wch: 15 }, // Código
    { wch: 12 }, // Latitud
    { wch: 12 }, // Longitud
    { wch: 20 }, // Fecha Creación
    { wch: 20 }, // Última Actualización
  ];
  worksheet['!cols'] = columnWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contactos');
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

async function uploadToS3(buffer: Buffer, fileName: string): Promise<string> {
  const params = {
    Bucket: BUCKET_NAME!,
    Key: fileName,
    Body: buffer,
    ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    
  };

  const data = await s3.upload(params).promise();
  return data.Location;
}

async function processBatch(startPage: number, endPage: number, authHeader: string): Promise<GregarioContact[]> {
  let contacts: GregarioContact[] = [];
  
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

async function uploadBatchToS3(contacts: GregarioContact[], batchNumber: number): Promise<string> {
  console.log(`Subiendo lote ${batchNumber} con ${contacts.length} contactos`);
  const excelBuffer = createExcelBuffer(contacts);
  const fileName = `contactos_gregario_batch_${batchNumber}_${Date.now()}.xlsx`;
  return await uploadToS3(excelBuffer, fileName);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido. Usa GET' });
  }

  try {
    const username = process.env.USER_GREGARIO;
    const password = process.env.PASSWORD_GREGARIO;

    if (!username || !password) {
      throw new Error('Credenciales no configuradas');
    }

    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
    
    console.log('Obteniendo información de la primera página...');
    const firstPage = await fetchGregarioPage(1, authHeader);
    const totalPages = firstPage.pages;
    
    console.log(`Total de páginas a procesar: ${totalPages}`);
    
    // Procesar en lotes de 50 páginas
    const BATCH_SIZE = 50;
    const batchUrls: string[] = [];
    
    for (let i = 1; i <= totalPages; i += BATCH_SIZE) {
      const endPage = Math.min(i + BATCH_SIZE - 1, totalPages);
      console.log(`Procesando lote de páginas ${i} a ${endPage}`);
      
      const batchContacts = await processBatch(i, endPage, authHeader);
      const batchUrl = await uploadBatchToS3(batchContacts, Math.floor(i / BATCH_SIZE));
      batchUrls.push(batchUrl);
      
      // Esperar entre lotes para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return res.status(200).json({
      message: 'Archivos Excel generados y subidos con éxito',
      totalArchivos: batchUrls.length,
      files: batchUrls
    });

  } catch (error) {
    console.error('Error en /api/gregario-contacts:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Error inesperado al obtener los contactos de Gregario'
    });
  }
}