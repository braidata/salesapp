// pages/api/samex/emitir-envio.ts
// Next.js 12 API Route - SAMEX proxy con logs + upload etiqueta a S3 vía /api/uploaderS
// Node 18+ (global fetch / FormData / Blob)
//
// ENV:
//   SAMEX_BASE_URL (default: https://gtssamexpre.alertran.net/gts/seam/resource/restv1/auth)
//   SAMEX_USERNAME
//   SAMEX_PASSWORD
//   SAMEX_LOG_LEVEL=info|debug|silent   (opcional; por defecto "info")
//   AWS_REGION
//   AWS_S3_BUCKET
//   AWS_ACCESS_KEY_ID
//   AWS_SECRET_ACCESS_KEY
//   SAMEX_SIGNED_URL_TTL_SECONDS (opcional; default 3600)
//
// Notas:
// - El objeto en S3 queda PRIVADO. Entregamos un enlace firmado (expira el link, no el objeto).
// - Mantenemos el conector a /api/uploaderS tal cual; aquí solo lo invocamos.

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

// ---------- AWS S3 (para firmar GET) ----------
const s3 = new AWS.S3({
  region: process.env.AWS_REGION!,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
});

function signGetUrl(key: string, ttlSeconds = SIGN_TTL) {
  return s3.getSignedUrlPromise('getObject', {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Expires: ttlSeconds, // el LINK expira; el objeto NO
  });
}

// ---------- utils logging ----------
function genRequestId() {
  return 'sx_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-6);
}
function logInfo(reqId: string, ...args: any[]) {
  if (LOG_LEVEL === 'silent') return;
  console.log(`[SAMEX][${reqId}]`, ...args);
}
function logDebug(reqId: string, ...args: any[]) {
  if (LOG_LEVEL !== 'debug') return;
  console.log(`[SAMEX][${reqId}][debug]`, ...args);
}
function logError(reqId: string, ...args: any[]) {
  if (LOG_LEVEL === 'silent') return;
  console.error(`[SAMEX][${reqId}][error]`, ...args);
}
function redact(obj: any): any {
  const SENSITIVE_KEYS = new Set([
    'authorization',
    'password',
    'samex_username',
    'samex_password',
    'email',
    'email_remitente',
    'email_destinatario',
    'telefono',
    'telefono_contacto_remitente',
    'telefono_contacto_destinatario',
    'nif_remitente',
    'nif_destinatario',
    'rut',
  ]);
  if (obj == null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? '***redacted***' : redact(v);
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

// ---------- auth header ----------
function getAuthHeader() {
  const u = process.env.SAMEX_USERNAME || '';
  const p = process.env.SAMEX_PASSWORD || '';
  if (!u || !p) throw new Error('Missing SAMEX_USERNAME or SAMEX_PASSWORD env vars');
  return 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');
}

// ---------- helpers HTTP ----------
async function forwardPost(reqId: string, path: string, body: any, signal?: AbortSignal) {
  const url = `${BASE_URL}${path}`;
  const startedAt = process.hrtime.bigint();

  logInfo(reqId, '→ POST', url);
  logDebug(reqId, '→ headers', JSON.stringify({ 'Content-Type': 'application/json', Authorization: 'Basic ***' }));
  if (LOG_LEVEL === 'debug') logDebug(reqId, '→ body', safePreviewJSON(body));
  else {
    const len = typeof body === 'string' ? body.length : Buffer.byteLength(JSON.stringify(body || {}));
    logInfo(reqId, `→ body bytes ~${len}`);
  }

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: getAuthHeader() },
      body: typeof body === 'string' ? body : JSON.stringify(body),
      signal,
    });
  } catch (e: any) {
    const durMs = Number((process.hrtime.bigint() - startedAt) / BigInt(1e6));
    logError(reqId, `✖ fetch error after ${durMs}ms:`, e?.message || e);
    throw e;
  }

  const contentType = resp.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json') || contentType.includes('+json');
  const raw = isJson ? await resp.json().catch(async () => ({ raw: await resp.text() })) : await resp.text();

  const durMs = Number((process.hrtime.bigint() - startedAt) / BigInt(1e6));
  logInfo(reqId, `← ${resp.status} ${resp.ok ? 'OK' : 'ERROR'} (${durMs}ms)`, contentType || '<no content-type>');
  if (LOG_LEVEL === 'debug') logDebug(reqId, '← body', safePreviewJSON(raw));
  else {
    const snippet = typeof raw === 'string' ? raw.slice(0, 300) : safePreviewJSON(raw, 600);
    logInfo(reqId, '← preview', snippet);
  }

  return { status: resp.status, ok: resp.ok, data: raw, contentType };
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

