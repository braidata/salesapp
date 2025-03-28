// lib/shippingService.ts con registros de depuración mejorados para multibulto

import { getToken } from './tokenManager';
import { geocodeAddresses } from './coverageService';

// [Interfaces se mantienen o se actualizan según convenga...]

/**
 * Crea una orden de envío multibulto con 99minutos con logs detallados
 * @param orderData Datos para la creación de la orden en formato multibulto
 * @returns Respuesta con información de la orden creada
 */
export async function createShippingOrder(orderData: any): Promise<any> {
  console.log('=== INICIO CREACIÓN DE ORDEN MULTIBULTO ===');
  const token = getToken();

  if (!token) {
    console.error('ERROR: No hay token disponible');
    throw new Error('No hay token disponible para realizar la petición');
  }

  console.log('Token obtenido correctamente:', token.substring(0, 20) + '...');

  try {
    // Registro detallado de los datos de envío
    console.log('Datos de orden a enviar:');
    console.log(JSON.stringify(orderData, null, 2));

    // Validación manual para identificar problemas en la estructura multibulto
    console.log('Validando estructura de shipment:');
    if (!orderData.shipment) {
      console.error('ERROR: Falta el campo shipment');
    } else {
      console.log('- shipment: OK');
      const { sender, recipient, origin, destination, payments, boxes, deliveryType, internalKey } = orderData.shipment;
      if (!sender) console.error('- ERROR: Falta sender en shipment');
      if (!recipient) console.error('- ERROR: Falta recipient en shipment');
      if (!origin) console.error('- ERROR: Falta origin en shipment');
      if (!destination) console.error('- ERROR: Falta destination en shipment');
      if (!payments) console.error('- ERROR: Falta payments en shipment');
      if (!boxes || !Array.isArray(boxes) || boxes.length === 0) {
        console.error('- ERROR: El campo boxes debe ser un array no vacío');
      } else {
        console.log(`- boxes: OK (${boxes.length} bultos)`);
        // Validar cada bulto
        boxes.forEach((box: any, index: number) => {
          console.log(`\nValidando bulto #${index + 1}:`);
          if (!box.internalKey) {
            console.error(`- ERROR: Falta internalKey en bulto #${index + 1}`);
          } else {
            console.log('- internalKey:', box.internalKey);
          }
          if (!box.items || !Array.isArray(box.items) || box.items.length === 0) {
            console.error(`- ERROR: Faltan items en bulto #${index + 1}`);
          } else {
            console.log(`- items: OK (${box.items.length} items)`);
            // Validar cada item
            box.items.forEach((item: any, itemIndex: number) => {
              if (!item.size) console.error(`  - ERROR: Falta size en item #${itemIndex + 1} del bulto #${index + 1}`);
              if (typeof item.weight !== 'number') console.error(`  - ERROR: weight debe ser un número en item #${itemIndex + 1} del bulto #${index + 1}`);
              if (typeof item.length !== 'number') console.error(`  - ERROR: length debe ser un número en item #${itemIndex + 1} del bulto #${index + 1}`);
              if (typeof item.width !== 'number') console.error(`  - ERROR: width debe ser un número en item #${itemIndex + 1} del bulto #${index + 1}`);
              if (typeof item.height !== 'number') console.error(`  - ERROR: height debe ser un número en item #${itemIndex + 1} del bulto #${index + 1}`);
            });
          }
          if (!deliveryType) {
            console.error('- ERROR: Falta deliveryType en shipment');
          } else {
            console.log('- deliveryType:', deliveryType);
          }
          if (!internalKey) {
            console.error('- ERROR: Falta internalKey en shipment');
          } else {
            console.log('- internalKey:', internalKey);
          }
        });
      }
    }

    console.log('\nIniciando solicitud HTTP a 99minutos...');

    const response = await fetch('https://delivery.99minutos.com/api/v1/orders/multibox', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    console.log(`Respuesta recibida: Status ${response.status}`);
    console.log('Headers de respuesta:', response.headers);

    const responseText = await response.text();
    console.log('Respuesta completa:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Respuesta parseada como JSON:', responseData);
    } catch (e) {
      console.error('La respuesta no es un JSON válido:', e);
      responseData = { error: responseText };
    }

    if (!response.ok) {
      console.error(`ERROR HTTP ${response.status}: ${responseText}`);
      throw new Error(`Error al crear la orden: ${response.status} - ${responseText}`);
    }

    console.log('Orden multibulto creada exitosamente:', responseData);
    console.log('=== FIN CREACIÓN DE ORDEN MULTIBULTO ===');

    return responseData;
  } catch (error) {
    console.error('=== ERROR CREANDO ORDEN MULTIBULTO ===');
    console.error(error);
    console.error('Detalles del error:', error instanceof Error ? error.message : 'Error desconocido');
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No disponible');
    console.error('=== FIN ERROR ===');
    throw error;
  }
}

