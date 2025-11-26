// lib/vtex.ts
export type VtexOrder = any;
export type VtexStore = 'imegab2c' | 'blanik' | 'bbqgrill';

interface StoreConfig {
  account: string;
  key: string;
  token: string;
}

function getStoreConfig(store: VtexStore): StoreConfig {
  const configs: Record<VtexStore, StoreConfig> = {
    imegab2c: {
      account: 'imegab2c',
      key: process.env.API_VTEX_KEY || '',
      token: process.env.API_VTEX_TOKEN || ''
    },
    blanik: {
      account: 'blanik',
      key: process.env.API_VTEX_KEY_BL || '',
      token: process.env.API_VTEX_TOKEN_BL || ''
    },
    bbqgrill: {
      account: 'bbqgrill',
      key: process.env.API_VTEX_KEY_BBQ || '',
      token: process.env.API_VTEX_TOKEN_BBQ || ''
    }
  };

  const config = configs[store];
  if (!config.key || !config.token) {
    throw new Error(`Faltan credenciales para la tienda ${store}`);
  }
  
  return config;
}

// Mapear el valor del campo ecommerce a la tienda VTEX
export function mapEcommerceToStore(ecommerce: string): VtexStore | null {
  if (ecommerce === 'VENTUSCORP_VTEX') return 'imegab2c';
  if (ecommerce === 'BLANIK_VTEX') return 'blanik';
  if (ecommerce === 'BBQGRILL_VTEX') return 'bbqgrill';
  
  return null; // No se reconoce la tienda
}

function baseUrl(store: VtexStore): string {
  const config = getStoreConfig(store);
  return `https://${config.account}.myvtex.com`;
}

function authHeaders(store: VtexStore): Record<string, string> {
  const config = getStoreConfig(store);
  return {
    'X-VTEX-API-AppKey': config.key,
    'X-VTEX-API-AppToken': config.token,
    'Accept': 'application/json'
  };
}

// Función base para obtener orden de una tienda específica
async function getOrderByIdFromStore(orderId: string, store: VtexStore): Promise<VtexOrder> {
  const url = `${baseUrl(store)}/api/oms/pvt/orders/${encodeURIComponent(orderId)}`;
  const resp = await fetch(url, { headers: authHeaders(store) });
  
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`VTEX getOrderById [${store}] ${resp.status}: ${text}`);
  }
  
  return resp.json();
}

// Función con sistema de respaldo: intenta primero en la tienda indicada, si falla busca en las demás
export async function getOrderById(orderId: string, ecommerce?: string): Promise<VtexOrder> {
  const allStores: VtexStore[] = ['imegab2c', 'blanik', 'bbqgrill'];
  let storesToTry: VtexStore[] = [];
  
  // Si viene ecommerce, intentar primero con esa tienda
  if (ecommerce) {
    const preferredStore = mapEcommerceToStore(ecommerce);
    if (preferredStore) {
      // Intentar primero con la tienda indicada, luego las demás
      storesToTry = [preferredStore, ...allStores.filter(s => s !== preferredStore)];
    } else {
      // Si no se reconoce el ecommerce, probar todas
      storesToTry = allStores;
    }
  } else {
    // Si no viene ecommerce, probar todas
    storesToTry = allStores;
  }
  
  const errors: string[] = [];
  
  for (const store of storesToTry) {
    try {
      const order = await getOrderByIdFromStore(orderId, store);
      return order;
    } catch (error: any) {
      errors.push(`${store}: ${error.message}`);
    }
  }
  
  // Si no se encontró en ninguna tienda
  throw new Error(`Orden ${orderId} no encontrada en ninguna tienda`);
}

export async function listOrders(queryString: string, store: VtexStore): Promise<any> {
  const url = `${baseUrl(store)}/api/oms/pvt/orders${queryString ? `?${queryString.replace(/^\?/, '')}` : ''}`;
  const resp = await fetch(url, { headers: authHeaders(store) });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`VTEX listOrders [${store}] ${resp.status}: ${text}`);
  }
  return resp.json();
}