// ---------- self URL + uploaderS ----------
function getSelfBaseUrl(req: NextApiRequest) {
  // Preferimos cabeceras de proxy / despliegue; fallback a env
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

/**
 * Sube el PDF (base64) a S3 usando /api/uploaderS y retorna un GET firmado.
 * - Si el uploader devuelve "key", lo usamos.
 * - Si devuelve "imageKey", intentamos anteponer el folder si no viene incluido.
 */
async function uploadBase64PdfViaUploaderS(
  req: NextApiRequest,
  reqId: string,
  base64: string,
  fileName: string,
  folder = 'samex/etiquetas'
) {
  const origin = getSelfBaseUrl(req);
  const raw = stripDataPrefix(base64);
  const buf = Buffer.from(raw, 'base64');

  const form = new FormData(); // Node 18 (undici)
  form.append('file', new Blob([buf], { type: 'application/pdf' }), fileName);

  const url = `${origin}api/uploaderS?folder=${encodeURIComponent(folder)}`;
  logInfo(reqId, 'S3 upload →', url, `(file=${fileName}, bytes=${buf.length})`);
  const resp = await fetch(url, { method: 'POST', body: form });
  const json = await resp.json().catch(async () => ({ raw: await resp.text() }));
  if (!resp.ok) {
    logError(reqId, 'S3 upload FAILED', json);
    throw new Error(`S3 upload failed: ${JSON.stringify(json)}`);
  }

  // Uploader puede retornar "key" o "imageKey"
  let key: string | undefined =
    (json as any).key ||
    (json as any).imageKey;

  if (!key) throw new Error('Uploader did not return object key');

  // Si el uploader no incluyó el folder en "imageKey", lo anteponemos.
  if (!key.includes('/') && folder) {
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    key = `${cleanFolder}/${key}`;
  }

  const signedUrl = await signGetUrl(key, SIGN_TTL);
  logInfo(reqId, 'S3 upload OK', { key, signedUrl });
  return { key, signedUrl };
}

// ---------- handler ----------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const reqId = (req.headers['x-request-id'] as string) || genRequestId();
  const orchestrator =
    (req.headers['x-orchestrator'] as string) ||
    (req.headers['x-orchestrator-id'] as string) ||
    null;

  res.setHeader('X-Request-Id', reqId);
  if (orchestrator) res.setHeader('X-Orchestrator', orchestrator);

  logInfo(reqId, `⇢ SAMEX proxy invoked ${req.method} by orchestrator=${orchestrator ?? 'n/a'}`);

  if (req.method !== 'POST') return methodNotAllowed(reqId, res);

  let payload: any = req.body;
  try {
    if (typeof payload === 'string') payload = JSON.parse(payload); // acepta raw JSON
  } catch {
    return badRequest(reqId, res, 'Invalid JSON body');
  }

  try {
    const ac = new AbortController();
    const t = setTimeout(() => {
      logError(reqId, 'Timeout: aborting upstream request at 30s');
      ac.abort();
    }, 30000);

    const out = await forwardPost(reqId, '/documentarEnvio/json', payload, ac.signal);
    clearTimeout(t);
    res.setHeader('X-Upstream-Status', String(out.status));

    if (!out.ok) {
      logError(reqId, 'Upstream returned error', out.status);
      return res
        .status(out.status)
        .json({ error: 'Upstream error', status: out.status, data: out.data });
    }

    // ---- Parseo de respuesta + subida a S3 (si viene etiqueta) ----
    let etiquetaUrl: string | null = null;
    let etiquetaKey: string | null = null;
    let ot: string | number | null = null;

    try {
      const root = Array.isArray(out.data) ? out.data[0] : out.data;
      const respNode = root?.respuestaDocuemtarEnvio || root?.respuestaDocumentarEnvio || root;
      ot =
        respNode?.numero_envio ??
        respNode?.nroOrdenFlete ??
        respNode?.ot ??
        null;

      const etiquetaBase64: string | null = respNode?.etiqueta || null;

      if (etiquetaBase64) {
        const fileName = `etiqueta-${ot || Date.now()}.pdf`;
        const uploaded = await uploadBase64PdfViaUploaderS(
          req,
          reqId,
          String(etiquetaBase64),
          fileName,
          'samex/etiquetas'
        );
        etiquetaUrl = uploaded.signedUrl;
        etiquetaKey = uploaded.key;
      } else {
        logInfo(reqId, 'No se recibió etiqueta base64 en la respuesta');
      }
    } catch (e: any) {
      logError(reqId, 'Fallo procesando etiqueta/OT:', e?.message || e);
    }

    // Texto plano → passthrough + headers con metadatos
    if (typeof out.data === 'string') {
      res.setHeader('Content-Type', out.contentType || 'text/plain');
      logInfo(reqId, 'Responding with text payload (metadatos por headers)');
      if (ot != null) res.setHeader('X-SAMEX-OT', String(ot));
      if (etiquetaUrl) res.setHeader('X-SAMEX-Etiqueta-URL', etiquetaUrl);
      if (etiquetaKey) res.setHeader('X-SAMEX-Etiqueta-Key', etiquetaKey);
      return res.status(200).send(out.data);
    }

    // JSON → adjuntamos extras útiles
    const response = {
      ...out.data,
      samexExtras: {
        ot,
        etiquetaUrl, // presigned URL (expira)
        etiquetaKey, // clave absoluta en el bucket (para re-firmar cuando quieras)
        signedTtlSeconds: SIGN_TTL,
      },
    };

    logInfo(reqId, 'Responding with JSON payload');
    return res.status(200).json(response);
  } catch (err: any) {
    const message = err?.message || 'Unexpected error';
    const isAbort =
      message.includes('aborted') ||
      message.includes('The user aborted a request');
    logError(reqId, isAbort ? '504 Gateway Timeout' : '500 Proxy Error', message);
    return res
      .status(isAbort ? 504 : 500)
      .json({ error: message, requestId: reqId });
  }
}
