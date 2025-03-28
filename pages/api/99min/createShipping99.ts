// pages/api/createShipping99.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { createShippingOrder, validateOrderDataManually } from '../../../lib/shippingService';
import { startTokenManager } from '../../../lib/tokenManager';

// Nos aseguramos que el token manager esté iniciado
let tokenManagerInitialized = false;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== INICIO HANDLER CREACIÓN DE ORDEN MULTIBULTO ===');
  console.log('Método de la solicitud:', req.method);

  try {
    if (!tokenManagerInitialized) {
      console.log('Iniciando TokenManager desde API handler de envíos...');
      await startTokenManager();
      tokenManagerInitialized = true;
    }

    if (!req.body) {
      console.error('ERROR: El cuerpo de la solicitud está vacío');
      return res.status(400).json({ error: 'Datos de envío no proporcionados' });
    }

    console.log('Cuerpo de la solicitud recibido:');
    console.log(JSON.stringify(req.body, null, 2));

    // Validación
    const validation = validateOrderDataManually(req.body);
    if (!validation.valid) {
      console.error('Errores de validación encontrados:');
      validation.errors.forEach(err => console.error(`- ${err}`));

      return res.status(400).json({
        error: 'Datos de envío incompletos o inválidos',
        message: 'Revisa que todos los campos requeridos estén presentes y sean válidos.',
        validationErrors: validation.errors
      });
    }

    console.log('Validación manual exitosa, procediendo a crear la orden multibulto...');

    // MAPEO: transformamos shipment al formato plano
    const shipment = req.body.shipment;
    const mappedOrder = {
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
      }
    };

    // Enviar a createShippingOrder
    try {
      const orderResponse = await createShippingOrder(mappedOrder);
      console.log('Respuesta exitosa de createShippingOrder');
      res.status(200).json(orderResponse);
    } catch (error) {
      console.error('Error creando orden:', error);
      res.status(500).json({
        error: 'Error creando orden de envío',
        message: error instanceof Error ? error.message : 'Error desconocido',
        details: error
      });
    }
  } catch (error) {
    console.error('=== ERROR GENERAL EN HANDLER ===');
    console.error(error);
    console.error('Detalles:', error instanceof Error ? error.message : 'Error desconocido');
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No disponible');
    console.error('=== FIN ERROR GENERAL ===');

    res.status(500).json({
      error: 'Error procesando la solicitud',
      message: error instanceof Error ? error.message : 'Error desconocido',
      details: error
    });
  } finally {
    console.log('=== FIN HANDLER CREACIÓN DE ORDEN MULTIBULTO ===');
  }
}
