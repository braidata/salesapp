// pages/api/apiVTEXIIBL99.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createShippingOrder } from '../../lib/shippingService';
import { geocodeAddresses } from '../../lib/coverageService';
import { startTokenManager } from '../../lib/tokenManager';
import packs from '../../utils/packs.json';

// Aseguramos que el token manager esté iniciado
let tokenManagerInitialized = false;

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
 * Convierte gramos a kilogramos.
 */
function convertGramsToKg(grams: number): number {
  return grams / 1000;
}

/**
 * Función para determinar el tamaño del paquete basado en dimensiones.
 */
function determinePackageSize(length: number, width: number, height: number, weight: number): string {
  const volume = length * width * height;
  if (volume > 30000 || weight > 2000) return "l";
  if (volume < 5000 && weight < 500) return "s";
  return "m";
}

/**
 * Mapea datos de VTEX a formato para 99minutos (estructura inicial con shipment).
 * @param vtexData Datos de la orden de VTEX
 * @param forcedDeliveryType 'sameday' o 'nextday' para forzar el tipo de entrega
 */
async function mapVtexOrderTo99Minutos(vtexData: any, forcedDeliveryType?: string): Promise<any> {
  if (!tokenManagerInitialized) {
    console.log('Iniciando TokenManager desde mapeo VTEX->99min...');
    await startTokenManager();
    tokenManagerInitialized = true;
  }

  const clientProfile = vtexData.clientProfileData || {};
  const shippingAddress = vtexData.shippingData?.address || {};
  const items = vtexData.items || [];

  // Dirección de origen fija (bodega o punto de despacho)
  const originAddress: any = {
    address: process.env.ORIGIN_ADDRESS || "La Siembra Poniente 3404, Lampa, Santiago",
    country: "CHL",
    reference: process.env.ORIGIN_REFERENCE || "Bodega principal"
  };

  // Procesar dirección de destino
  const street = shippingAddress.street || '';
  const number = shippingAddress.number || '';
  const neighborhood = shippingAddress.neighborhood || '';
  const city = shippingAddress.city || 'Santiago';
  const complement = shippingAddress.complement || '';

  const destinationAddress: any = {
    address: `${street} ${number}, ${neighborhood}, ${city}`,
    country: "CHL",
    reference: complement || 'Sin referencia adicional'
  };

  // Geocodificar dirección de origen si no hay coordenadas predefinidas
  if (!process.env.ORIGIN_LAT || !process.env.ORIGIN_LNG) {
    try {
      console.log('Geocodificando dirección de origen...');
      const originGeoData = await geocodeAddresses({
        addresses: [originAddress.address],
        country: "CHL"
      });

      if (originGeoData.data && originGeoData.data.length > 0) {
        const location = originGeoData.data[0];
        originAddress.lat = parseFloat(location.latitude);
        originAddress.lng = parseFloat(location.longitude);
        console.log('Origen geocodificado:', originAddress);
      } else {
        console.error('No se pudo geocodificar la dirección de origen');
      }
    } catch (error) {
      console.error('Error geocodificando origen:', error);
    }
  } else {
    originAddress.lat = parseFloat(process.env.ORIGIN_LAT);
    originAddress.lng = parseFloat(process.env.ORIGIN_LNG);
  }

  // Geocodificar dirección de destino
  try {
    console.log('Geocodificando dirección de destino...');
    const destGeoData = await geocodeAddresses({
      addresses: [destinationAddress.address],
      country: "CHL"
    });

    if (destGeoData.data && destGeoData.data.length > 0) {
      const location = destGeoData.data[0];
      destinationAddress.lat = parseFloat(location.latitude);
      destinationAddress.lng = parseFloat(location.longitude);
      console.log('Destino geocodificado:', destinationAddress);
    } else {
      console.error('No se pudo geocodificar la dirección de destino');
    }
  } catch (error) {
    console.error('Error geocodificando destino:', error);
  }

  // Datos del destinatario
  const recipientFirstName = clientProfile.firstName || '';
  const recipientLastName = clientProfile.lastName || '';

  // Procesamiento de ítems para las cajas
  const boxes: any[] = [];
  let boxCounter = 1;
  const filteredItems = items.filter((item: { refId: any; RefId: any; sku: any; itemId: any; productId: any; }) => {
    const sku = item.refId || item.RefId || item.sku || item.itemId || item.productId || '';
    return sku !== '600003' && sku !== '600001';
  });

  // Determinar tipo de entrega
  let deliveryType = forcedDeliveryType || "nextday"; // Usar el tipo forzado si se proporciona

  if (!forcedDeliveryType && vtexData.shippingData && vtexData.shippingData.logisticsInfo) {
    const logisticsInfo = vtexData.shippingData.logisticsInfo;
    for (const info of logisticsInfo) {
      const deliveryChannel = info.deliveryChannel || '';
      const selectedSla = info.selectedSla || '';

      // Comprobar específicamente los servicios de 99minutos
      if (selectedSla === '99MinSameday' || selectedSla.toLowerCase().includes('99minsameday')) {
        deliveryType = "sameday";
        console.log('Se detectó entrega 99MinSameday');
        break;
      } else if (selectedSla === '99MinNextday' || selectedSla.toLowerCase().includes('99minnextday')) {
        deliveryType = "nextday";
        console.log('Se detectó entrega 99MinNextday');
        break;
      }

      // Mantener la detección por palabras clave como respaldo
      const sameDayKeywords = ['sameday', 'mismo día', 'mismo dia', 'hoy', 'express', 'rápido', 'rapido'];
      const isSameDay = sameDayKeywords.some(keyword =>
        deliveryChannel.toLowerCase().includes(keyword) || selectedSla.toLowerCase().includes(keyword)
      );
      if (isSameDay) {
        deliveryType = "sameday";
        console.log('Se detectó entrega same day por palabras clave');
        break;
      }
    }
  }

  console.log(`Tipo de entrega determinado: ${deliveryType}`);

  // Procesar ítems y packs para armar las cajas
  for (const item of filteredItems) {
    const sku = item.refId || item.RefId || item.sku || item.itemId || item.productId || '';
    const quantity = Number(item.quantity) || 1;
    if (sku && packs[sku]) {
      console.log(`Item ${sku} es un pack:`, packs[sku]);
      const packBox: any = {
        internalKey: `${vtexData.orderId}-PACK-${sku}-${boxCounter}`,
        deliveryType: deliveryType,
        items: []
      };
      for (const component of packs[sku].components) {
        const compQuantity = Number(component.quantity) || 1;
        const totalWeight = component.weight ? component.weight * compQuantity : 500;
        packBox.items.push({
          size: component.size || determinePackageSize(
            component.length || 30,
            component.width || 20,
            component.height || 5,
            totalWeight
          ),
          description: component.name || `Componente de ${item.name}`,
          weight: totalWeight,
          length: component.length || 30,
          width: component.width || 20,
          height: component.height || 5
        });
      }
      if (packBox.items.length > 0) {
        boxes.push(packBox);
        boxCounter++;
      }
    } else {
      const dimensions = item.additionalInfo?.dimension || {};
      const weight = dimensions.weight ? Math.round(dimensions.weight) : 500;
      const length = dimensions.length || 30;
      const width = dimensions.width || 20;
      const height = dimensions.height || 5;
      const size = determinePackageSize(length, width, height, weight);
      for (let i = 0; i < quantity; i++) {
        boxes.push({
          internalKey: `${vtexData.orderId}-ITEM-${sku}-${boxCounter}`,
          deliveryType: deliveryType,
          items: [
            {
              size: size,
              description: item.name || 'Producto',
              weight: weight,
              length: length,
              width: width,
              height: height
            }
          ]
        });
        boxCounter++;
      }
    }
  }

  if (boxes.length === 0) {
    boxes.push({
      internalKey: `${vtexData.orderId}-DEFAULT-1`,
      deliveryType: deliveryType,
      items: [
        {
          size: "m",
          description: "Paquete",
          weight: 500,
          length: 30,
          width: 20,
          height: 5
        }
      ]
    });
  }

  // Armar la estructura inicial con shipment
  const orderDataWithShipment = {
    shipment: {
      internalKey: vtexData.orderId || `ORDER-${Date.now()}`,
      deliveryType: deliveryType,
      sender: {
        firstName: process.env.SENDER_FIRST_NAME || "Blanik",
        lastName: process.env.SENDER_LAST_NAME || "Imega Ventus",
        phone: process.env.SENDER_PHONE || "+56966677849",
        email: process.env.SENDER_EMAIL || "rene.salazar@imegaventus.cl"
      },
      recipient: {
        firstName: recipientFirstName,
        lastName: recipientLastName,
        phone: clientProfile.phone || "+56900000000",
        email: clientProfile.email || "cliente@ejemplo.cl"
      },
      origin: originAddress,
      destination: destinationAddress,
      payments: {
        paymentMethod: "cash",
        cashOnDelivery: {
          amount: 0,
          currency: "CLP"
        },
        insured: false
      },
      boxes: boxes.map(box => ({
        ...box,
        deliveryType: box.deliveryType || deliveryType
      }))
    }
  };

  // Función para "aplanar" el objeto: extrae el contenido de shipment y lo coloca a nivel raíz
  function flattenOrderData(data: any): any {
    if (data.shipment) {
      const shipment = data.shipment;
      return {
        apikey: process.env.KEY_99,
        deliveryType: shipment.deliveryType,
        packageSize: 'l',
        notes: shipment.destination.reference,
        packages: shipment.boxes.length,
        cashOnDelivery: shipment.payments.paymentMethod === 'cash',
        amountCash: shipment.payments.cashOnDelivery.amount,
        SecurePackage: shipment.payments.insured,
        amountSecure: 0,
        receivedId: shipment.internalKey,
        origin: {
          sender: `${shipment.sender.firstName} ${shipment.sender.lastName}`,
          nameSender: shipment.sender.firstName,
          lastNameSender: shipment.sender.lastName,
          emailSender: shipment.sender.email,
          phoneSender: shipment.sender.phone,
          addressOrigin: shipment.origin.address,
          numberOrigin: shipment.origin.reference,
          codePostalOrigin: '0000000',
          country: shipment.origin.country
        },
        destination: {
          receiver: `${shipment.recipient.firstName} ${shipment.recipient.lastName}`,
          nameReceiver: shipment.recipient.firstName,
          lastNameReceiver: shipment.recipient.lastName,
          emailReceiver: shipment.recipient.email,
          phoneReceiver: shipment.recipient.phone,
          addressDestination: shipment.destination.address,
          numberDestination: shipment.destination.reference,
          codePostalDestination: '0000000',
          country: shipment.destination.country
        },
        boxes: shipment.boxes.map((box: any) => ({
          ...box,
          deliveryType: box.deliveryType || shipment.deliveryType
        }))
      };
    }
    return data;
  }

  const flatData = flattenOrderData(orderDataWithShipment);
  console.log('Datos mapeados para 99minutos (estructura plana):', JSON.stringify(flatData, null, 2));
  return flatData;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=== INICIO apiVTEXIIBL99 ===');

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const orderId = req.query.orderId || (req.method === 'POST' && req.body && req.body.orderId) || null;
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ message: 'Falta el parámetro orderId' });
  }

  // Obtener el deliveryType forzado (si se proporciona)
  const forcedDeliveryType = req.query.deliveryType ||
    (req.method === 'POST' && req.body && req.body.deliveryType) ||
    null;

  console.log(`Procesando orden VTEX: ${orderId}${forcedDeliveryType ? ', tipo de entrega forzado: ' + forcedDeliveryType : ''}`);

  const VTEX_API_URL = `https://blanik.myvtex.com/api/oms/pvt/orders/${orderId}`;
  const API_VTEX_TOKEN_BL = process.env.API_VTEX_TOKEN_BL;
  const API_VTEX_KEY_BL = process.env.API_VTEX_KEY_BL;

  if (!API_VTEX_TOKEN_BL || !API_VTEX_KEY_BL) {
    return res.status(500).json({ message: 'Faltan credenciales VTEX en variables de entorno' });
  }

  try {
    // Configurar timeout para la solicitud a VTEX
    const vtexAbortController = new AbortController();
    const vtexTimeoutId = setTimeout(() => vtexAbortController.abort(), 30000); // 30 segundos

    console.log('Solicitando datos a VTEX API...');
    let response;
    try {
      response = await fetch(VTEX_API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-VTEX-API-AppKey': API_VTEX_KEY_BL,
          'X-VTEX-API-AppToken': API_VTEX_TOKEN_BL,
        },
        signal: vtexAbortController.signal
      });
      clearTimeout(vtexTimeoutId);
    } catch (error) {
      console.error(`Timeout o error en la solicitud a VTEX: ${error.message}`);
      throw new Error(`Timeout o error en la solicitud a VTEX: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error en la API de VTEX: ${response.status} - ${errorText}`);
      throw new Error(`Error en la API de VTEX: ${response.status} - ${errorText}`);
    }

    const vtexData = await response.json();
    console.log('Datos VTEX recibidos correctamente');

    console.log('Mapeando datos VTEX a formato 99minutos...');
    const data99min = await mapVtexOrderTo99Minutos(vtexData, forcedDeliveryType as string);

    const createOrder = req.query.createOrder === 'true' ||
      (req.method === 'POST' && req.body && req.body.createOrder === true);

    if (createOrder) {
      console.log('Creando orden en 99minutos...');
      try {
        // Configurar timeout para la solicitud a 99minutos
        const shippingAbortController = new AbortController();
        const shippingTimeoutId = setTimeout(() => shippingAbortController.abort(), 60000); // 60 segundos

        const orderResponse = await createShippingOrder(data99min);
        clearTimeout(shippingTimeoutId);

        console.log('Orden creada exitosamente en 99minutos:', orderResponse);

        // Extraer el ID de seguimiento correctamente
        let nroOrdenFlete = null;

        // Para respuestas del tipo array (creación multibulto)
        if (orderResponse && orderResponse.data && Array.isArray(orderResponse.data) && orderResponse.data.length > 0) {
          // Tomar el trackingid del primer elemento (orden principal)
          nroOrdenFlete = orderResponse.data[0].trackingid || orderResponse.data[0].counter || null;
          console.log(`ID de seguimiento identificado (trackingid): ${nroOrdenFlete}`);
        }
        // Para respuestas de tipo objeto único
        else if (orderResponse && orderResponse.data) {
          nroOrdenFlete = orderResponse.data.trackingid || orderResponse.data.id || orderResponse.data.receivedId || null;
          console.log(`ID de seguimiento identificado (respuesta directa): ${nroOrdenFlete}`);
        }

        if (!nroOrdenFlete) {
          console.warn('No se encontró el ID de seguimiento en la respuesta de 99minutos:', orderResponse);
        }

        return res.status(200).json({
          success: true,
          message: 'Orden creada exitosamente en 99minutos',
          vtexOrderId: orderId,
          nineteenMinutesOrder: orderResponse,
          nroOrdenFlete, // Incluir explícitamente para facilitar su extracción
          requestData: data99min
        });
      } catch (error) {
        console.error('Error creando orden en 99minutos:', error);
        return res.status(500).json({
          success: false,
          message: 'Error creando orden en 99minutos',
          error: error instanceof Error ? error.message : 'Error desconocido',
          requestData: data99min
        });
      }
    } else {
      console.log('Devolviendo datos mapeados (sin crear orden)');
      return res.status(200).json({
        success: true,
        message: 'Datos mapeados exitosamente',
        data: data99min
      });
    }
  } catch (error) {
    console.error('Error procesando orden VTEX:', error);
    return res.status(500).json({
      success: false,
      message: 'Error procesando orden VTEX',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  } finally {
    console.log('=== FIN apiVTEXIIBL99 ===');
  }
}