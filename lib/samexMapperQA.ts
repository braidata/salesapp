// lib/samexMapper.ts
import packs from '../utils/packs.json'; // ajusta la ruta si hace falta

function clip(s: any, max = 50): string {
  if (s == null) return '';
  const str = String(s).trim();
  return str.length > max ? str.slice(0, max) : str;
}

export function toPlainLower(input: any, fallback = ''): string {
  const raw = (input ?? fallback).toString();
  const noAccents = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return noAccents.toLowerCase().replace(/\s+/g, ' ').trim();
}

function toInt(x: any, def = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? Math.trunc(n) : def;
}

function gramsToKg(grams: any) {
  const g = Number(grams);
  if (!Number.isFinite(g) || g <= 0) return 0;
  return g / 1000;
}

function packComponentsCount(sku: string): number {
  const def = (packs as any)?.[sku];
  if (!def?.components?.length) return 0;
  return def.components.reduce((acc: number, c: any) => acc + (Number(c?.quantity) || 0), 0);
}

/** Dimensiones en cm, y peso en gramos cuando esté disponible */
function getDimensions(vtexOrder: any) {
  const items = Array.isArray(vtexOrder?.items) ? vtexOrder.items : [];
  const dimFromItem = items.find((it: any) => it?.additionalInfo?.dimension)?.additionalInfo?.dimension;
  if (dimFromItem) {
    return {
      alto:  toInt(dimFromItem.height, 10),
      ancho: toInt(dimFromItem.width, 10),
      largo: toInt(dimFromItem.length, 10),
      weightGr: toInt(dimFromItem.weight, 0),
    };
  }
  const li0 = Array.isArray(vtexOrder?.shippingData?.logisticsInfo)
    ? vtexOrder.shippingData.logisticsInfo[0] : null;
  const dimFromLog = li0?.dimensions || li0?.dimension || {};
  return {
    alto:  toInt(dimFromLog.height, 10),
    ancho: toInt(dimFromLog.width, 10),
    largo: toInt(dimFromLog.length, 10),
    weightGr: toInt(li0?.weight, 0),
  };
}

/** Bultos y kilos: respeta cantidadEncargo1 si viene; si no, expande packs */
function getBultosYKilos(vtexOrder: any) {
  const items = Array.isArray(vtexOrder?.items) ? vtexOrder.items : [];
  const explicitBultos = toInt(vtexOrder?.cantidadEncargo1, 0);

  let kilos = 0;
  for (const it of items) {
    const dim = it?.additionalInfo?.dimension;
    if (dim?.weight) kilos += gramsToKg(dim.weight) * (toInt(it?.quantity, 1) || 1);
  }
  if (kilos <= 0) {
    const lis = Array.isArray(vtexOrder?.shippingData?.logisticsInfo)
      ? vtexOrder.shippingData.logisticsInfo : [];
    kilos = lis.reduce((acc: number, li: any) => {
      const kg = gramsToKg(li?.weight || 0);
      const q  = toInt(li?.quantity, 1) || 1;
      return acc + kg * q;
    }, 0);
  }
  if (!Number.isFinite(kilos) || kilos <= 0) kilos = 1;

  if (explicitBultos > 0) {
    return { bultos: explicitBultos, kilos: Math.round(kilos) };
  }

  let totalBultos = 0;
  for (const it of items) {
    const q = toInt(it?.quantity, 0);
    if (q <= 0) continue;
    const sku = String(it?.refId || it?.RefId || it?.sku || it?.itemId || it?.productId || '');
    const compCount = packComponentsCount(sku);
    totalBultos += compCount > 0 ? q * compCount : q;
  }
  if (totalBultos <= 0) totalBultos = 1;

  return { bultos: totalBultos, kilos: Math.round(kilos) };
}

/** m3 desde cm */
function volumenM3({ alto, ancho, largo }: { alto: number; ancho: number; largo: number }) {
  const m3 = (alto * ancho * largo) / 1_000_000;
  return Number.isFinite(m3) && m3 > 0 ? Number(m3.toFixed(3)) : 0;
}

/** Construye TIPOS_BULTO por unidad con REFERENCIA = "SKU - Nombre" (packs-aware) */
function buildTiposBultoPerUnit(vtexOrder: any, dims: { alto: number; ancho: number; largo: number }, maxUnits = 50) {
  const items = Array.isArray(vtexOrder?.items) ? vtexOrder.items : [];
  const alto = Math.max(1, toInt(dims.alto, 10));
  const ancho = Math.max(1, toInt(dims.ancho, 10));
  const largo = Math.max(1, toInt(dims.largo, 10));
  const volM3 = volumenM3({ alto, ancho, largo }) || 0.001; // evita 0

  type TB = { TIPO: 'BULTO'; CANTIDAD: '1'; ALTO: number; ANCHO: number; LARGO: number; VOLUMEN: string; REFERENCIA: string; };
  const out: TB[] = [];

  // expandimos packs: cada componente cuenta como 1 unidad a efectos de etiqueta
  for (const it of items) {
    const qty = toInt(it?.quantity, 0);
    if (qty <= 0) continue;

    const sku = String(it?.refId || it?.RefId || it?.sku || it?.itemId || it?.productId || '').trim();
    const name = String(it?.name || '').trim();
    const labelBase = clip([sku, name].filter(Boolean).join(' - '), 48) || 'BULTO';

    const compCount = packComponentsCount(sku);
    const unitCount = compCount > 0 ? qty * compCount : qty;

    for (let i = 1; i <= unitCount; i++) {
      if (out.length >= maxUnits) break; // cap para no explotar el payload
      out.push({
        TIPO: 'BULTO',
        CANTIDAD: '1',
        ALTO: alto,
        ANCHO: ancho,
        LARGO: largo,
        VOLUMEN: String(volM3),
        REFERENCIA: labelBase, // aquí va SKU/Nombre que verás impreso en la etiqueta
      });
    }
  }

  // si no había items (o quedaron 0), dejar al menos 1
  if (out.length === 0) {
    out.push({
      TIPO: 'BULTO',
      CANTIDAD: '1',
      ALTO: alto,
      ANCHO: ancho,
      LARGO: largo,
      VOLUMEN: String(volM3 || 0.001),
      REFERENCIA: 'BULTO',
    });
  }

  return out;
}

