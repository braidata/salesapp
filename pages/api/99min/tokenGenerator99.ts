// pages/api/tokenGenerator99.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { startTokenManager, getToken, refreshToken } from '../../../lib/tokenManager';

// Iniciamos el gestor de tokens al cargar el módulo
let tokenManagerInitialized = false;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Inicializa el token manager si aún no se ha hecho
    if (!tokenManagerInitialized) {
      console.log('Iniciando TokenManager desde API handler...');
      await startTokenManager();
      tokenManagerInitialized = true;
    }
    
    // Obtiene el token actual
    let currentToken = getToken();
    
    // Si no hay token disponible, intenta refrescarlo explícitamente y espera
    if (!currentToken) {
      console.log('Token no disponible, forzando refresh...');
      await refreshToken();
      currentToken = getToken();
      
      // Si aún no hay token después del refresh, retorna error
      if (!currentToken) {
        console.error('No se pudo obtener token después de intentar refresh');
        return res.status(500).json({ 
          error: 'No se pudo obtener el token', 
          message: 'Verifica las credenciales y la conexión con el API de 99minutos' 
        });
      }
    }
    
    // Respuesta exitosa con el token
    console.log('Devolviendo token al cliente');
    res.status(200).json({ token: currentToken });
    
  } catch (error) {
    // Manejo de errores detallado
    console.error('Error en el endpoint tokenGenerator99:', error);
    res.status(500).json({ 
      error: 'Error generando el token', 
      message: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
}