// pages/api/samex/imprimir-manifiesto.ts
// Next.js 12 API Route - SAMEX imprimir manifiesto + upload a S3 (sin ACL)
// Node 18+ (global fetch)
//
// ENV requeridas:
//   SAMEX_BASE_URL (default: https://gtssamexpre.alertran.net/gts/seam/resource/restv1/auth)
//   SAMEX_USERNAME
//   SAMEX_PASSWORD
//   AWS_REGION
//   AWS_S3_BUCKET
//   AWS_ACCESS_KEY_ID
//   AWS_SECRET_ACCESS_KEY
// Opcionales:
//   SAMEX_MANIFESTS_PREFIX = "samex/manifiestos"   // carpeta en S3
//   SAMEX_LOG_LEVEL = info|debug|silent            // logs

import type { NextApiRequest, NextApiResponse } from 'next'
import AWS from 'aws-sdk'
import { v4 as uuid } from 'uuid'

const BASE_URL =
  process.env.SAMEX_BASE_URL ||
  'https://gtssamexpre.alertran.net/gts/seam/resource/restv1/auth'

const LOG_LEVEL = (process.env.SAMEX_LOG_LEVEL || 'info').toLowerCase() as
  | 'info'
  | 'debug'
  | 'silent'

const S3_BUCKET = process.env.AWS_S3_BUCKET as string
const S3_REGION = process.env.AWS_REGION as string
const S3_PREFIX = process.env.SAMEX_MANIFESTS_PREFIX || 'samex/manifiestos'

// --- logging helpers ---
function reqId() {
  return 'sx_' + Math.random().toString(36).slice(2, 8)
}
function logI(id: string, ...args: any[]) {
  if (LOG_LEVEL !== 'silent') console.log(`[SAMEX][${id}]`, ...args)
}
function logD(id: string, ...args: any[]) {
  if (LOG_LEVEL === 'debug') console.log(`[SAMEX][${id}][debug]`, ...args)
}
function logE(id: string, ...args: any[]) {
  if (LOG_LEVEL !== 'silent') console.error(`[SAMEX][${id}][error]`, ...args)
}

// --- samex auth ---
function getAuthHeader() {
  const u = process.env.SAMEX_USERNAME || ''
  const p = process.env.SAMEX_PASSWORD || ''
  if (!u || !p) throw new Error('Missing SAMEX_USERNAME or SAMEX_PASSWORD env vars')
  return 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64')
}

// --- forward POST intacto ---
async function forwardPost(path: string, body: any, signal?: AbortSignal) {
  const resp = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuthHeader(),
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    signal,
  })
  const contentType = resp.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json') || contentType.includes('+json')
  const data = isJson ? await resp.json().catch(async () => ({ raw: await resp.text() })) : await resp.text()
  return { status: resp.status, ok: resp.ok, data, contentType }
}

// --- utils respuesta/parseo ---
function safePreviewJSON(payload: any, max = 800) {
  try {
    const s = JSON.stringify(payload)
    return s.length > max ? s.slice(0, max) + `… [+${s.length - max} chars]` : s
  } catch {
    return '[unstringifiable]'
  }
}

// Busca recursivamente el primer string base64 que sea un PDF (%PDF)
function findFirstPdfBase64(input: any): string | null {
  const seen = new Set<any>()
  const stack = [input]
  const base64Regex = /^[A-Za-z0-9+/=\r\n]+$/

  while (stack.length) {
    const node = stack.pop()
    if (node && typeof node === 'object') {
      if (seen.has(node)) continue
      seen.add(node)
      for (const v of Object.values(node)) stack.push(v)
    } else if (typeof node === 'string') {
      const s = node.trim()
      if (s.length > 100 && base64Regex.test(s)) {
        try {
          const buf = Buffer.from(s, 'base64')
          // PDF empieza con "%PDF"
          if (buf.slice(0, 4).toString('ascii') === '%PDF') return s
        } catch {}
      }
    }
  }
  return null
}

function guessPickupId(input: any): string | null {
  // intenta encontrar algún id/numero de recogida en el payload/respuesta
  const candidates = ['numeroRecogida', 'idRecogida', 'recogida', 'nroRecogida', 'id']
  if (input && typeof input === 'object') {
    for (const k of candidates) {
      const v = (input as any)[k]
      if (typeof v === 'string' || typeof v === 'number') return String(v)
    }
  }
  return null
}

// --- S3 ---
const s3 = new AWS.S3({
  region: S3_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
})