export function mapVtexToSamex(vtexOrder: any) {
  const orderId = vtexOrder?.orderId || '';

  // ---------- Remitente desde ENV ----------
  const CLIENTE_REMITENTE = process.env.SAMEX_CLIENTE_REMITENTE;
  const CENTRO_REMITENTE  = process.env.SAMEX_CENTRO_REMITENTE ;
  const NIF_REMITENTE     = process.env.SAMEX_NIF_REMITENTE    ;
  const NOMBRE_REMITENTE  = process.env.SAMEX_NOMBRE_REMITENTE  || 'IMEGA VENTUS SPA';
  const DIRECCION_REM     = process.env.SAMEX_DIRECCION_REMITENTE;
  const POBLACION_REM     = 'santiago';
  const TELEFONO_REM      = process.env.SAMEX_TELEFONO_REMITENTE ;
  const EMAIL_REM         = clip(process.env.SAMEX_EMAIL_REMITENTE, 50);

  if (!CLIENTE_REMITENTE || !CENTRO_REMITENTE) {
    throw new Error('Faltan SAMEX_CLIENTE_REMITENTE o SAMEX_CENTRO_REMITENTE en env.');
  }

  // ---------- VTEX ----------
  const shipping  = vtexOrder?.shippingData || {};
  const address   = shipping?.address || {};
  const client    = vtexOrder?.clientProfileData || {};

  const EMAIL_DESTINATARIO_FORZADO = clip('ivan.braida@imegaventus.cl', 50);
  const destinatarioNombre = clip(`${client.firstName || ''} ${client.lastName || ''}`.trim(), 80);
  const destinatarioRut    = clip(client.document || '', 50);
  const destinatarioFono   = clip(client.phone || '', 30);
  const destinatarioDir    = clip([address?.street, address?.number].filter(Boolean).join(' ') || address?.street || '', 120);
  const pobRaw             = address?.neighborhood ?? address?.city ?? '';
  const destinatarioPob    = clip(toPlainLower(pobRaw), 80);

  const { bultos, kilos } = getBultosYKilos(vtexOrder);
  const dims = getDimensions(vtexOrder); // cm
  const alto = String(Math.max(1, dims.alto));
  const ancho= String(Math.max(1, dims.ancho));
  const largo= String(Math.max(1, dims.largo));
  const volM3 = volumenM3({ alto: Number(alto), ancho: Number(ancho), largo: Number(largo) });

  const valor = Math.max(1, Math.round((vtexOrder?.value ?? 0) / 100));

  // TIPOS_BULTO por unidad con REFERENCIA = "SKU - Nombre"
  const TIPOS_BULTO = buildTiposBultoPerUnit(vtexOrder, { alto: Number(alto), ancho: Number(ancho), largo: Number(largo) }, 80);
  // Si por límite se agruparon, `NUMERO_BULTOS` mantiene el total real; SAMEX acepta ambos.

  const doc: Record<string, any> = {
    NUMERO_BULTOS: String(bultos),

    CLIENTE_REMITENTE: clip(CLIENTE_REMITENTE, 20),
    CENTRO_REMITENTE:  clip(CENTRO_REMITENTE, 10),
    NIF_REMITENTE:     clip(NIF_REMITENTE, 20),
    NOMBRE_REMITENTE:  clip(NOMBRE_REMITENTE, 80),
    DIRECCION_REMITENTE: clip(DIRECCION_REM, 120),
    PAIS_REMITENTE: 'CL',
    POBLACION_REMITENTE: clip(POBLACION_REM, 80),
    TELEFONO_CONTACTO_REMITENTE: clip(TELEFONO_REM, 30),
    EMAIL_REMITENTE: EMAIL_REM,

    NIF_DESTINATARIO: destinatarioRut,
    NOMBRE_DESTINATARIO: destinatarioNombre,
    DIRECCION_DESTINATARIO: destinatarioDir,
    POBLACION_DESTINATARIO: destinatarioPob,
    TELEFONO_CONTACTO_DESTINATARIO: destinatarioFono,
    EMAIL_DESTINATARIO: EMAIL_DESTINATARIO_FORZADO,

    CODIGO_PRODUCTO_SERVICIO: '01',
    TIPOS_PORTES: 'P',

    KILOS: String(kilos),
    ANCHO: ancho,
    LARGO: largo,
    ALTO:  alto,
    VOLUMEN: volM3 > 0 ? String(volM3) : '1',

    CLIENTE_REFERENCIA: clip(orderId || 'SIN_REF', 50),
    VALOR_MERCANCIA: String(valor),

    TIPOS_BULTO, // ⬅️ aquí viaja el SKU/Nombre en REFERENCIA de cada bulto
    TIPOS_DOCUMENTO: [
      { TIPO: 'GD', REFERENCIA: clip(orderId || 'SIN_REF', 50) },
    ],

    ENVIO_DEFINITIVO: 'N',
    ENVIO_CON_RECOGIDA: 'N',
    IMPRIMIR_ETIQUETA: 'S',
    TIPO_FORMATO: 'PDF',
  };

  return { DOCUMENTAR_ENVIOS: { VERSION: '2', DOCUMENTAR_ENVIO: [doc] } };
}
