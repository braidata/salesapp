// lib/tokenManager.ts

let token: string | null = null;
let tokenExpiration: number | null = null; // Timestamp (ms) en el que expira el token
let refreshTimeout: NodeJS.Timeout;
let isRefreshing = false; // Flag para evitar múltiples intentos simultáneos

interface TokenResponse {
  access_token: string;
  expires_in: number; // tiempo de expiración en segundos
  // otros campos si los hubiera
}

// Función que realiza la petición para obtener el token
async function fetchToken(): Promise<TokenResponse> {
  // Verifica que las credenciales estén disponibles
  if (!process.env.CLIENT_ID_99 || !process.env.CLIENT_SECRET_99) {
    throw new Error('Credenciales no configuradas: CLIENT_ID_99 o CLIENT_SECRET_99 no están definidas');
  }

  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      token_type: 'bearer',
      client_id: process.env.CLIENT_ID_99,
      client_secret: process.env.CLIENT_SECRET_99
    })
  };

  try {
    console.log('Intentando obtener token desde 99minutos API...');
    const response = await fetch('https://delivery.99minutos.com/api/v3/oauth/token', options);
    
    if (!response.ok) {
      // Log detallado del error para depuración
      const errorText = await response.text();
      console.error(`Error ${response.status}: ${errorText}`);
      throw new Error(`Error en la petición, status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error en fetchToken:', error);
    throw error; // Re-lanzar para manejo en refreshToken
  }
}

// Función que refresca el token y programa la siguiente actualización
export async function refreshToken(): Promise<void> {
  // Evita múltiples intentos simultáneos
  if (isRefreshing) {
    console.log('Ya hay un proceso de refresh en curso, saltando...');
    return;
  }
  
  isRefreshing = true;
  
  try {
    console.log('Iniciando refresh de token...');
    const tokenResponse = await fetchToken();
    token = tokenResponse.access_token;
    
    // Calcula el timestamp de expiración (en milisegundos)
    tokenExpiration = Date.now() + tokenResponse.expires_in * 1000;
    console.log(`Token actualizado. Expira en ${tokenResponse.expires_in} segundos`);
    
    // Programa el refresco 1 minuto antes de la expiración, con un mínimo de 30 segundos
    const refreshDelay = Math.max((tokenResponse.expires_in - 60), 30) * 1000;
    console.log(`Próximo refresh programado en ${refreshDelay/1000} segundos`);
    
    // Limpia el timeout anterior si existe
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    
    refreshTimeout = setTimeout(() => {
      refreshToken();
    }, refreshDelay);
  } catch (error) {
    console.error("Error al refrescar el token:", error);
    // Si falla, reintenta en un tiempo más largo para evitar loops de error constantes
    const retryDelay = 30000; // 30 segundos
    console.log(`Error al refrescar. Reintentando en ${retryDelay/1000} segundos`);
    
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    
    refreshTimeout = setTimeout(() => {
      refreshToken();
    }, retryDelay);
  } finally {
    isRefreshing = false;
  }
}

// Función para obtener el token actual
export function getToken(): string | null {
  // Verifica si el token existe y no ha expirado
  if (token && tokenExpiration && Date.now() < tokenExpiration) {
    return token;
  } else if (!isRefreshing) {
    // Si no hay un proceso de refresh en curso, inicia uno
    console.log('Token expirado o no existente. Solicitando nuevo token...');
    refreshToken();
  }
  
  return token; // Retorna el token actual (podría ser null)
}

// Función para iniciar el gestor de tokens
export async function startTokenManager(): Promise<void> {
  if (!token || (tokenExpiration && Date.now() >= tokenExpiration)) {
    console.log('Iniciando TokenManager...');
    await refreshToken();
  }
}