// pages/api/samex/etiquetar.ts
// Next.js API Route - Etiquetar SAMEX (sin modificar PDFs)
// - Subida a S3 vía /api/uploaderS
// - Devuelve presigned URL + key
//
// ENV:
//   SAMEX_BASE_URL (default: https://gtssamexpre.alertran.net/gts/seam/resource/restv1/auth)
//   SAMEX_USERNAME
//   SAMEX_PASSWORD
//   SAMEX_LOG_LEVEL=info|debug|silent (opcional; default info)
//   AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
//   SAMEX_SIGNED_URL_TTL_SECONDS (opcional; default 3600)

import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const BASE_URL =
  process.env.SAMEX_BASE_URL ||
  'https://gtssamexpre.alertran.net/gts/seam/resource/restv1/auth';

const LOG_LEVEL = (process.env.SAMEX_LOG_LEVEL || 'info').toLowerCase() as
  | 'info'
  | 'debug'
  | 'silent';

const SIGN_TTL =
  parseInt(process.env.SAMEX_SIGNED_URL_TTL_SECONDS || '3600', 10) || 3600;

// ---- S3 sólo para firmar GET (el objeto queda privado) ----
const s3 = new AWS.S3({
  region: process.env.AWS_REGION!,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
});
function signGetUrl(key: string, ttlSeconds = SIGN_TTL) {
  return s3.getSignedUrlPromise('getObject', {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Expires: ttlSeconds,
  });
}

// ---- logging utils ----
function genRequestId() {
  return 'sx_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-6);
}
function logInfo(id: string, ...args: any[]) {
  if (LOG_LEVEL === 'silent') return;
  console.log(`[SAMEX][${id}]`, ...args);
}
function logDebug(id: string, ...args: any[]) {
  if (LOG_LEVEL !== 'debug') return;
  console.log(`[SAMEX][${id}][debug]`, ...args);
}
function logError(id: string, ...args: any[]) {
  if (LOG_LEVEL === 'silent') return;
  console.error(`[SAMEX][${id}][error]`, ...args);
}
function redact(obj: any): any {
  const SENSITIVE = new Set([
    'authorization','password','samex_username','samex_password','email',
    'email_remitente','email_destinatario','telefono','telefono_contacto_remitente',
    'telefono_contacto_destinatario','nif_remitente','nif_destinatario','rut',
  ]);
  if (obj == null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = SENSITIVE.has(k.toLowerCase()) ? '***redacted***' : redact(v);
  return out;
}
function safePreviewJSON(payload: any, max = 2000): string {
  try {
    const s = JSON.stringify(redact(payload));
    return s.length > max ? s.slice(0, max) + `… [+${s.length - max} chars]` : s;
  } catch {
    return '[unstringifiable payload]';
  }
}

// ---- helpers HTTP ----
function getAuthHeader() {
  const u = process.env.SAMEX_USERNAME || '';
  const p = process.env.SAMEX_PASSWORD || '';
  if (!u || !p) throw new Error('Missing SAMEX_USERNAME or SAMEX_PASSWORD env vars');
  return 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');
}
async function forwardPost(reqId: string, path: string, body: any, signal?: AbortSignal) {
  const url = `${BASE_URL}${path}`;
  logInfo(reqId, '→ POST', url);
  if (LOG_LEVEL === 'debug') logDebug(reqId, '→ body', safePreviewJSON(body));

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: getAuthHeader() },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    signal,
  });
  const ct = resp.headers.get('content-type') || '';
  const isJson = ct.includes('application/json') || ct.includes('+json');
  const data = isJson ? await resp.json().catch(async () => ({ raw: await resp.text() })) : await resp.text();

  logInfo(reqId, `← ${resp.status} ${resp.ok ? 'OK' : 'ERROR'} ${ct || '<no-ct>'}`);
  if (LOG_LEVEL !== 'debug') {
    const preview = typeof data === 'string' ? data.slice(0, 300) : safePreviewJSON(data, 600);
    logInfo(reqId, '← preview', preview);
  } else {
    logDebug(reqId, '← body', safePreviewJSON(data));
  }

  return { status: resp.status, ok: resp.ok, data, contentType: ct };
}
function methodNotAllowed(reqId: string, res: NextApiResponse) {
  logError(reqId, '405 Method Not Allowed');
  res.setHeader('Allow', 'POST');
  return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
}
function badRequest(reqId: string, res: NextApiResponse, message: string) {
  logError(reqId, '400 Bad Request:', message);
  return res.status(400).json({ error: message });
}

