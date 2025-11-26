// lib/samexMapper.ts
import packs from '../utils/packs.json'; // ajusta la ruta si fuera necesario

function cleanReferencia(text: string): string {
  // Elimina caracteres especiales, solo deja letras, números, espacios y guiones
  return text
    .replace(/[,+]/g, '') // quita comas y signos +
    .replace(/[^a-zA-Z0-9\s\-]/g, '') // solo alfanuméricos, espacios y guiones
    .replace(/\s+/g, ' ') // normaliza espacios
    .trim();
}

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

/** Detecta si un SKU es pack y devuelve sus componentes con cantidades. */
function getPackComponents(sku: string): Array<{ sku: string; quantity: number }> | null {
  const def = (packs as any)?.[sku];
  if (!def?.components?.length) return null;
  return def.components.map((c: any) => ({
    sku: String(c?.sku || ''),
    quantity: Number(c?.quantity) || 1
  }));
}

/** Calcula volumen (m3) desde dimensiones en cm. */
function volumenM3({ alto, ancho, largo }: { alto: number; ancho: number; largo: number }) {
  const m3 = (alto * ancho * largo) / 1_000_000; // cm^3 -> m^3
  return Number.isFinite(m3) && m3 > 0 ? Number(m3.toFixed(3)) : 0.001; // mínimo 0.001 m3
}

/**
 * Obtiene dimensiones de un item específico.
 */
function getItemDimensions(item: any) {
  const dim = item?.additionalInfo?.dimension;
  return {
    alto: toInt(dim?.height, 10),
    ancho: toInt(dim?.width, 10),
    largo: toInt(dim?.length, 10),
    weightGr: toInt(dim?.weight, 100),
  };
}

/**
 * Genera el array TIPOS_BULTO con un bulto por unidad para identificación individual.
 * Cada bulto tiene CANTIDAD "1" y su propia referencia numerada.
 */
function generarTiposBulto(vtexOrder: any) {
  const items = Array.isArray(vtexOrder?.items) ? vtexOrder.items : [];
  const tiposBulto: any[] = [];
  let contadorGlobal = 1; // Numeración global de bultos

  for (const item of items) {
    const quantity = toInt(item?.quantity, 0);
    if (quantity <= 0) continue;

    const sku = String(item?.refId || item?.RefId || item?.sku || item?.itemId || item?.productId || '');
    const nombre = clip(item?.name || item?.productName || `Producto ${sku}`, 50);
    const dims = getItemDimensions(item);
    const volUnitario = volumenM3(dims);
    
    // Verificar si es un pack
    const packComponents = getPackComponents(sku);
    
    if (packComponents && packComponents.length > 0) {
      // Es un pack: cada componente se expande
      for (let i = 0; i < quantity; i++) {
        for (const comp of packComponents) {
          for (let j = 0; j < comp.quantity; j++) {
            tiposBulto.push({
              TIPO: 'BULTO',
              CANTIDAD: '1',
              ALTO: Math.max(1, dims.alto),
              ANCHO: Math.max(1, dims.ancho),
              LARGO: Math.max(1, dims.largo),
              VOLUMEN: volUnitario >= 0.1 ? volUnitario.toFixed(1) : (volUnitario > 0 ? volUnitario.toFixed(3) : '0.5'),
              REFERENCIA: `${contadorGlobal} - ${clip(cleanReferencia(nombre), 35)}`
            });
            contadorGlobal++;
          }
        }
      }
    } else {
      // Item normal: un bulto por cada unidad
      for (let i = 0; i < quantity; i++) {
        tiposBulto.push({
          TIPO: 'BULTO',
          CANTIDAD: '1',
          ALTO: Math.max(1, dims.alto),
          ANCHO: Math.max(1, dims.ancho),
          LARGO: Math.max(1, dims.largo),
          VOLUMEN: volUnitario >= 0.1 ? volUnitario.toFixed(1) : (volUnitario > 0 ? volUnitario.toFixed(3) : '0.5'),
          REFERENCIA: `${contadorGlobal} - ${clip(cleanReferencia(nombre), 35)}`
        });
        contadorGlobal++;
      }
    }
  }

  return tiposBulto;
}

/**
 * Calcula totales: bultos, kilos, dimensión máxima y volumen total
 */
