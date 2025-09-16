// lib/samexMapper.ts
import packs from '../utils/packs.json'; // ajusta la ruta si fuera necesario

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

/** Detecta si un SKU es pack y devuelve la suma de cantidades de sus componentes. */
function packComponentsCount(sku: string): number {
  const def = (packs as any)?.[sku];
  if (!def?.components?.length) return 0;
  return def.components.reduce((acc: number, c: any) => acc + (Number(c?.quantity) || 0), 0);
}

/**
 * Intenta obtener dimensiones en cm desde VTEX.
 * Busca primero en items[x].additionalInfo.dimension,
 * luego en shippingData.logisticsInfo[0].dimensions.
 */
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

/**
 * Calcula bultos y kilos:
 * - Prioriza cantidadEncargo1 si viene y es válida (>0).
 * - Si no, suma quantities de items.
 *   Si un SKU es pack, aporta (sum(comp.qty) * item.qty) en lugar de solo item.qty.
 *   Equivalente: base (sum item.qty) + extra por pack ((sumComp - 1) * item.qty).
 * - Kilos: como antes (no multiplicamos por componentes a menos que así lo requieras).
 */
function getBultosYKilos(vtexOrder: any) {
  const items = Array.isArray(vtexOrder?.items) ? vtexOrder.items : [];

  // 1) Si viene explícito, prioriza
  const explicitBultos = toInt(vtexOrder?.cantidadEncargo1, 0);
  if (explicitBultos > 0) {
    // kilos: mismo cálculo que antes
    let kilos = 0;
    for (const it of items) {
      const dim = it?.additionalInfo?.dimension;
      if (dim?.weight) {
        kilos += gramsToKg(dim.weight) * (toInt(it?.quantity, 1) || 1);
      }
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
    return { bultos: explicitBultos, kilos: Math.round(kilos) };
  }

  // 2) Calcular bultos expandiendo packs
  let totalBultos = 0;
  for (const it of items) {
    const q = toInt(it?.quantity, 0);
    if (q <= 0) continue;
    const sku = String(it?.refId || it?.RefId || it?.sku || it?.itemId || it?.productId || '');
    const compCount = packComponentsCount(sku);
    if (compCount > 0) {
      totalBultos += q * compCount;  // el pack vale por sus componentes
    } else {
      totalBultos += q;              // ítem normal
    }
  }
  if (totalBultos <= 0) totalBultos = 1;

  // 3) Kilos igual que hoy (sin multiplicar por componentes, salvo que luego lo pidas)
  let kilos = 0;
  for (const it of items) {
    const dim = it?.additionalInfo?.dimension;
    if (dim?.weight) {
      kilos += gramsToKg(dim.weight) * (toInt(it?.quantity, 1) || 1);
    }
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

  return { bultos: totalBultos, kilos: Math.round(kilos) };
}

/** Calcula volumen (m3) desde dimensiones en cm. */
function volumenM3({ alto, ancho, largo }: { alto: number; ancho: number; largo: number }) {
  const m3 = (alto * ancho * largo) / 1_000_000; // cm^3 -> m^3
  return Number.isFinite(m3) && m3 > 0 ? Number(m3.toFixed(3)) : 0;
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
  const pobRaw             = address?.neighborhood;
  const destinatarioPob    = clip(toPlainLower(pobRaw), 80);

  const { bultos, kilos } = getBultosYKilos(vtexOrder);
  const dims = getDimensions(vtexOrder); // cm
  const alto = String(Math.max(1, dims.alto));
  const ancho= String(Math.max(1, dims.ancho));
  const largo= String(Math.max(1, dims.largo));
  const volM3 = volumenM3({ alto: Number(alto), ancho: Number(ancho), largo: Number(largo) });

  const valor = Math.max(1, Math.round((vtexOrder?.value ?? 0) / 100));

  // Si tu cuenta requiere “clasificación por tipo de bulto”, descomenta TIPOS_BULTO.
  // const TIPOS_BULTO = [
  //   {
  //     TIPO: 'BULTO',
  //     CANTIDAD: String(bultos),
  //     ALTO: Number(alto),
  //     ANCHO: Number(ancho),
  //     LARGO: Number(largo),
  //     VOLUMEN: volM3 > 0 ? String(volM3) : '0.5',
  //     REFERENCIA: "REFERENCIA_BULTO"
  //   },
  // ];

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
    ANCHO: ancho, // cm
    LARGO: largo, // cm
    ALTO:  alto,  // cm
    VOLUMEN: volM3 > 0 ? String(volM3) : '1',

    CLIENTE_REFERENCIA: clip(orderId || 'SIN_REF', 50),
    VALOR_MERCANCIA: String(valor),

    // TIPOS_BULTO,
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
