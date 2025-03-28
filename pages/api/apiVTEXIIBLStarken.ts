// pages/api/vtex-order.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import comunasStarken from '../../utils/comunasStarken.json';
import packs from '../../utils/packs.json';

/**
 * Extrae el RUT y el dígito verificador.
 */
function extractRutAndDv(rutWithDv: string): { rut: string; dv: string } {
  if (!rutWithDv) return { rut: '', dv: '' };
  if (rutWithDv.includes('-')) {
    const [rut, dv] = rutWithDv.split('-');
    return { rut, dv };
  } else {
    return { rut: rutWithDv.slice(0, -1), dv: rutWithDv.slice(-1) };
  }
}

/**
 * Calcula el valor declarado multiplicando por 0.01.
 */
function calculateValorDeclarado(value: number): number {
  return value * 0.01;
}

/**
 * Convierte gramos a kilogramos.
 */
function convertGramsToKg(grams: number): number {
  return grams / 1000;
}

/**
 * Busca el código de ciudad y nombre de comuna según el código postal.
 */
function getCodigoCiudadFromPostalCode(
  postalCode: string
): { codigoCiudad: number; nombre: string } | null {
  const found = comunasStarken.find(
    (comuna: any) => comuna.codigoPostal === postalCode
  );
  return found ? { codigoCiudad: found.codigoCiudad, nombre: found.nombre } : null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { orderId } = req.query;
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ message: 'Falta el parámetro orderId en la query' });
  }

  const VTEX_API_URL = `https://blanik.myvtex.com/api/oms/pvt/orders/${orderId}`;
  const API_VTEX_TOKEN_BL = process.env.API_VTEX_TOKEN_BL;
  if (!API_VTEX_TOKEN_BL) {
    return res.status(500).json({ message: 'API_VTEX_TOKEN_BL no está configurada en las variables de entorno' });
  }

  // Datos de configuración de Starken (sin valores por defecto)
  const rutEmpresaEmisora = process.env.RUT_EMPRESA_EMISORA;
  const rutUsuarioEmisor = process.env.RUT_USUARIO_EMISOR;
  const claveUsuarioEmisor = process.env.CLAVE_USUARIO_EMISOR;

  if (!rutEmpresaEmisora || !rutUsuarioEmisor || !claveUsuarioEmisor) {
    return res.status(500).json({ message: 'Faltan variables de entorno para la configuración de Starken (empresa emisora, usuario y clave)' });
  }

  try {
    // Solicitar la orden a VTEX
    const response = await fetch(VTEX_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VTEX-API-AppKey': process.env.API_VTEX_KEY_BL || '',
        'X-VTEX-API-AppToken': API_VTEX_TOKEN_BL,
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en la API de VTEX: ${response.status} - ${errorText}`);
    }
    const data = await response.json();

    // Datos del cliente y dirección
    const clientProfile = data.clientProfileData || {};
    const shippingAddress = data.shippingData?.address || {};

    const { rut, dv } = extractRutAndDv(clientProfile.document || '');
    const nombreRazonSocial =
      clientProfile.corporateName && clientProfile.corporateName.trim() !== ''
        ? clientProfile.corporateName
        : clientProfile.firstName || '';

    const postalCode = shippingAddress.postalCode || '';
    const comunaData = getCodigoCiudadFromPostalCode(postalCode);
    const comunaDestino = comunaData
      ? comunaData.nombre
      : shippingAddress.neighborhood || '';

    // === Procesar items ===
    let items = data.items || [];
    // Filtrar items con SKUs 600003 y 600001
    items = items.filter(item => {
      const sku = item.refId || item.RefId || item.sku || item.itemId || item.productId || '';
      return sku !== '600003' && sku !== '600001';
    });

    interface ProcessedItem {
      sku: string;
      name: string;
      quantity: number;
      weight: number;
    }
    const processedItems: ProcessedItem[] = [];

    for (const item of items) {
      // Buscar el SKU usando refId (o variantes)
      const sku = item.refId || item.RefId || item.sku || item.itemId || item.productId || '';
      // Convertir la cantidad a número; si no es válida, usar 1
      const quantity = Number(item.quantity) || 1;
      console.log(`Procesando item con SKU ${sku}, cantidad recibida: ${item.quantity} convertida a: ${quantity}`);
      
      // Verificar si el SKU es un pack consultando el JSON de packs
      if (sku && packs[sku]) {
        console.log(`Item ${sku} es un pack. Detalles del pack:`, packs[sku]);
        const packInfo = packs[sku];
        for (const component of packInfo.components) {
          const compQuantity = Number(component.quantity) || 1;
          const totalCompQuantity = quantity * compQuantity;
          console.log(`  Procesando componente ${component.sku}: cantidad del pack ${compQuantity}, total calculado: ${totalCompQuantity}`);
          processedItems.push({
            sku: component.sku,
            name: component.name || item.name,
            quantity: totalCompQuantity,
            weight: item.additionalInfo?.dimension
              ? convertGramsToKg(item.additionalInfo.dimension.weight) * totalCompQuantity
              : 0,
          });
        }
      } else {
        console.log(`Item ${sku} no es un pack.`);
        processedItems.push({
          sku: sku,
          name: item.name,
          quantity: quantity,
          weight: item.additionalInfo?.dimension
            ? convertGramsToKg(item.additionalInfo.dimension.weight)
            : 0,
        });
      }
    }

    // Construir "contenido" concatenado y calcular total de kilos
    const contenido = processedItems
      .map(p => `${p.name} x ${p.quantity}`)
      .join(', ');
    const kilosTotal = processedItems.reduce((sum, p) => sum + p.weight, 0);
    // Calcular el total de bultos (suma de las cantidades de cada item)
    const totalBultos = processedItems.reduce((sum, p) => sum + p.quantity, 0);

    console.log('Processed Items:', processedItems);
    console.log(`Total de bultos calculados: ${totalBultos}`);
    console.log(`Contenido final: ${contenido}`);
    console.log(`Kilos totales: ${kilosTotal}`);

    // Usar las dimensiones del primer item, si existe
    const firstDimension = data.items[0]?.additionalInfo?.dimension || {};

    // Armar el objeto de respuesta con la estructura multibulto
    const otData = {
      rutEmpresaEmisora,                    // Variable de entorno
      rutUsuarioEmisor,                     // Variable de entorno
      claveUsuarioEmisor,                   // Variable de entorno
      rutDestinatario: rut,
      dvRutDestinatario: dv,
      nombreRazonSocialDestinatario: nombreRazonSocial,
      apellidoPaternoDestinatario: clientProfile.lastName || '',
      apellidoMaternoDestinatario:
        clientProfile.apellidoMaternoDestinatario &&
        clientProfile.apellidoMaternoDestinatario.trim() !== ''
          ? clientProfile.apellidoMaternoDestinatario
          : 'no-informado',
      direccionDestinatario: shippingAddress.street || '',
      numeracionDireccionDestinatario: shippingAddress.number || '',
      departamentoDireccionDestinatario: shippingAddress.complement || '',
      comunaDestino,                        
      telefonoDestinatario: clientProfile.phone || '',
      emailDestinatario: clientProfile.email || '',
      nombreContactoDestinatario: shippingAddress.receiverName || '',
      tipoEntrega: "2",
      tipoPago: "2",
      centroCostoCtaCte: "0",
      tipoServicio: "0",
      tipoDocumento1: "27",
      numeroDocumento1: data.orderId || '',
      generaEtiquetaDocumento1: "N",
      valorDeclarado: calculateValorDeclarado(data.value),
      contenido,
      kilosTotal,
      alto: firstDimension.height || 0,
      ancho: firstDimension.width || 0,
      largo: firstDimension.length || 0,
      tipoDocumento2: "",
      numeroDocumento2: "",
      generaEtiquetaDocumento2: "",
      tipoDocumento3: "",
      numeroDocumento3: "",
      generaEtiquetaDocumento3: "",
      tipoDocumento4: "",
      numeroDocumento4: "",
      generaEtiquetaDocumento4: "",
      tipoDocumento5: "",
      numeroDocumento5: "",
      generaEtiquetaDocumento5: "",
      // Campos para multibulto
      tipoEncargo1: "29",
      cantidadEncargo1: totalBultos.toString(),
      tipoEncargo2: "",
      cantidadEncargo2: "",
      tipoEncargo3: "",
      cantidadEncargo3: "",
      tipoEncargo4: "",
      cantidadEncargo4: "",
      tipoEncargo5: "",
      cantidadEncargo5: "",
      ciudadOrigenNom: "SANTIAGO",
      observacion: data.orderId || '',
      codAgenciaOrigen: "",
      latitud: "",
      longitud: "",
      precisión: "",
      calidad: "",
      match: ""
    };

    return res.status(200).json(otData);
  } catch (error) {
    console.error('Error al obtener la orden de VTEX:', error);
    return res.status(500).json({ message: 'Error al obtener la orden de VTEX' });
  }
}
