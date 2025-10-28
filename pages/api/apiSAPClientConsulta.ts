import axios, { AxiosResponse } from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

interface ConsultBPRequest {
  rut: string;
}

interface ApiResponse {
  success?: boolean;
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

  const { rut }: ConsultBPRequest = req.body;
  if (!rut || typeof rut !== 'string') {
    return res
      .status(400)
      .json({ error: 'El campo `rut` es requerido y debe ser un string' });
  }

  const SAP_USER = process.env.SAP_USER!;
  const SAP_PASSWORD = process.env.SAP_PASSWORD!;
  const SAP_URL =
    'https://sapwdp.imega.cl:44330/RESTAdapter/CONS_BusinessPartner';

  try {
    // Payload enviando el RUT como string
    const sapPayload = {
      Data: [{ BUSINESSPARTNER: rut }],
      CREATIONDATE: ''
    };

    // Llamada a SAP
    const sapResponse: AxiosResponse = await axios.post(SAP_URL, sapPayload, {
      auth: { username: SAP_USER, password: SAP_PASSWORD },
      headers: { 'Content-Type': 'application/json' }
    });

    // Respuesta al cliente
    return res.status(200).json({
      success: true,
      sap_response: sapResponse.data
    });
  } catch (error: any) {
    console.error('Error al consultar cliente en SAP:', error);

    if (error.response) {
      const { status, data } = error.response;
      return res.status(status).json({
        error: 'Error en consulta a SAP',
        details: data,
        status
      });
    }

    return res.status(500).json({
      error: 'Error interno al consultar cliente en SAP',
      details: error.message
    });
  }
}
