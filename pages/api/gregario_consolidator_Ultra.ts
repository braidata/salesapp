import type { NextApiRequest, NextApiResponse } from 'next';
import * as AWS from 'aws-sdk';
import * as XLSX from 'xlsx';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

async function listS3Files(): Promise<AWS.S3.ObjectList> {
  const params = {
    Bucket: BUCKET_NAME!,
    Prefix: 'gregario-contacts_2/contactos_gregario_'
  };

  const data = await s3.listObjects(params).promise();
  const files = (data.Contents || []).filter(file => 
    file.Key && 
    file.Key.endsWith('.xlsx') && 
    !file.Key.includes('consolidado')
  );

  // Ordenar archivos por nombre para procesar en orden
  return files.sort((a, b) => (a.Key || '').localeCompare(b.Key || ''));
}

async function downloadExcel(key: string): Promise<any[]> {
  console.log('Descargando:', key);
  
  const params = {
    Bucket: BUCKET_NAME!,
    Key: key
  };

  const file = await s3.getObject(params).promise();
  const workbook = XLSX.read(file.Body, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const contacts = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`- Contactos encontrados: ${contacts.length}`);
  return contacts;
}

async function uploadConsolidatedExcel(contacts: any[]): Promise<string> {
  console.log('Creando archivo consolidado...');
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(contacts);
  
  worksheet['!cols'] = Object.keys(contacts[0]).map(() => ({ wch: 25 }));
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contactos');
  
  const buffer = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  
  const params = {
    Bucket: BUCKET_NAME!,
    Key: `gregario-contacts_2/consolidado/contactos_gregario_todos.xlsx`,
    Body: buffer,
    ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };

  const data = await s3.upload(params).promise();
  return data.Location;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('Buscando archivos para consolidar...');
    const files = await listS3Files();
    console.log(`Encontrados ${files.length} archivos`);

    let allContacts: any[] = [];
    let processedFiles = 0;

    for (const file of files) {
      if (!file.Key) continue;
      
      processedFiles++;
      console.log(`\nProcesando archivo ${processedFiles}/${files.length}`);
      const contacts = await downloadExcel(file.Key);
      allContacts = [...allContacts, ...contacts];
      
      console.log(`Progreso: ${processedFiles}/${files.length} (${((processedFiles/files.length)*100).toFixed(1)}%)`);
      console.log(`Total acumulado: ${allContacts.length} contactos`);
    }

    console.log('\nSubiendo archivo consolidado...');
    const fileUrl = await uploadConsolidatedExcel(allContacts);

    return res.status(200).json({
      message: 'Consolidación completada',
      archivosEncontrados: files.length,
      archivosConsolidados: processedFiles,
      totalContactos: allContacts.length,
      fileUrl
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
}