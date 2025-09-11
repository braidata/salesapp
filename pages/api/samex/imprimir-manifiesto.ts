// Next.js 12 API Route - SAMEX proxy
// Requires Node 18+ for global fetch.
// Env vars:
//   SAMEX_BASE_URL (default: https://gtssamexpre.alertran.net/gts/seam/resource/restv1/auth)
//   SAMEX_USERNAME
//   SAMEX_PASSWORD
import type { NextApiRequest, NextApiResponse } from 'next'

const BASE_URL = process.env.SAMEX_BASE_URL || 'https://gtssamexpre.alertran.net/gts/seam/resource/restv1/auth';

function getAuthHeader() {
  const u = process.env.SAMEX_USERNAME || '';
  const p = process.env.SAMEX_PASSWORD || '';
  if (!u || !p) {
    throw new Error('Missing SAMEX_USERNAME or SAMEX_PASSWORD env vars');
  }
  return 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');
}

async function forwardPost(path: string, body: any, signal?: AbortSignal) {
  const resp = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(),
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    signal,
  });
  const contentType = resp.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json') || contentType.includes('+json');
  const data = isJson ? await resp.json().catch(async () => ({ raw: await resp.text() })) : await resp.text();
  return { status: resp.status, ok: resp.ok, data, contentType };
}

function methodNotAllowed(res: NextApiResponse) {
  res.setHeader('Allow', 'POST');
  return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
}

function badRequest(res: NextApiResponse, message: string) {
  return res.status(400).json({ error: message });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  let payload: any = req.body;
  try {
    // Accept both parsed JSON (object) and raw string
    if (typeof payload === 'string') payload = JSON.parse(payload);
  } catch (e: any) {
    return badRequest(res, 'Invalid JSON body');
  }
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 30000); // 30s timeout
    const out = await forwardPost('/imprimirManifiestoService/imprimir', payload, ac.signal);
    clearTimeout(t);
    if (!out.ok) {
      return res.status(out.status).json({ error: 'Upstream error', status: out.status, data: out.data });
    }
    // Pass through JSON or text
    if (typeof out.data === 'string') {
      res.setHeader('Content-Type', out.contentType || 'text/plain');
      return res.status(200).send(out.data);
    }
    return res.status(200).json(out.data);
  } catch (err: any) {
    const message = err?.message || 'Unexpected error';
    const isAbort = message.includes('aborted');
    return res.status(isAbort ? 504 : 500).json({ error: message });
  }
}
