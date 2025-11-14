// lib/vtex.ts
export type VtexOrder = any;
export type VtexStore = 'imegab2c' | 'blanik' | 'bbqgrill' | 'ventusperu';

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
    },
    ventusperu: {
      account: 'ventusperu',
      key: process.env.API_VTEX_KEY_PE || '',
      token: process.env.API_VTEX_TOKEN_PE || ''
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
  if (ecommerce === 'VENTUSPERU_VTEX') return 'ventusperu';
  return null;
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

// === NUEVO: helper interno para DO (notas) ===
function doBaseUrl(store: VtexStore): string {
  const { account } = getStoreConfig(store);
  return `https://${account}.vtexcommercestable.com.br`;
}

// === NUEVO: crear nota en la timeline de la orden ===
export async function createOrderNote(
  store: VtexStore,
  orderId: string,
  description: string
): Promise<void> {
  const accountConfig = getStoreConfig(store);
  const url = `${doBaseUrl(store)}/api/do/notes?target.id=${encodeURIComponent(orderId)}`;

  const body = {
    target: {
      id: orderId,
      type: 'order',
      url: `https://${accountConfig.account}.myvtex.com/admin/orders/${encodeURIComponent(orderId)}/`
    },
    domain: 'oms',
    description
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      ...authHeaders(store),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`VTEX createOrderNote [${store}] ${resp.status}: ${text}`);
  }
}

// === getOrderByIdFromStore, getOrderById y listOrders se quedan como los tenías ===

async function getOrderByIdFromStore(orderId: string, store: VtexStore): Promise<VtexOrder> {
  const url = `${baseUrl(store)}/api/oms/pvt/orders/${encodeURIComponent(orderId)}`;
  const resp = await fetch(url, { headers: authHeaders(store) });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`VTEX getOrderById [${store}] ${resp.status}: ${text}`);
  }

  return resp.json();
}

export async function getOrderById(orderId: string, ecommerce?: string): Promise<VtexOrder> {
  const allStores: VtexStore[] = ['imegab2c', 'blanik', 'bbqgrill', 'ventusperu'];
  let storesToTry: VtexStore[] = [];

  if (ecommerce) {
    const preferredStore = mapEcommerceToStore(ecommerce);
    if (preferredStore) {
      storesToTry = [preferredStore, ...allStores.filter(s => s !== preferredStore)];
    } else {
      storesToTry = allStores;
    }
  } else {
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

  throw new Error(`Orden ${orderId} no encontrada en ninguna tienda. Errores: ${errors.join(' | ')}`);
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