async function uploadPdfToS3(
  pdfBase64: string,
  fileNameHint?: string | null,
  pickupId?: string | null
) {
  if (!S3_BUCKET || !S3_REGION) {
    throw new Error('Missing AWS_S3_BUCKET or AWS_REGION')
  }
  const buf = Buffer.from(pdfBase64, 'base64')
  const safeHint = (fileNameHint || '').replace(/[^A-Za-z0-9._-]+/g, '').slice(0, 60)
  const idPart = pickupId ? `recogida-${pickupId}` : Date.now().toString()
  const key = `${S3_PREFIX}/${uuid()}_${idPart}_${safeHint || 'manifiesto'}.pdf`

  await s3
    .upload({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buf,
      ContentType: 'application/pdf',
      // No ACL -> evita "AccessControlListNotSupported" en buckets con ACL deshabilitado
      // ACL: 'public-read', // <- NO usar si el bucket tiene ACLs deshabilitados
      Metadata: {
        source: 'samex',
        type: 'manifiesto',
      },
    })
    .promise()

  const signedUrl = s3.getSignedUrl('getObject', {
    Bucket: S3_BUCKET,
    Key: key,
    Expires: 60 * 60 * 24, // 15 min
    ResponseContentType: 'application/pdf',
    ResponseContentDisposition: `inline; filename="${(safeHint || 'manifiesto')}.pdf"`,
  })

  return { bucket: S3_BUCKET, key, signedUrl, expires: 900 }
}

// --- respuestas de error comunes ---
function methodNotAllowed(res: NextApiResponse) {
  res.setHeader('Allow', 'POST')
  return res.status(405).json({ error: 'Method Not Allowed. Use POST.' })
}
function badRequest(res: NextApiResponse, message: string) {
  return res.status(400).json({ error: message })
}

// --- handler ---
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = (req.headers['x-request-id'] as string) || reqId()
  res.setHeader('X-Request-Id', id)

  if (req.method !== 'POST') return methodNotAllowed(res)

  // 1) payload
  let payload: any = req.body
  try {
    if (typeof payload === 'string') payload = JSON.parse(payload)
  } catch {
    return badRequest(res, 'Invalid JSON body')
  }

  // 2) forward a SAMEX
  try {
    const ac = new AbortController()
    const to = setTimeout(() => ac.abort(), 30000)

    logI(id, '→ POST imprimir manifiesto SAMEX')
    logD(id, 'payload', safePreviewJSON(payload))

    const out = await forwardPost('/imprimirManifiestoService/imprimir', payload, ac.signal)
    clearTimeout(to)

    logI(id, `← SAMEX ${out.status} ${out.ok ? 'OK' : 'ERROR'}`)
    logD(id, 'upstream', safePreviewJSON(out.data))

    if (!out.ok) {
      return res.status(out.status).json({
        ok: false,
        error: 'Upstream error',
        status: out.status,
        upstream: out.data,
      })
    }

    // 3) Intentar extraer PDF base64
    const pdf64 = findFirstPdfBase64(out.data)
    if (!pdf64) {
      logE(id, 'No se encontró PDF en la respuesta de SAMEX')
      // devolvemos upstream tal cual si no hay PDF
      return res.status(200).json({
        ok: true,
        uploaded: false,
        message: 'Manifiesto generado, pero no se detectó PDF en la respuesta.',
        upstream: out.data,
      })
    }

    // 4) Subir a S3
    try {
      const pickupId = guessPickupId(payload) || guessPickupId(out.data)
      const hint =
        typeof payload?.fileName === 'string'
          ? payload.fileName
          : typeof payload?.nombreArchivo === 'string'
          ? payload.nombreArchivo
          : 'manifiesto'

      const put = await uploadPdfToS3(pdf64, hint, pickupId)

      logI(id, 'S3 upload OK', put.key)

      return res.status(200).json({
        ok: true,
        uploaded: true,
        s3: put, // { bucket, key, signedUrl, expires }
        upstream: out.data,
      })
    } catch (e: any) {
      logE(id, 'S3 upload FAILED', e?.message || e)
      return res.status(200).json({
        ok: true,
        uploaded: false,
        error: `S3 upload failed: ${e?.message || 'unknown'}`,
        upstream: out.data,
      })
    }
  } catch (err: any) {
    const msg = err?.message || 'Unexpected error'
    const isAbort =
      msg.includes('aborted') ||
      msg.includes('The user aborted a request')
    logE(id, isAbort ? 'Timeout/Abort' : 'Proxy error', msg)
    return res.status(isAbort ? 504 : 500).json({ ok: false, error: msg })
  }
}
