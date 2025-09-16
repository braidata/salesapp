// lib/vtex.ts
export type VtexOrder = any;

function baseUrl(): string {
  const account = process.env.VTEX_ACCOUNT;
  const env = process.env.VTEX_ENV || 'vtexcommercestable';
  if (!account) throw new Error('Falta VTEX_ACCOUNT');
  return `https://imegab2c.myvtex.com`;
}

function authHeaders(): Record<string, string> {
  const key = process.env.API_VTEX_KEY;
  const token = process.env.API_VTEX_TOKEN;
  if (!key || !token) throw new Error('Faltan VTEX_APP_KEY o VTEX_APP_TOKEN');
  return {
    'X-VTEX-API-AppKey': key,
    'X-VTEX-API-AppToken': token,
    'Accept': 'application/json'
  };
}

export async function getOrderById(orderId: string): Promise<VtexOrder> {
  const url = `${baseUrl()}/api/oms/pvt/orders/${encodeURIComponent(orderId)}`;
  const resp = await fetch(url, { headers: authHeaders() });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`VTEX getOrderById ${resp.status}: ${text}`);
  }
  return resp.json();
}

export async function listOrders(queryString: string): Promise<any> {
  const url = `${baseUrl()}/api/oms/pvt/orders${queryString ? `?${queryString.replace(/^\?/, '')}` : ''}`;
  const resp = await fetch(url, { headers: authHeaders() });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`VTEX listOrders ${resp.status}: ${text}`);
  }
  return resp.json();
}
