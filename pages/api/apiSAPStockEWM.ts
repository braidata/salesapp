// pages/api/apiSAPStockEWM.ts (Next 12)
import type { NextApiRequest, NextApiResponse } from "next";
import axios, { AxiosError } from "axios";

const SAP_URL = "https://sapwdp.imega.cl:44330/RESTAdapter/Consulta_Stock_Ewm_Sender";

type SapBody = { PRODUCTO?: string; UBICACION?: string };

function getCreds() {
  const username = process.env.SAP_USER;
  const password = process.env.SAP_PASSWORD;
  if (!username || !password) throw new Error("Faltan credenciales SAP (SAP_USER*_QA / SAP_PASSWORD*_QA)");
  return { username, password };
}

const xmlEsc = (s?: string) =>
  (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function buildXml(body: SapBody) {
  const parts: string[] = ['<Consulta_Stock_Ewm_Sender>'];
  if (body.PRODUCTO) parts.push(`  <PRODUCTO>${xmlEsc(body.PRODUCTO)}</PRODUCTO>`);
  if (body.UBICACION) parts.push(`  <UBICACION>${xmlEsc(body.UBICACION)}</UBICACION>`);
  parts.push('</Consulta_Stock_Ewm_Sender>');
  return parts.join("\n");
}

function extractSapLogId(html: string) {
  // captura Log_ID:XXXXXXXX o bien el anchor interno
  return (
    html.match(/Log_ID:([A-Z0-9]+)/i)?.[1] ||
    html.match(/>(C0[0-9A-Z]{30,})</)?.[1] ||
    null
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method Not Allowed" });

  const { PRODUCTO, UBICACION } = (req.body ?? {}) as SapBody;
  if (!PRODUCTO && !UBICACION) {
    return res.status(400).json({ ok: false, message: "Debes enviar al menos PRODUCTO o UBICACION" });
  }

  const format = String(req.query.format || "json").toLowerCase();

  try {
    const auth = getCreds();

    const isXml = format === "xml";
    const dataToSend = isXml ? buildXml({ PRODUCTO, UBICACION }) : { PRODUCTO, UBICACION };

    const r = await axios.post(SAP_URL, dataToSend, {
      auth,
      headers: {
        "Content-Type": isXml ? "application/xml; charset=utf-8" : "application/json; charset=utf-8",
        "Accept": "application/json,application/xml,text/plain,*/*",
      },
      timeout: 20000,
      // httpsAgent: new (require("https").Agent)({ rejectUnauthorized: process.env.SAP_TLS_INSECURE === "1" ? false : true }),
      validateStatus: () => true, // dejamos pasar para manejar nosotros
    });

    // OK de SAP
    if (r.status >= 200 && r.status < 300) {
      return res.status(200).json({ ok: true, data: r.data });
    }

    // Error de SAP (incluye HTML con Log_ID)
    const ct = String(r.headers["content-type"] || "");
    const isHtml = ct.includes("text/html");
    const raw = typeof r.data === "string" ? r.data : JSON.stringify(r.data);
    const logId = isHtml ? extractSapLogId(raw) : null;

    return res.status(r.status || 500).json({
      ok: false,
      status: r.status || 500,
      message: "Error desde SAP",
      logId: logId || undefined,
      data: isHtml ? { raw } : r.data,
    });
  } catch (e) {
    const err = e as AxiosError;
    return res.status(502).json({
      ok: false,
      error: "UpstreamError",
      message: err.message || "Error al consultar SAP",
    });
  }
}
