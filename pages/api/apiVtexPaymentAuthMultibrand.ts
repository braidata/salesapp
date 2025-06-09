// pages/api/apiVtexPaymentAuthMultibrand.ts
import { NextApiRequest, NextApiResponse } from 'next'

// Configuración de cuentas multimarca
const VTEX_ACCOUNTS = {
  'imegab2c': 'imegab2c',
  'blanik': 'blanik',
  'bbqgrill': 'bbqgrill'
}

const VTEX_ENVIRONMENT = 'myvtex.com'
const API_VTEX_KEY = process.env.API_VTEX_KEY || ''
const API_VTEX_TOKEN = process.env.API_VTEX_TOKEN || ''

if (!API_VTEX_KEY || !API_VTEX_TOKEN) {
  throw new Error('Las credenciales de VTEX no están configuradas (API_VTEX_KEY / API_VTEX_TOKEN)')
}

/**
 * getVtexAccount
 * Determina la cuenta VTEX basada en el parámetro account o usa imegab2c por defecto
 */
function getVtexAccount(accountParam?: string): string {
  if (!accountParam) return 'imegab2c'
  
  const account = accountParam.toLowerCase()
  return VTEX_ACCOUNTS[account] || 'imegab2c'
}

/**
 * parseVtexResponse
 * Lee el cuerpo de la respuesta y lo parsea a JSON (si es posible).
 */
async function parseVtexResponse(response: Response) {
  const rawText = await response.text()
  if (!response.ok) {
    throw new Error(`Error desde VTEX [${response.status}]: ${rawText}`)
  }
  if (!rawText) {
    return {}
  }
  try {
    return JSON.parse(rawText)
  } catch (err) {
    throw new Error(`No se pudo parsear la respuesta de VTEX: ${err}`)
  }
}

/**
 * getOrderDetails
 * Consulta los detalles de la orden desde el OMS de VTEX.
 */
async function getOrderDetails(orderId: string, vtexAccount: string): Promise<any> {
  const url = `https://${vtexAccount}.${VTEX_ENVIRONMENT}/api/oms/pvt/orders/${orderId}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-VTEX-API-AppKey': API_VTEX_KEY,
      'X-VTEX-API-AppToken': API_VTEX_TOKEN,
    },
  })
  return parseVtexResponse(response)
}

/**
 * getPaymentId
 * Extrae el paymentId de la orden (ubicado en paymentData.transactions[0].payments[0].id).
 */
async function getPaymentId(orderId: string, vtexAccount: string): Promise<string> {
  const order = await getOrderDetails(orderId, vtexAccount)
  if (
    !order.paymentData ||
    !order.paymentData.transactions ||
    order.paymentData.transactions.length === 0 ||
    !order.paymentData.transactions[0].payments ||
    order.paymentData.transactions[0].payments.length === 0
  ) {
    throw new Error(`No se encontró información de pagos en la orden ${orderId}`)
  }
  const paymentId = order.paymentData.transactions[0].payments[0].id
  if (!paymentId) {
    throw new Error(`No se encontró paymentId en la orden ${orderId}`)
  }
  return paymentId
}

/**
 * sendAuthorizationCode
 * Envía el authorizationCode a la transacción en VTEX Payments.
 */
async function sendAuthorizationCode(transactionId: string, authorizationCode: string, vtexAccount: string): Promise<any> {
  const url = `https://${vtexAccount}.vtexpayments.com.br/api/pvt/transactions/${transactionId}/additional-data`
  const payload = [
    {
      name: "authorizationCode",
      value: authorizationCode
    }
  ]
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-VTEX-API-AppKey': API_VTEX_KEY,
      'X-VTEX-API-AppToken': API_VTEX_TOKEN,
    },
    body: JSON.stringify(payload),
  })
  return parseVtexResponse(response)
}

/**
 * notifyPaymentApproved
 * Notifica a VTEX que el pago fue aprobado.
 */
async function notifyPaymentApproved(orderId: string, paymentId: string, vtexAccount: string): Promise<any> {
  const url = `https://${vtexAccount}.${VTEX_ENVIRONMENT}/api/oms/pvt/orders/${orderId}/payments/${paymentId}/payment-notification`
  const payload = { paymentStatus: 'approved' }
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-VTEX-API-AppKey': API_VTEX_KEY,
      'X-VTEX-API-AppToken': API_VTEX_TOKEN,
    },
    body: JSON.stringify(payload),
  })
  return parseVtexResponse(response)
}

/**
 * startHandling
 * Cambia el estado de la orden a "handling".
 */
async function startHandling(orderId: string, vtexAccount: string): Promise<any> {
  const url = `https://${vtexAccount}.${VTEX_ENVIRONMENT}/api/oms/pvt/orders/${orderId}/start-handling`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-VTEX-API-AppKey': API_VTEX_KEY,
      'X-VTEX-API-AppToken': API_VTEX_TOKEN,
    },
  })
  return parseVtexResponse(response)
}

