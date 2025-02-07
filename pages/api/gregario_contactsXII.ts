// pages/api/gregario-contacts.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import * as XLSX from 'xlsx';

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
  const url = `https://imegaventus.gregario.app/tenants-api/1.0/opportunities/?page=${pageNumber}&page_size=100`
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
  // Preparar los datos para Excel
  const worksheetData = contacts.map(contact => ({
    ID: contact.id,
    Nombre: contact.name,
    Dirección: contact.address || '',
    Código: contact.code,
    Latitud: contact.latitude,
    Longitud: contact.longitude,
    'Fecha Creación': contact.created_at,
    'Última Actualización': contact.updated_at
  }));

  // Crear libro de trabajo y hoja
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  // Ajustar ancho de columnas
  const columnWidths = [
    { wch: 10 }, // ID
    { wch: 30 }, // Nombre
    { wch: 40 }, // Dirección
    { wch: 15 }, // Código
    { wch: 12 }, // Latitud
    { wch: 12 }, // Longitud
    { wch: 20 }, // Fecha Creación
    { wch: 20 }  // Última Actualización
  ];
  worksheet['!cols'] = columnWidths;

  // Añadir la hoja al libro
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contactos');

  // Convertir a buffer
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido. Usa GET' });
  }

  try {
    // Credenciales
    const username = process.env.USER_GREGARIO;
    const password = process.env.PASSWORD_GREGARIO;
    
    if (!username || !password) {
      throw new Error('Credenciales no configuradas');
    }

    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

    // Array para almacenar todos los contactos
    let allContacts: GregarioContact[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    // Obtener la primera página para saber el total de páginas
    const firstPageData = await fetchGregarioPage(1, authHeader);
    const totalPages = firstPageData.pages;
    allContacts = [...allContacts, ...firstPageData.results];

    // Iterar sobre el resto de páginas
    while (currentPage < totalPages) {
      try {
        currentPage++;
        console.log(`Obteniendo página ${currentPage} de ${totalPages}...`);
        
        const data = await fetchGregarioPage(currentPage, authHeader);
        allContacts = [...allContacts, ...data.results];

        // Delay entre peticiones
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error en página ${currentPage}:`, error);
        // Continuar con la siguiente página en caso de error
        continue;
      }
    }

    console.log(`Se obtuvieron ${allContacts.length} contactos en total`);

    // Verificar si se solicita formato Excel
    const format = req.query.format?.toString().toLowerCase();
    if (format === 'excel') {
      const excelBuffer = createExcelBuffer(allContacts);
      
      // Configurar headers para descarga de Excel
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=contactos_gregario.xlsx');
      return res.send(excelBuffer);
    }

    // Si no se solicita Excel, devolver JSON
    return res.status(200).json(allContacts);

  } catch (error) {
    console.error('Error en /api/gregario-contacts:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Error inesperado al obtener los contactos de Gregario'
    });
  }
}