// ---- util self base url + uploaderS ----
function getSelfBaseUrl(req: NextApiRequest) {
  const envBase = (process.env.NEXTAUTH_URL || '').replace(/\/+$/, '');
  if (envBase) return envBase + '/';
  const proto = (req.headers['x-forwarded-proto'] as string) || 'http';
  const host = req.headers.host || 'localhost:3000';
  return `${proto}://${host}/`;
}
function stripDataPrefix(b64: string) {
  const i = b64.indexOf(',');
  return i >= 0 ? b64.slice(i + 1) : b64;
}
async function uploadPdfBufferViaUploaderS(
  req: NextApiRequest,
  reqId: string,
  fileBuffer: Buffer,
  fileName: string,
  folder = 'samex/etiquetas'
) {
  const origin = getSelfBaseUrl(req);
  const form = new FormData();
  form.append('file', new Blob([fileBuffer], { type: 'application/pdf' }), fileName);

  const url = `${origin}api/uploaderS?folder=${encodeURIComponent(folder)}`;
  logInfo(reqId, 'S3 upload →', url, `(file=${fileName}, bytes=${fileBuffer.length})`);

  const resp = await fetch(url, { method: 'POST', body: form });
  const json = await resp.json().catch(async () => ({ raw: await resp.text() }));
  if (!resp.ok) throw new Error(`S3 upload failed: ${JSON.stringify(json)}`);

  let key: string | undefined = (json as any).key || (json as any).imageKey;
  if (!key) throw new Error('Uploader did not return object key');
  if (!key.includes('/')) key = `${folder.replace(/^\/+|\/+$/g, '')}/${key}`;

  const signedUrl = await signGetUrl(key, SIGN_TTL);
  logInfo(reqId, 'S3 upload OK', { key, signedUrl });
  return { key, signedUrl };
}

// ---- handler ----
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const reqId = (req.headers['x-request-id'] as string) || genRequestId();
  logInfo(reqId, `⇢ SAMEX Etiquetar invoked ${req.method}`);
  if (req.method !== 'POST') return methodNotAllowed(reqId, res);

  let payload: any = req.body;
  try {
    if (typeof payload === 'string') payload = JSON.parse(payload);
  } catch {
    return badRequest(reqId, res, 'Invalid JSON body');
  }

  try {
    const ac = new AbortController();
    const t = setTimeout(() => {
      logError(reqId, 'Timeout: aborting upstream request at 30s');
      ac.abort();
    }, 30000);

    const out = await forwardPost(reqId, '/etiquetarService/etiquetar', payload, ac.signal);
    clearTimeout(t);

    if (!out.ok) {
      logError(reqId, 'Upstream returned error', out.status);
      return res.status(out.status).json({ error: 'Upstream error', status: out.status, data: out.data });
    }

    // --- Extraer base64 y subir (sin modificar el PDF) ---
    let etiquetaUrl: string | null = null;
    let etiquetaKey: string | null = null;
    let ot: string | number | null = null;

    try {
      const root = Array.isArray(out.data) ? out.data[0] : out.data;
      const node =
        root?.respuestaEtiquetar ||
        root?.respuestaDocuemtarEnvio ||
        root?.respuestaDocumentarEnvio ||
        root;

      ot = node?.numero_envio ?? node?.nroOrdenFlete ?? node?.ot ?? null;

      const etiquetaBase64: string | null =
        node?.etiqueta ?? node?.label ?? node?.pdf ?? null;

      if (etiquetaBase64) {
        const pdfBuf = Buffer.from(stripDataPrefix(String(etiquetaBase64)), 'base64');
        const fileName = `etiqueta-${ot || Date.now()}.pdf`;
        const uploaded = await uploadPdfBufferViaUploaderS(req, reqId, pdfBuf, fileName, 'samex/etiquetas');
        etiquetaUrl = uploaded.signedUrl;
        etiquetaKey = uploaded.key;
      } else {
        logInfo(reqId, 'No vino etiqueta base64 en respuesta');
      }
    } catch (e: any) {
      logError(reqId, 'Fallo procesando etiqueta/OT:', e?.message || e);
    }

    // passthrough si upstream devolvió texto
    if (typeof out.data === 'string') {
      res.setHeader('Content-Type', out.contentType || 'text/plain');
      if (ot != null) res.setHeader('X-SAMEX-OT', String(ot));
      if (etiquetaUrl) res.setHeader('X-SAMEX-Etiqueta-URL', etiquetaUrl);
      if (etiquetaKey) res.setHeader('X-SAMEX-Etiqueta-Key', etiquetaKey);
      return res.status(200).send(out.data);
    }

    return res.status(200).json({
      ...out.data,
      samexExtras: {
        ot,
        etiquetaUrl,   // presigned (expira)
        etiquetaKey,   // clave en bucket para re-firmar cuando quieras
        signedTtlSeconds: SIGN_TTL,
      },
      // Nota: para “1 etiqueta por hoja”, usa el parámetro que provea SAMEX
      // en el payload (p.ej. formato/plantilla/tipoImpresion). Aquí lo
      // pasamos tal cual al endpoint, sin tocar el PDF.
    });
  } catch (err: any) {
    const message = err?.message || 'Unexpected error';
    const isAbort = message.includes('aborted') || message.includes('The user aborted a request');
    logError(reqId, isAbort ? '504 Gateway Timeout' : '500 Proxy Error', message);
    return res.status(isAbort ? 504 : 500).json({ error: message, requestId: reqId });
  }
}
