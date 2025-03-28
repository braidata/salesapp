// pages/api/geocodeAddresses99.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { geocodeAddresses, GeocodingRequest } from '../../../lib/coverageService';
import { startTokenManager } from '../../../lib/tokenManager';

// Nos aseguramos que el token manager esté iniciado
let tokenManagerInitialized = false;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo permitimos método POST para este endpoint
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  try {
    // Inicializa el token manager si aún no se ha hecho
    if (!tokenManagerInitialized) {
      console.log('Iniciando TokenManager desde API handler de geocodificación...');
      await startTokenManager();
      tokenManagerInitialized = true;
    }
    
    // Validamos que la solicitud tenga un cuerpo
    if (!req.body) {
      return res.status(400).json({ error: 'Datos no proporcionados' });
    }
    
    const geocodingData = req.body as GeocodingRequest;
    
    if (!validateGeocodingData(geocodingData)) {
      return res.status(400).json({ 
        error: 'Datos incompletos o inválidos',
        message: 'Debes proporcionar un array de direcciones y un código de país válido.'
      });
    }
    
    // Geocodificamos las direcciones
    const geocodingResponse = await geocodeAddresses(geocodingData);
    
    // Respondemos con la información de geocodificación
    res.status(200).json(geocodingResponse);
    
  } catch (error) {
    console.error('Error en el endpoint geocodeAddresses99:', error);
    res.status(500).json({ 
      error: 'Error geocodificando direcciones', 
      message: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
}

/**
 * Valida que los datos de geocodificación contengan los campos obligatorios
 * @param geocodingData Datos de geocodificación a validar
 * @returns true si los datos son válidos, false en caso contrario
 */
function validateGeocodingData(geocodingData: GeocodingRequest): boolean {
  // Validación básica de campos obligatorios
  if (!geocodingData.addresses || !geocodingData.country) {
    return false;
  }
  
  // Validar que addresses sea un array no vacío
  if (!Array.isArray(geocodingData.addresses) || geocodingData.addresses.length === 0) {
    return false;
  }
  
  // Validar que todas las direcciones sean strings no vacíos
  if (geocodingData.addresses.some(addr => typeof addr !== 'string' || addr.trim() === '')) {
    return false;
  }
  
  return true;
}