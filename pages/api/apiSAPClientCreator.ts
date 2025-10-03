import axios, { AxiosResponse } from 'axios';
import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

interface SAPClientCreatorRequest {
  client_id: number;
  authorized_by?: string;
}

interface SAPData {
  Data: {
    RUT: string;
    SOCIEDAD: string;
    NOMBRE: string;
    APELLIDO_PATERNO: string;
    APELLIDO_MATERNO: string;
    SEXO: string;
    CELULAR: string;
    TELEFONO: string;
    EMAIL: string;
    CALLE: string;
    NUMERO: string;
    CIUDAD: string;
    COMUNA: string;
    REGION: string;
    CATEGORY: string;
    GIRO: string;
  };
}

interface ApiResponse {
  success?: boolean;
  message?: string;
  client?: any;
  sap_response?: any;
  error?: string;
  details?: any;
  status?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { client_id, authorized_by }: SAPClientCreatorRequest = req.body;

  if (!client_id) {
    return res.status(400).json({ error: 'client_id es requerido' });
  }

  const SAP_USER = process.env.SAP_USER;
  const SAP_PASSWORD = process.env.SAP_PASSWORD;
  const SAP_URL = 'https://sapwdp.imega.cl:44330/RESTAdapter/CrearBP_ECOMMERCE_Sender';

  try {
    // Buscar el cliente en la base de datos
    const client = await prisma.sap_client.findUnique({
      where: { id: parseInt(client_id.toString()) }
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Verificar si ya fue enviado a SAP exitosamente
    if (client.creation_response && 
        client.creation_response !== 'PENDING' && 
        client.creation_response !== 'ERROR') {
      return res.status(409).json({ 
        error: 'Cliente ya fue creado en SAP',
        sap_response: client.creation_response
      });
    }

    // Preparar los datos para SAP
    const sapData: SAPData = {
      Data: {
        RUT: client.client_rut,
        SOCIEDAD: "IM01",
        NOMBRE: client.client_nombre,
        APELLIDO_PATERNO: client.client_apellido_paterno || "--",
        APELLIDO_MATERNO: client.client_apellido_materno || "--",
        SEXO: client.client_sexo || "",
        CELULAR: client.client_celular || "",
        TELEFONO: client.client_telefono || "",
        EMAIL: client.client_email || "",
        CALLE: client.client_calle || "",
        NUMERO: client.client_numero_calle || "",
        CIUDAD: client.client_ciudad || "",
        COMUNA: client.client_comuna || "",
        REGION: client.client_region || "",
        CATEGORY: (client.client_giro && client.client_giro.length > 0) ? "2" : "1",
        GIRO: client.client_giro || ""
      }
    };

    // Enviar a SAP
    const sapResponse: AxiosResponse = await axios.post(SAP_URL, sapData, {
      auth: { username: SAP_USER, password: SAP_PASSWORD },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Actualizar el cliente en la base de datos con la respuesta de SAP
    const updatedClient = await prisma.sap_client.update({
      where: { id: parseInt(client_id.toString()) },
      data: {
        creation_response: JSON.stringify(sapResponse.data),
        authorized_by: authorized_by || null,
        authorized_at: new Date(),
        updated_by: authorized_by || null,
        updated_at: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Cliente creado exitosamente en SAP',
      client: updatedClient,
      sap_response: sapResponse.data
    });

  } catch (error: any) {
    console.error('Error al crear cliente en SAP:', error);

    // Actualizar el cliente con el error
    try {
      await prisma.sap_client.update({
        where: { id: parseInt(client_id.toString()) },
        data: {
          creation_response: 'ERROR',
          updated_by: authorized_by || null,
          updated_at: new Date()
        }
      });
    } catch (updateError: any) {
      console.error('Error al actualizar cliente con error:', updateError);
    }

    if (error.response) {
      const { status, data } = error.response;
      return res.status(status).json({
        error: 'Error al crear cliente en SAP',
        details: data,
        status
      });
    }

    return res.status(500).json({ 
      error: 'Error interno del servidor al crear cliente en SAP',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}