/**
 * Handler principal:
 * - GET: Consulta detalles de la orden (soporta query params)
 * - POST: Procesa autorización y cambia estado (soporta query params y body)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Determinar la cuenta VTEX
    const accountParam = (req.method === 'GET' ? req.query.account : req.body?.account || req.query.account) as string
    const vtexAccount = getVtexAccount(accountParam)

    if (req.method === 'GET') {
      // GET: Consultar detalles de la orden via query params
      const { orderId } = req.query
      
      if (!orderId || typeof orderId !== 'string') {
        return res.status(400).json({ 
          message: 'Falta el parámetro "orderId"',
          usage: 'GET /api/apiVtexPaymentAuthMultibrand?orderId=123&account=imegab2c'
        })
      }

      const order = await getOrderDetails(orderId, vtexAccount)
      return res.status(200).json({
        ...order,
        _metadata: {
          vtexAccount: vtexAccount,
          orderId: orderId
        }
      })
    }

    if (req.method === 'POST') {
      // POST: Procesar autorización via body o query params
      let orderId: string
      let authorizationCode: string

      // Priorizar body, pero permitir query params como fallback
      if (req.body && Object.keys(req.body).length > 0) {
        orderId = req.body.orderId
        authorizationCode = req.body.authorizationCode
      } else {
        orderId = req.query.orderId as string
        authorizationCode = req.query.authorizationCode as string
      }

      if (!orderId || typeof orderId !== 'string') {
        return res.status(400).json({ 
          message: 'Falta el parámetro "orderId"',
          usage: 'POST con body: {"orderId":"123","authorizationCode":"ABC","account":"imegab2c"} o query: ?orderId=123&authorizationCode=ABC&account=imegab2c'
        })
      }
      if (!authorizationCode || typeof authorizationCode !== 'string') {
        return res.status(400).json({ 
          message: 'Falta el parámetro "authorizationCode"',
          usage: 'POST con body: {"orderId":"123","authorizationCode":"ABC","account":"imegab2c"} o query: ?orderId=123&authorizationCode=ABC&account=imegab2c'
        })
      }

      // 1. Obtener detalles de la orden
      const order = await getOrderDetails(orderId, vtexAccount)
      if (!order.paymentData || !order.paymentData.transactions || order.paymentData.transactions.length === 0) {
        throw new Error(`No se encontró información de transacciones en la orden ${orderId}`)
      }

      // 2. Extraer transactionId y paymentId
      const transactionId = order.paymentData.transactions[0].transactionId
      if (!transactionId) {
        throw new Error(`No se encontró transactionId en la orden ${orderId}`)
      }
      const paymentId = await getPaymentId(orderId, vtexAccount)

      // 3. Enviar el authorizationCode a la transacción
      const authResult = await sendAuthorizationCode(transactionId, authorizationCode, vtexAccount)

      // 4. Notificar a VTEX que el pago fue aprobado
      await notifyPaymentApproved(orderId, paymentId, vtexAccount)

      // 5. Esperar a que la orden alcance "payment-approved" o "ready-for-handling"
      let attempts = 0
      let status = (await getOrderDetails(orderId, vtexAccount)).status
      while (status !== 'payment-approved' && status !== 'ready-for-handling' && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Espera 5 segundos
        status = (await getOrderDetails(orderId, vtexAccount)).status
        attempts++
      }
      if (status !== 'payment-approved' && status !== 'ready-for-handling') {
        throw new Error(`La orden no llegó a "payment-approved" o "ready-for-handling". Último estado: ${status}`)
      }

      // 6. Si el estado es "payment-approved", llamar a startHandling para avanzar a "ready-for-handling"
      let handlingResponse = {}
      if (status === 'payment-approved') {
        handlingResponse = await startHandling(orderId, vtexAccount)
        status = 'ready-for-handling' // Actualizar estado final
      }

      return res.status(200).json({
        message: 'AuthorizationCode enviado y flujo de pago actualizado correctamente',
        finalStatus: status,
        vtexAccount: vtexAccount,
        orderId: orderId,
        authorizationCode: authorizationCode,
        handlingResponse,
        authResult,
      })
    }

    // Método no permitido
    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({
      message: `Method ${req.method} Not Allowed`,
      allowedMethods: ['GET', 'POST'],
      usage: {
        GET: '/api/apiVtexPaymentAuthMultibrand?orderId=123&account=imegab2c',
        POST: 'Body: {"orderId":"123","authorizationCode":"ABC","account":"imegab2c"} o Query: ?orderId=123&authorizationCode=ABC&account=imegab2c'
      }
    })

  } catch (error) {
    console.error('Error en la operación VTEX:', error)
    return res.status(500).json({
      message: 'Error en la operación VTEX',
      error: (error as Error).message,
    })
  }
}