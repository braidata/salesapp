import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

interface GetClientsQuery {
  page?: string;
  limit?: string;
  status?: 'all' | 'pending' | 'created' | 'error';
  search?: string;
}

interface ApiResponse {
  success: boolean;
  clients?: any[];
  total?: number;
  page?: number;
  totalPages?: number;
  error?: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Método no permitido' 
    });
  }

  try {
    const {
      page = '1',
      limit = '100',
      status = 'all',
      search = ''
    }: GetClientsQuery = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Construir filtros
    const where: any = {};

    // Filtro por estado
    if (status !== 'all') {
      switch (status) {
        case 'pending':
          where.OR = [
            { creation_response: null },
            { creation_response: 'PENDING' }
          ];
          break;
        case 'created':
          where.AND = [
            { creation_response: { not: null } },
            { creation_response: { not: 'PENDING' } },
            { creation_response: { not: 'ERROR' } }
          ];
          break;
        case 'error':
          where.creation_response = 'ERROR';
          break;
      }
    }

    // Filtro de búsqueda
    if (search.trim()) {
      const searchFilter = {
        OR: [
          { client_rut: { contains: search, mode: 'insensitive' } },
          { client_nombre: { contains: search, mode: 'insensitive' } },
          { client_apellido_paterno: { contains: search, mode: 'insensitive' } },
          { client_apellido_materno: { contains: search, mode: 'insensitive' } },
          { client_email: { contains: search, mode: 'insensitive' } }
        ]
      };

      if (where.OR || where.AND) {
        where.AND = where.AND ? [...where.AND, searchFilter] : [searchFilter];
      } else {
        Object.assign(where, searchFilter);
      }
    }

    // Obtener clientes con paginación
    const [clients, total] = await Promise.all([
      prisma.sap_client.findMany({
        where,
        orderBy: [
          { created_at: 'desc' }
        ],
        skip,
        take: limitNumber,
        select: {
          id: true,
          client_rut: true,
          client_nombre: true,
          client_apellido_paterno: true,
          client_apellido_materno: true,
          client_sexo: true,
          client_celular: true,
          client_telefono: true,
          client_email: true,
          client_calle: true,
          client_numero_calle: true,
          client_numero_casa_depto: true,
          client_region: true,
          client_ciudad: true,
          client_comuna: true,
          client_giro: true,
          client_owner_id: true,
          creation_response: true,
          created_by: true,
          authorized_by: true,
          updated_by: true,
          created_at: true,
          authorized_at: true,
          updated_at: true
        }
      }),
      prisma.sap_client.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNumber);

    return res.status(200).json({
      success: true,
      clients,
      total,
      page: pageNumber,
      totalPages
    });

  } catch (error: any) {
    console.error('Error al obtener clientes:', error);

    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener clientes',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}