// pages/api/vtex-order.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import comunasStarken from '../../utils/comunasStarken.json';

/**
 * Extrae el RUT y el dígito verificador.
 * Si el RUT contiene un guión, se separa en ambas partes.
 * Si no, se asume que el último carácter es el dígito verificador.
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
 * Calcula el valor declarado multiplicando el valor recibido por 0.01.
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
 * Busca en el JSON de comunas de Starken el registro que corresponda al código postal recibido.
 * Retorna el código de ciudad y el nombre de la comuna.
 */
function getCodigoCiudadFromPostalCode(
  postalCode: string
): { codigoCiudad: number; nombre: string } | null {
  // Se busca el registro que tenga el mismo código postal
  const found = comunasStarken.find(
    (comuna: any) => comuna.codigoPostal === postalCode
  );
  if (found) {
    return { codigoCiudad: found.codigoCiudad, nombre: found.nombre };
  }
  return null;
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
    return res
      .status(400)
      .json({ message: 'Falta el parámetro orderId en la query' });
  }

  const VTEX_API_URL = `https://imegab2c.myvtex.com/api/oms/pvt/orders/${orderId}`;
  const API_VTEX_TOKEN = process.env.API_VTEX_TOKEN;

  if (!API_VTEX_TOKEN) {
    return res.status(500).json({
      message: 'API_VTEX_TOKEN no está configurada en las variables de entorno',
    });
  }

  try {
    const response = await fetch(VTEX_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VTEX-API-AppKey': process.env.API_VTEX_KEY || '', // Asegúrate de que esta variable contenga la clave correcta
        'X-VTEX-API-AppToken': API_VTEX_TOKEN,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en la API de VTEX: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Extraer datos principales de la orden VTEX
    const clientProfile = data.clientProfileData || {};
    const shippingAddress = data.shippingData?.address || {};
    const item = data.items && data.items.length > 0 ? data.items[0] : null;
    const dimension = item?.additionalInfo?.dimension;

    // Procesar el RUT y dígito verificador
    const rutField = clientProfile.document || '';
    const { rut, dv } = extractRutAndDv(rutField);

    // Definir nombre o razón social (según si es persona natural o jurídica)
    const nombreRazonSocial =
      clientProfile.corporateName && clientProfile.corporateName.trim() !== ''
        ? clientProfile.corporateName
        : clientProfile.firstName || '';

    // Buscar el código de ciudad y nombre de comuna en base al código postal
    const postalCode = shippingAddress.postalCode || '';
    const comunaData = getCodigoCiudadFromPostalCode(postalCode);
    const codigoCiudad = comunaData ? comunaData.codigoCiudad : null;
    const comunaNombre = comunaData ? comunaData.nombre : shippingAddress.neighborhood || '';

    // Construir el objeto que se enviará a la API de Starken
    const otData = {
      rutDestinatario: rut,
      dvRutDestinatario: dv,
      nombreRazonSocialDestinatario: nombreRazonSocial,
      apellidoPaternoDestinatario: clientProfile.lastName || '',
      // Si no hay apellido materno, se asigna un guion
      apellidoMaternoDestinatario: clientProfile.apellidoMaternoDestinatario && clientProfile.apellidoMaternoDestinatario.trim() !== ''
        ? clientProfile.apellidoMaternoDestinatario
        : 'no-informado',
      direccionDestinatario: shippingAddress.street || '',
      numeracionDireccionDestinatario: shippingAddress.number || '',
      departamentoDireccionDestinatario: shippingAddress.complement || '', // "complement" se usará como departamento
      // Se utilizan los datos del lookup mediante código postal:
      codigoCiudad, // Código de ciudad obtenido del JSON de comunas de Starken
      comunaDestino: comunaNombre, // Nombre de comuna
      telefonoDestinatario: clientProfile.phone || '',
      emailDestinatario: clientProfile.email || '',
      nombreContactoDestinatario: shippingAddress.receiverName || '',

      valorDeclarado: calculateValorDeclarado(data.value), // Valor declarado (value * 0.01)
      // Variable adicional para Starken: numeroDocumento1 con el orderId
      numeroDocumento1: data.orderId || '',
      contenido: item?.name || '',
      kilosTotal: dimension ? convertGramsToKg(dimension.weight) : 0,
      alto: dimension?.height || 0,
      ancho: dimension?.width || 0,
      largo: dimension?.length || 0,
      ciudadOrigenNom: 'SANTIAGO', // Valor predefinido según el origen del despacho
      observacion: data.orderId || '',

    };

    return res.status(200).json(otData);
  } catch (error) {
    console.error('Error al obtener la orden de VTEX:', error);
    return res.status(500).json({ message: 'Error al obtener la orden de VTEX' });
  }
}
