// pages/api/test.ts
// Utils API para probar VTEX usando lib/vtex.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { listOrders, getOrderById, type VtexStore } from "../../../lib/vtex";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método no permitido" });
  }

  // store puede ser: imegab2c | blanik | bbqgrill | ventusperu
  const store = (req.query.store as VtexStore) || "ventusperu";
  const orderId = req.query.orderId as string | undefined;

  try {
    // === 1) Si viene orderId → getOrderById ===
    if (orderId) {
      console.log(`[VTEX-TEST] getOrderById orderId=${orderId} store=${store}`);

      // ecommerce para Perú: "VENTUSPERU_VTEX"; para otras, podrías pasar null
      const ecommerceHint =
        store === "ventusperu"
          ? "VENTUSPERU_VTEX"
          : store === "imegab2c"
          ? "VENTUSCORP_VTEX"
          : store === "blanik"
          ? "BLANIK_VTEX"
          : store === "bbqgrill"
          ? "BBQGRILL_VTEX"
          : undefined;

      const order = await getOrderById(orderId, ecommerceHint);

      return res.status(200).json({
        mode: "detail",
        store,
        orderId,
        order,
      });
    }

    // === 2) Si NO hay orderId → listOrders ===
    const page = Number(req.query.page ?? 1) || 1;
    const perPage = Number(req.query.perPage ?? 10) || 10;
    const status = (req.query.status as string) || "handling"; // por defecto handling
    const orderBy = (req.query.orderBy as string) || "creationDate,desc";

    const queryString = [
      `page=${page}`,
      `per_page=${perPage}`,
      `orderBy=${encodeURIComponent(orderBy)}`,
      status ? `f_status=${encodeURIComponent(status)}` : null,
    ]
      .filter(Boolean)
      .join("&");

    console.log(
      `[VTEX-TEST] listOrders store=${store} status=${status} page=${page} perPage=${perPage}`
    );

    const vtexResp = await listOrders(queryString, store);
    const list = Array.isArray(vtexResp?.list)
      ? vtexResp.list
      : Array.isArray(vtexResp)
      ? vtexResp
      : [];

    return res.status(200).json({
      mode: "list",
      store,
      status,
      page,
      perPage,
      total: list.length,
      raw: vtexResp,
    });
  } catch (e: any) {
    console.error("[VTEX-TEST] Error:", e?.message);
    return res.status(500).json({
      error: e?.message || "Error consultando VTEX",
    });
  }
}
