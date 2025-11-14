// /api/hd/create-order.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createHdAxios } from "../../../lib/hdClient";
import type { HdCreateOrderPayload, HdBasicResponse } from "../../../lib/hdTypes";

type Data =
  | { ok: true; env: string; hdResponse: HdBasicResponse }
  | { ok: false; env: string; error: string; details?: any };

// Helper para sanitizar LPN (sacar guiones)
function sanitizeLpn(raw: unknown): string {
  if (raw == null) return "";
  // Deja solo letras y números, vuela guiones y cualquier otro símbolo.
  return String(raw).replace(/[^A-Za-z0-9]/g, "");
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ ok: false, env: "unknown", error: "Method not allowed" });
  }

  try {
    const { env, payload } = req.body as { env?: string; payload: HdCreateOrderPayload };

    if (!payload) {
      return res.status(400).json({
        ok: false,
        env: env || "unknown",
        error: "Missing 'payload' in body",
      });
    }

    const { client, config } = createHdAxios(env);

    // Clonamos y sanitizamos el LPN antes de enviar a HD
    const sanitizedPayload: HdCreateOrderPayload = {
      ...payload,
      pedido: {
        ...payload.pedido,
        lpn: sanitizeLpn(payload.pedido?.lpn),
        orden_compra: sanitizeLpn(payload.pedido?.orden_compra),
      },
    };

    // Log del JSON que se enviará a la API (ya con LPN sanitizado)
    console.log(
      "[/api/hd/create-order] Payload enviado:",
      JSON.stringify(sanitizedPayload, null, 2)
    );

    const response = await client.post(
      "/api/v2/pedido/nuevo-pedido/",
      sanitizedPayload
    );

    return res.status(200).json({
      ok: true,
      env: config.name,
      hdResponse: response.data as HdBasicResponse,
    });
  } catch (error: any) {
    console.error(
      "[/api/hd/create-order] Error",
      error?.response?.data || error?.message
    );
    return res.status(error?.response?.status || 500).json({
      ok: false,
      env: (req.body && req.body.env) || "unknown",
      error:
        error?.response?.data?.message ||
        error?.message ||
        "Unexpected error",
      details: error?.response?.data,
    });
  }
}
