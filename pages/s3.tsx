// pages/visor-s3-etiqueta.tsx
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React from 'react';
import AWS from 'aws-sdk';

type Props = {
  signedUrl?: string | null;
  original?: string | null;
  fileName?: string | null;
  expires?: number | null;
  error?: string | null;
};

// ---------- Helpers (server) ----------
function extractKeyFromUrlOrKey(input: string, bucket: string): string | null {
  if (!input) return null;
  if (!/^https?:\/\//i.test(input)) {
    return input.replace(/^\/+/, '');
  }
  try {
    const u = new URL(input);
    // subdomain: {bucket}.s3.{region}.amazonaws.com/key
    if (u.hostname.includes(bucket)) {
      return decodeURIComponent(u.pathname.replace(/^\/+/, ''));
    }
    // path-style: s3.{region}.amazonaws.com/{bucket}/key  o  s3.amazonaws.com/{bucket}/key
    const parts = u.pathname.replace(/^\/+/, '').split('/');
    if (parts[0] === bucket && parts.length > 1) {
      return decodeURIComponent(parts.slice(1).join('/'));
    }
    return null;
  } catch {
    return null;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// ---------- Page ----------
const Page: NextPage<Props> = ({ signedUrl = null, original = null, fileName = null, expires = 600, error = null }) => {
  const router = useRouter();
  const [src, setSrc] = React.useState(original ?? '');
  const [fn, setFn] = React.useState(fileName ?? '');
  const [exp, setExp] = React.useState<number>(Number(expires ?? 600));

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const q: Record<string, string> = {};
    if (src) q.src = src;
    if (fn) q.fn = fn;
    if (exp) q.expires = String(exp);
    router.push({ pathname: router.pathname, query: q });
  };

  const onClear = () => {
    setSrc('');
    setFn('');
    setExp(600);
    router.push({ pathname: router.pathname }, undefined, { shallow: true });
  };

  return (
    <>
      <Head><title>Visor Etiqueta SAMEX (S3)</title></Head>
      <div className="min-h-screen flex flex-col">
        <header className="p-3 border-b">
          <div className="font-semibold mb-2">Visor Etiqueta SAMEX (S3)</div>
          <form onSubmit={onSubmit} className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto] items-end">
            <div className="flex flex-col">
              <label className="text-sm mb-1">URL o Key de S3</label>
              <input
                className="input"
                type="text"
                placeholder="https://bucket.s3.region.amazonaws.com/ruta/archivo.pdf  ó  samex/etiquetas/archivo.pdf"
                value={src}
                onChange={(e) => setSrc(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1">Nombre sugerido</label>
              <input
                className="input"
                type="text"
                placeholder="etiqueta.pdf"
                value={fn}
                onChange={(e) => setFn(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1">Expira (seg)</label>
              <input
                className="input"
                type="number"
                min={60}
                max={3600}
                step={1}
                value={exp}
                onChange={(e) => setExp(Number(e.target.value))}
              />
            </div>
            <div className="flex gap-2">
              <button className="btn" type="submit">Ver</button>
              <button className="btn btn-ghost" type="button" onClick={onClear}>Limpiar</button>
            </div>
          </form>
          {original ? (
            <div className="mt-2 text-xs text-gray-600 truncate">
              actual:&nbsp;<code className="truncate">{original}</code>
            </div>
          ) : null}
        </header>

        <main className="flex-1">
          {!signedUrl && (
            <div className="p-6">
              {error ? (
                <div className="mb-3 text-red-600">{error}</div>
              ) : (
                <div className="mb-3 text-gray-700">Ingresa una URL o key y presiona <b>Ver</b>.</div>
              )}
              <p className="text-sm text-gray-600">
                Ejemplo: pega{' '}
                <code>
                  https://ventus-sales-s3.s3.us-east-1.amazonaws.com/samex/etiquetas/b098df19-12c6-4dbf-bc35-edecbce0e549_etiqueta-999900553649.pdf
                </code>
              </p>
            </div>
          )}

          {signedUrl && (
            <>
              <div className="p-2 flex gap-2 border-b">
                <a className="btn btn-ghost" href={signedUrl} download={fileName || undefined}>
                  Descargar
                </a>
                <a className="btn btn-ghost" href={signedUrl} target="_blank" rel="noopener noreferrer">
                  Abrir en pestaña
                </a>
                <span className="text-xs text-gray-600 self-center">
                  expira en ~{exp || 600}s
                </span>
              </div>
              <iframe
                src={signedUrl}
                className="w-full h-[calc(100vh-150px)]"
                style={{ border: 'none' }}
                title="Etiqueta SAMEX desde S3"
              />
            </>
          )}
        </main>

        <style jsx>{`
          .border-b { border-bottom: 1px solid #e5e7eb; }
          .input { border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.5rem 0.75rem; outline: none; }
          .input:focus { border-color: #94a3b8; }
          .btn { border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.5rem 0.75rem; background: white; cursor: pointer; }
          .btn:hover { background: #f8fafc; }
          .btn-ghost { background: transparent; }
          .font-semibold { font-weight: 600; }
          .text-gray-600 { color: #4b5563; }
          .text-gray-700 { color: #374151; }
          .text-xs { font-size: 0.75rem; }
          .mb-1 { margin-bottom: 0.25rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mb-3 { margin-bottom: 0.75rem; }
          .mt-2 { margin-top: 0.5rem; }
          .p-2 { padding: 0.5rem; }
          .p-3 { padding: 0.75rem; }
          .p-6 { padding: 1.5rem; }
          .min-h-screen { min-height: 100vh; }
          .flex { display: flex; }
          .flex-col { flex-direction: column; }
          .flex-1 { flex: 1 1 auto; }
          .items-end { align-items: flex-end; }
          .grid { display: grid; }
          .gap-2 { gap: 0.5rem; }
          .truncate { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; }
          @media (min-width: 768px) {
            .md\\:grid-cols\\:[1fr_auto_auto_auto] { grid-template-columns: 1fr auto auto auto; }
          }
        `}</style>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    return { props: { error: 'Faltan variables AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID o AWS_SECRET_ACCESS_KEY.', signedUrl: null, original: null, fileName: null, expires: 600 } };
  }

  const src = typeof ctx.query.src === 'string' ? ctx.query.src : '';
  const fn = typeof ctx.query.fn === 'string' ? ctx.query.fn : '';
  const expQ = parseInt((ctx.query.expires as string) || '600', 10);
  const expires = clamp(Number.isFinite(expQ) ? expQ : 600, 60, 3600);

  // Sin src: mostrar formulario sin props "undefined"
  if (!src) {
    return { props: { signedUrl: null, original: null, fileName: null, expires, error: null } };
  }

  const key = extractKeyFromUrlOrKey(src, bucket);
  if (!key) {
    return { props: { error: 'El parámetro src no corresponde a este bucket o es inválido.', original: src, signedUrl: null, fileName: null, expires } };
  }

  const s3 = new AWS.S3({
    region,
    accessKeyId,
    secretAccessKey,
    signatureVersion: 'v4',
  });

  const safeFileName = (fn || key.split('/').pop() || 'archivo.pdf').replace(/"/g, '');
  try {
    const signedUrl = s3.getSignedUrl('getObject', {
      Bucket: bucket,
      Key: key,
      Expires: expires,
      ResponseContentType: 'application/pdf',
      ResponseContentDisposition: `inline; filename="${safeFileName}"`,
    });

    return {
      props: {
        signedUrl,
        original: src,
        fileName: safeFileName,
        expires,
        error: null,
      },
    };
  } catch (e: any) {
    return {
      props: {
        error: e?.message || 'Error firmando la URL',
        original: src,
        signedUrl: null,
        fileName: null,
        expires,
      },
    };
  }
};

export default Page;