function calcularTotales(vtexOrder: any, tiposBulto: any[]) {
  const items = Array.isArray(vtexOrder?.items) ? vtexOrder.items : [];
  
  // Total de bultos: sumar las cantidades de TIPOS_BULTO
  const totalBultos = tiposBulto.reduce((sum, b) => sum + (Number(b.CANTIDAD) || 0), 0) || 1;

  // Calcular kilos totales
  let totalKilos = 0;
  for (const item of items) {
    const q = toInt(item?.quantity, 0);
    if (q <= 0) continue;
    
    const dims = getItemDimensions(item);
    const sku = String(item?.refId || item?.RefId || item?.sku || item?.itemId || item?.productId || '');
    const packComponents = getPackComponents(sku);
    
    if (packComponents && packComponents.length > 0) {
      // Pack: multiplicar por total de componentes
      const totalCompQty = packComponents.reduce((sum, c) => sum + c.quantity, 0);
      totalKilos += gramsToKg(dims.weightGr) * q * totalCompQty;
    } else {
      // Item normal
      totalKilos += gramsToKg(dims.weightGr) * q;
    }
  }

  if (totalKilos <= 0) {
    // Fallback: usar logisticsInfo si no hay peso en items
    const lis = Array.isArray(vtexOrder?.shippingData?.logisticsInfo)
      ? vtexOrder.shippingData.logisticsInfo : [];
    totalKilos = lis.reduce((acc: number, li: any) => {
      const kg = gramsToKg(li?.weight || 0);
      const q = toInt(li?.quantity, 1) || 1;
      return acc + kg * q;
    }, 0);
  }

  if (!Number.isFinite(totalKilos) || totalKilos <= 0) totalKilos = 1;

  // Dimensión máxima (para nivel global del envío)
  let maxAlto = 10, maxAncho = 10, maxLargo = 10;
  for (const bulto of tiposBulto) {
    maxAlto = Math.max(maxAlto, Number(bulto.ALTO) || 10);
    maxAncho = Math.max(maxAncho, Number(bulto.ANCHO) || 10);
    maxLargo = Math.max(maxLargo, Number(bulto.LARGO) || 10);
  }

  // Volumen total: directamente la suma (ya viene multiplicado por cantidad)
  const volumenTotal = tiposBulto.reduce((sum, b) => sum + (Number(b.VOLUMEN) || 0), 0);

  return {
    bultos: totalBultos,
    kilos: Math.round(totalKilos),
    alto: maxAlto,
    ancho: maxAncho,
    largo: maxLargo,
    volumenTotal: volumenTotal > 0 ? volumenTotal : 0.001
  };
}

export function mapVtexToSamex(vtexOrder: any) {
  const orderId = vtexOrder?.orderId || '';

  // ---------- Remitente desde ENV ----------
  const CLIENTE_REMITENTE = process.env.SAMEX_CLIENTE_REMITENTEQA;
  const CENTRO_REMITENTE  = process.env.SAMEX_CENTRO_REMITENTE;
  const NIF_REMITENTE     = process.env.SAMEX_NIF_REMITENTE;
  const NOMBRE_REMITENTE  = process.env.SAMEX_NOMBRE_REMITENTE  || 'IMEGA VENTUS SPA';
  const DIRECCION_REM     = process.env.SAMEX_DIRECCION_REMITENTE;
  const POBLACION_REM     = process.env.SAMEX_POBLACION_REMITENTE || 'santiago';
  const TELEFONO_REM      = process.env.SAMEX_TELEFONO_REMITENTE;
  const EMAIL_REM         = clip(process.env.SAMEX_EMAIL_REMITENTE, 50);

  if (!CLIENTE_REMITENTE || !CENTRO_REMITENTE) {
    throw new Error('Faltan SAMEX_CLIENTE_REMITENTE o SAMEX_CENTRO_REMITENTE en env.');
  }

  // ---------- Destinatario desde VTEX ----------
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

  // ---------- Generar bultos individuales ----------
  const tiposBulto = generarTiposBulto(vtexOrder);
  const totales = calcularTotales(vtexOrder, tiposBulto);

  const valor = Math.max(1, Math.round((vtexOrder?.value ?? 0) / 100));

  const doc: Record<string, any> = {
    NUMERO_BULTOS: String(totales.bultos),

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

    KILOS: String(totales.kilos),
    // ANCHO: String(totales.ancho),
    // LARGO: String(totales.largo),
    // ALTO:  String(totales.alto),
    // VOLUMEN: totales.volumenTotal >= 0.1 ? totales.volumenTotal.toFixed(1) : totales.volumenTotal.toFixed(3),

    CLIENTE_REFERENCIA: clip(orderId || 'SIN_REF', 50),
    VALOR_MERCANCIA: String(valor),

    TIPOS_BULTO: tiposBulto,
    
    TIPOS_DOCUMENTO: [
      { TIPO: 'GD', REFERENCIA: clip(orderId || 'SIN_REF', 50) },
    ],

    ENVIO_DEFINITIVO: 'N',
    ENVIO_CON_RECOGIDA: 'N',
    IMPRIMIR_ETIQUETA: 'S',
    TIPO_FORMATO: 'PDF',
  };

  const result = { DOCUMENTAR_ENVIOS: { VERSION: '2', DOCUMENTAR_ENVIO: [doc] } };
  
  // DEBUG
  console.log('=== SAMEX DEBUG ===');
  console.log(JSON.stringify(result, null, 2));
  console.log('Suma VOLUMEN en TIPOS_BULTO:', tiposBulto.reduce((s, b) => s + Number(b.VOLUMEN), 0));
  console.log('VOLUMEN global:', doc.VOLUMEN);
  
  return result;
}