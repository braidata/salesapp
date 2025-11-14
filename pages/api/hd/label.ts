import type { NextApiRequest, NextApiResponse } from "next";
import { createHdAxios } from "../../../lib/hdClient";
import type { HdBasicResponse } from "../../../lib/hdTypes";

type Data =
  | { ok: true; env: string; hdResponse: HdBasicResponse }
  | { ok: false; env: string; error: string; details?: any };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, env: "unknown", error: "Method not allowed" });
  }

  const { numero_seguimiento, env } = req.query as { numero_seguimiento?: string; env?: string };

  if (!numero_seguimiento) {
    return res.status(400).json({
      ok: false,
      env: env || "unknown",
      error: "Missing 'numero_seguimiento' query param",
    });
  }

  try {
    const { client, config } = createHdAxios(env);

    const response = await client.get("/api/v2/pedido/etiqueta/", {
      params: { numero_seguimiento },
    });

    return res.status(200).json({
      ok: true,
      env: config.name,
      hdResponse: response.data as HdBasicResponse,
    });
  } catch (error: any) {
    console.error("[/api/hd/label] Error", error?.response?.data || error?.message);
    return res.status(error?.response?.status || 500).json({
      ok: false,
      env: env || "unknown",
      error: error?.response?.data?.message || error?.message || "Unexpected error",
      details: error?.response?.data,
    });
  }
}
