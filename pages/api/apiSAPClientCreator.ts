// pages/api/apiSAPClientCreator.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios, { AxiosError, AxiosResponse } from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SAPClientCreatorRequest {
  client_id: number;
  authorized_by?: string;
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

const SAP_URL =
  "https://sapwdp.imega.cl:44330/RESTAdapter/CrearBP_ECOMMERCE_Sender";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { client_id, authorized_by }: SAPClientCreatorRequest = req.body || {};
  if (!client_id || !Number.isFinite(Number(client_id))) {
    return res.status(400).json({ error: "client_id es requerido (numérico)" });
  }

  const SAP_USER = process.env.SAP_USER || "";
  const SAP_PASSWORD = process.env.SAP_PASSWORD || "";

  try {
    // 1) Traer cliente
    const client = await prisma.sap_client.findUnique({
      where: { id: Number(client_id) },
    });
    if (!client) return res.status(404).json({ error: "Cliente no encontrado" });

    // 2) Si ya tiene éxito real previo, bloquear
    // if (
    //   client.creation_response &&
    //   client.creation_response !== "PENDING" &&
    //   client.creation_response !== "ERROR"
    // ) {
    //   return res.status(409).json({
    //     error: "Cliente ya fue creado en SAP",
    //     sap_response: client.creation_response,
    //   });
    // }

    // 3) Dejar en PENDING ANTES de llamar a SAP (para no ver el valor viejo)
    await prisma.sap_client.update({
      where: { id: client.id },
      data: {
        creation_response: "",
        authorized_by: authorized_by || null,
        authorized_at: new Date(),
        updated_by: authorized_by || null,
        updated_at: new Date(),
      },
    });

    // 4) Preparar payload SAP
    const sapData = {
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
        NUMERO:
          ((client.client_numero_calle || "") +
            " " +
            (client.client_numero_casa_depto || "")).trim() || "",
        CIUDAD: client.client_ciudad || "",
        COMUNA: client.client_comuna || "",
        REGION: client.client_region || "",
        CATEGORY: client.client_giro && client.client_giro.length > 0 ? "2" : "1",
        GIRO: client.client_giro || "",
      },
    };

    // 5) Llamar a SAP
    let sapResponse: AxiosResponse<any>;
    try {
      sapResponse = await axios.post(SAP_URL, sapData, {
        auth: { username: SAP_USER, password: SAP_PASSWORD },
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
        validateStatus: () => true, // capturar también 4xx/5xx
      });
    } catch (err) {
      // error de red / timeout: guardamos "ERROR" plano
      await prisma.sap_client.update({
        where: { id: client.id },
        data: {
          creation_response: "ERROR",
          updated_by: authorized_by || null,
          updated_at: new Date(),
        },
      });
      const e = err as AxiosError;
      return res.status(502).json({
        error: "Error de red/timeout al llamar a SAP",
        details: e.message,
        status: 502,
      });
    }

    // 6) Persistir SIEMPRE el cuerpo de SAP (éxito o error HTTP)
    const body = sapResponse.data; // p.ej: {"RESP":{"CODE":0,"TEXT":"OK"}} o {"RESP":{"CODE":1,"TEXT":"El NIF 1 no es válido."}}
    const updated = await prisma.sap_client.update({
      where: { id: client.id },
      data: {
        creation_response: JSON.stringify(body),
        updated_by: authorized_by || null,
        updated_at: new Date(),
      },
    });

    // 7) Evaluar código de negocio
    const isSuccess =
      body &&
      typeof body === "object" &&
      body.RESP &&
      Number(body.RESP.CODE) === 0;

    if (isSuccess) {
      return res.status(200).json({
        success: true,
        message: body.RESP.TEXT || "OK",
        client: updated,
        sap_response: body,
      });
    } else {
      // Devolvemos 200 igual (porque guardamos la respuesta) o 422 si preferís separar
      return res.status(200).json({
        success: false,
        message:
          (body?.RESP?.TEXT as string) ||
          "Error SAP (sin texto)",
        client: updated,
        sap_response: body,
      });
    }
  } catch (error: any) {
    console.error("Creator fatal error:", error);
    // Como última salvaguarda, no pisamos con ERROR si ya pusimos cuerpo de SAP
    return res.status(500).json({
      error: "Error interno del servidor al crear cliente en SAP",
      details: error?.message || String(error),
      status: 500,
    });
  } finally {
    await prisma.$disconnect();
  }
}
