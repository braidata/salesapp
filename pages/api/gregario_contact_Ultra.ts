import type { NextApiRequest, NextApiResponse } from 'next';
import * as AWS from 'aws-sdk';
import * as XLSX from 'xlsx';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 segundos entre reintentos
const PAGE_SIZE = 100;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  let lastError: any;

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Intento ${i + 1}/${retries} para URL: ${url}`);
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }

      const errorText = await response.text();
      console.log(`Status ${response.status}, Respuesta: ${errorText}`);
      lastError = new Error(`HTTP ${response.status}: ${errorText}`);

    } catch (error: any) {
      console.log(`Error en intento ${i + 1}: ${error.message}`);
      lastError = error;
    }

    if (i < retries - 1) {
      const waitTime = RETRY_DELAY * (i + 1); // Backoff exponencial
      console.log(`Esperando ${waitTime}ms antes del siguiente intento...`);
      await sleep(waitTime);
    }
  }

  throw lastError || new Error('Máximo de reintentos alcanzado');
}

async function fetchPage(pageNumber: number, authHeader: string): Promise<any> {
  console.log(`Iniciando fetch de página ${pageNumber}`);
  const url = `https://imegaventus.gregario.app/tenants-api/1.0/opportunities/?page=${pageNumber}&page_size=${PAGE_SIZE}`;
  
  try {
    const response = await fetchWithRetry(url, {
      headers: { 
        Authorization: authHeader, 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log(`Página ${pageNumber} obtenida con ${data.results?.length || 0} resultados`);
    
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
  } catch (error) {
    console.error(`Error al obtener página ${pageNumber}:`, error);
    throw error;
  }
}

function createExcelBuffer(contacts: any[], fileIndex: number): Buffer {
  console.log(`Creando Excel para página ${fileIndex} con ${contacts.length} contactos`);
  const workbook = XLSX.utils.book_new();
  const processedContacts = contacts.map(contact => ({
    ...contact,
    emails: contact.emails?.join(', ') || '',
    phones: contact.phones?.join(', ') || '',
    features: contact.features?.join(', ') || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(processedContacts);
  worksheet['!cols'] = Object.keys(contacts[0]).map(() => ({ wch: 25 }));
  XLSX.utils.book_append_sheet(workbook, worksheet, `Contactos_${fileIndex}`);
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

async function uploadToS3(buffer: Buffer, fileIndex: number, timestamp: string): Promise<string> {
  const key = `gregario-contacts_2/contactos_gregario_${timestamp}_${fileIndex}.xlsx`;
  console.log(`Subiendo archivo a S3: ${key}`);
  
  try {
    const params = {
      Bucket: BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    const data = await s3.upload(params).promise();
    console.log(`Archivo subido exitosamente: ${data.Location}`);
    return data.Location;
  } catch (error) {
    console.error(`Error al subir archivo ${key} a S3:`, error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const uploadedFiles: string[] = [];
  const failedPages: number[] = [];
  let processedContacts = 0;

  try {
    console.log('Iniciando proceso de extracción...');
    const authHeader = 'Basic ' + Buffer.from(
      `${process.env.USER_GREGARIO}:${process.env.PASSWORD_GREGARIO}`
    ).toString('base64');

    // Verificar credenciales y obtener total de páginas
    console.log('Obteniendo información de paginación...');
    const url = `https://imegaventus.gregario.app/tenants-api/1.0/opportunities/?page=1&page_size=${PAGE_SIZE}`;
    const response = await fetchWithRetry(url, {
      headers: { 
        Authorization: authHeader, 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const firstPageData = await response.json();
    const totalPages = firstPageData.pages;
    console.log(`Total de páginas detectadas: ${totalPages}`);

    // Procesar cada página
    for (let page = 1; page <= totalPages; page++) {
      try {
        const contacts = await fetchPage(page, authHeader);
        processedContacts += contacts.length;

        // Crear y subir archivo para esta página
        const buffer = createExcelBuffer(contacts, page);
        const fileUrl = await uploadToS3(buffer, page, timestamp);
        uploadedFiles.push(fileUrl);

        console.log(`Página ${page}/${totalPages} completada (${processedContacts} contactos procesados)`);

        // Pequeña pausa entre páginas
        if (page < totalPages) {
          await sleep(500);
        }

      } catch (error) {
        console.error(`Error procesando página ${page}:`, error);
        failedPages.push(page);
        await sleep(1000); // Pausa más larga después de un error
      }
    }

    return res.status(200).json({
      message: 'Proceso completado',
      totalPaginas: totalPages,
      contactosProcesados: processedContacts,
      archivosCreados: uploadedFiles.length,
      archivos: uploadedFiles,
      paginasConError: failedPages,
      timestamp: timestamp
    });

  } catch (error: any) {
    console.error('Error general:', error);
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      detalles: {
        procesados: processedContacts,
        archivosCreados: uploadedFiles.length,
        paginasConError: failedPages,
        timestamp: timestamp
      }
    });
  }
}