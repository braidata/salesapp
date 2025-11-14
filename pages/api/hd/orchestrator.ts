import type { NextApiRequest, NextApiResponse } from "next";
import { createHdAxios } from "../../../lib/hdClient";
import type { HdCreateOrderPayload, HdBasicResponse } from "../../../lib/hdTypes";

interface OrchestratorBody {
  env?: string;
  createOrder?: boolean;
  orderPayload?: HdCreateOrderPayload;
  numeroSeguimiento?: string;
  generateLabel?: boolean;
  includeTracking?: boolean;
}

type Data =
  | {
      ok: true;
      env: string;
      steps: {
        order?: HdBasicResponse | null;
        label?: HdBasicResponse | null;
        tracking?: HdBasicResponse | null;
      };
    }
  | { ok: false; env: string; error: string; details?: any };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, env: "unknown", error: "Method not allowed" });
  }

  const body = req.body as OrchestratorBody;
  const { env, createOrder = true, orderPayload, numeroSeguimiento, generateLabel, includeTracking } = body;

  const { client, config } = createHdAxios(env);

  const steps: { order?: HdBasicResponse | null; label?: HdBasicResponse | null; tracking?: HdBasicResponse | null } = {};

  try {
    // 1) Crear pedido (opcional)
    if (createOrder) {
      if (!orderPayload) {
        return res.status(400).json({
          ok: false,
          env: config.name,
          error: "createOrder=true pero falta 'orderPayload'",
        });
      }

      const orderResp = await client.post("/api/v2/pedido/nuevo-pedido/", {
        ...orderPayload,
        direccion_origen_id: orderPayload.direccion_origen_id || config.direccionOrigenId,
      });

      steps.order = orderResp.data as HdBasicResponse;
    } else {
      steps.order = null;
    }

    // numeroSeguimiento debe venir explícito por ahora (no asumimos shape del response)
    const trackingNumber = numeroSeguimiento;

    if ((generateLabel || includeTracking) && !trackingNumber) {
      return res.status(400).json({
        ok: false,
        env: config.name,
        error: "Se requiere 'numeroSeguimiento' para etiqueta / tracking",
      });
    }

    // 2) Etiqueta
    if (generateLabel && trackingNumber) {
      const labelResp = await client.get("/api/v2/pedido/etiqueta/", {
        params: { numero_seguimiento: trackingNumber },
      });
      steps.label = labelResp.data as HdBasicResponse;
    } else {
      steps.label = null;
    }

    // 3) Trazabilidad
    if (includeTracking && trackingNumber) {
      const trackingResp = await client.get("/api/v2/pedido/trazabilidad/", {
        params: { numero_seguimiento: trackingNumber },
      });
      steps.tracking = trackingResp.data as HdBasicResponse;
    } else {
      steps.tracking = null;
    }

    return res.status(200).json({
      ok: true,
      env: config.name,
      steps,
    });
  } catch (error: any) {
    console.error("[/api/hd/orchestrator] Error", error?.response?.data || error?.message);
    return res.status(error?.response?.status || 500).json({
      ok: false,
      env: config.name,
      error: error?.response?.data?.message || error?.message || "Unexpected error",
      details: error?.response?.data,
    });
  }
}
