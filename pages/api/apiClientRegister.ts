import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

interface ClientRequestBody {
  client_rut: string;
  client_nombre: string;
  client_apellido_paterno?: string;
  client_apellido_materno?: string;
  client_sexo?: string;
  client_celular?: string;
  client_telefono?: string;
  client_email?: string;
  client_calle?: string;
  client_numero_calle?: string;
  client_numero_casa_depto?: string;
  client_region?: string;
  client_ciudad?: string;
  client_comuna?: string;
  client_owner_id?: number;
  created_by?: string;
}

interface ApiResponse {
  success?: boolean;
  message?: string;
  client?: any;
  error?: string;
  client_id?: number;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const {
      client_rut,
      client_nombre,
      client_apellido_paterno,
      client_apellido_materno,
      client_sexo,
      client_celular,
      client_telefono,
      client_email,
      client_calle,
      client_numero_calle,
      client_numero_casa_depto,
      client_region,
      client_ciudad,
      client_comuna,
      client_owner_id,
      created_by
    }: ClientRequestBody = req.body;

    // Validaciones básicas
    if (!client_rut || !client_nombre) {
      return res.status(400).json({ 
        error: 'RUT y nombre son campos obligatorios' 
      });
    }

    // Verificar si el cliente ya existe
    const existingClient = await prisma.sap_client.findUnique({
      where: { client_rut }
    });

    if (existingClient) {
      return res.status(409).json({ 
        error: 'Cliente ya existe con este RUT',
        client_id: existingClient.id
      });
    }

    // Crear el nuevo cliente
    const newClient = await prisma.sap_client.create({
      data: {
        client_rut,
        client_nombre,
        client_apellido_paterno: client_apellido_paterno || null,
        client_apellido_materno: client_apellido_materno || null,
        client_sexo: client_sexo || "",
        client_celular: client_celular || null,
        client_telefono: client_telefono || null,
        client_email: client_email || null,
        client_calle: client_calle || null,
        client_numero_calle: client_numero_calle || null,
        client_numero_casa_depto: client_numero_casa_depto || null,
        client_region: client_region || null,
        client_ciudad: client_ciudad || null,
        client_comuna: client_comuna || null,
        client_owner_id: client_owner_id || null,
        created_by: created_by || null,
        creation_response: "PENDING" // Inicialmente pending hasta que se cree en SAP
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Cliente registrado exitosamente',
      client: newClient
    });

  } catch (error: any) {
    console.error('Error al registrar cliente:', error);
    
    // Manejo de errores específicos de Prisma
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Cliente ya existe con este RUT' 
      });
    }

    return res.status(500).json({ 
      error: 'Error interno del servidor al registrar cliente',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}