/**
 * Validación manual de la estructura de datos para multibulto
 * @param orderData Datos a validar
 * @returns Objeto con errores encontrados o null si no hay errores
 */
export function validateOrderDataManually(orderData: any): { valid: boolean, errors: string[] } {
    const errors: string[] = [];
  
    if (!orderData) {
      errors.push('Los datos de la orden son nulos o indefinidos');
      return { valid: false, errors };
    }
  
    // Verificamos si deliveryType está en el nivel raíz o en shipment
    const hasDeliveryType = orderData.deliveryType || (orderData.shipment && orderData.shipment.deliveryType);
    if (!hasDeliveryType) {
      errors.push('Falta el campo deliveryType en la orden');
    }
  
    if (!orderData.shipment) {
      errors.push('Falta el campo shipment');
      return { valid: false, errors };
    }

  const shipment = orderData.shipment;

  // Validar sender
  if (!shipment.sender) {
    errors.push('Falta el campo sender en shipment');
  } else {
    if (!shipment.sender.firstName) errors.push('Falta sender.firstName en shipment');
    if (!shipment.sender.lastName) errors.push('Falta sender.lastName en shipment');
    if (!shipment.sender.phone) errors.push('Falta sender.phone en shipment');
    if (!shipment.sender.email) errors.push('Falta sender.email en shipment');
  }

  // Validar recipient
  if (!shipment.recipient) {
    errors.push('Falta el campo recipient en shipment');
  } else {
    if (!shipment.recipient.firstName) errors.push('Falta recipient.firstName en shipment');
    if (!shipment.recipient.lastName) errors.push('Falta recipient.lastName en shipment');
    if (!shipment.recipient.phone) errors.push('Falta recipient.phone en shipment');
    if (!shipment.recipient.email) errors.push('Falta recipient.email en shipment');
  }

  // Validar origin
  if (!shipment.origin) {
    errors.push('Falta el campo origin en shipment');
  } else {
    if (!shipment.origin.locationId && !shipment.origin.address && !(shipment.origin.lat && shipment.origin.lng)) {
      errors.push('El origin en shipment debe tener locationId, address o coordenadas (lat/lng)');
    }
  }

  // Validar destination
  if (!shipment.destination) {
    errors.push('Falta el campo destination en shipment');
  } else {
    if (!shipment.destination.locationId && !shipment.destination.address && !(shipment.destination.lat && shipment.destination.lng)) {
      errors.push('El destination en shipment debe tener locationId, address o coordenadas (lat/lng)');
    }
  }

  // Validar payments
  if (!shipment.payments) {
    errors.push('Falta el campo payments en shipment');
  } else {
    if (!shipment.payments.cashOnDelivery) {
      errors.push('Falta payments.cashOnDelivery en shipment');
    } else {
      if (typeof shipment.payments.cashOnDelivery.amount !== 'number') {
        errors.push('payments.cashOnDelivery.amount debe ser un número en shipment');
      }
      if (!shipment.payments.cashOnDelivery.currency) {
        errors.push('Falta payments.cashOnDelivery.currency en shipment');
      }
    }
  }

  // Validar boxes
  if (!shipment.boxes || !Array.isArray(shipment.boxes) || shipment.boxes.length === 0) {
    errors.push('El campo boxes debe ser un array no vacío en shipment');
  } else {
    shipment.boxes.forEach((box: any, index: number) => {
      if (!box.internalKey) errors.push(`Bulto #${index + 1}: Falta internalKey`);
      if (!box.items || !Array.isArray(box.items) || box.items.length === 0) {
        errors.push(`Bulto #${index + 1}: items debe ser un array no vacío`);
      } else {
        box.items.forEach((item: any, itemIndex: number) => {
          if (!item.size) errors.push(`Bulto #${index + 1}, Item #${itemIndex + 1}: Falta size`);
          if (typeof item.weight !== 'number') errors.push(`Bulto #${index + 1}, Item #${itemIndex + 1}: weight debe ser un número`);
          if (typeof item.length !== 'number') errors.push(`Bulto #${index + 1}, Item #${itemIndex + 1}: length debe ser un número`);
          if (typeof item.width !== 'number') errors.push(`Bulto #${index + 1}, Item #${itemIndex + 1}: width debe ser un número`);
          if (typeof item.height !== 'number') errors.push(`Bulto #${index + 1}, Item #${itemIndex + 1}: height debe ser un número`);
        });
      }
    });
  }

  // Validar deliveryType e internalKey a nivel shipment
  if (!shipment.deliveryType) {
    errors.push('Falta el campo deliveryType en shipment');
  }

  if (!shipment.internalKey) {
    errors.push('Falta el campo internalKey en shipment');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
