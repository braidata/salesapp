// lib/locationService.ts

import { getToken } from './tokenManager';

// Interfaces para geocodificación de direcciones
export interface GeocodingRequest {
  addresses: string[]; // Array de direcciones a geocodificar
  country: string;     // Código de país (ej: 'MEX', 'CHL', etc.)
}

export interface LocationResult {
  address: string;     // Dirección formateada
  latitude: string;    // Latitud
  longitude: string;   // Longitud
  locationId: string;  // ID único de la ubicación
  locationType: string; // Tipo de ubicación ('private', etc.)
  geoType: string;     // Precisión de geocodificación ('ROOFTOP', etc.)
}

export interface GeocodingResponse {
  traceId: string;
  message: string;
  data: LocationResult[];
  errors: any[];
}

/**
 * Geocodifica una o más direcciones usando la API de 99minutos
 * @param geocodingData Datos para geocodificar (direcciones y país)
 * @returns Información de geocodificación con coordenadas y locationId
 */
export async function geocodeAddresses(geocodingData: GeocodingRequest): Promise<GeocodingResponse> {
  const token = getToken();
  
  if (!token) {
    throw new Error('No hay token disponible para realizar la petición');
  }
  
  try {
    console.log('Geocodificando direcciones...');
    console.log(`Direcciones: ${geocodingData.addresses.join(', ')}`);
    console.log(`País: ${geocodingData.country}`);
    
    const response = await fetch('https://delivery.99minutos.com/api/v3/locations', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(geocodingData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error ${response.status}: ${errorText}`);
      throw new Error(`Error al geocodificar direcciones: ${response.status}`);
    }
    
    const geocodingResponse = await response.json();
    console.log('Respuesta de geocodificación:', geocodingResponse);
    
    return geocodingResponse;
  } catch (error) {
    console.error('Error geocodificando direcciones:', error);
    throw error;
  }
}

/**
 * Geocodifica una sola dirección
 * @param address Dirección a geocodificar
 * @param country Código del país (ej: 'MEX', 'CHL')
 * @returns Resultado de geocodificación para la dirección
 */
export async function geocodeSingleAddress(address: string, country: string): Promise<LocationResult | null> {
  const response = await geocodeAddresses({
    addresses: [address],
    country
  });
  
  if (response.data && response.data.length > 0) {
    return response.data[0];
  }
  
  return null;
}