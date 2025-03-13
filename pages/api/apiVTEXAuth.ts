import { NextApiRequest, NextApiResponse } from 'next'

const VTEX_ACCOUNT = 'imegab2c'
const API_VTEX_KEY = process.env.API_VTEX_KEY || ''
const API_VTEX_TOKEN = process.env.API_VTEX_TOKEN || ''

if (!API_VTEX_KEY || !API_VTEX_TOKEN) {
  throw new Error('Las credenciales de VTEX no están configuradas (API_VTEX_KEY / API_VTEX_TOKEN)')
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
async function getOrderDetails(orderId: string): Promise<any> {
  const url = `https://${VTEX_ACCOUNT}.myvtex.com/api/oms/pvt/orders/${orderId}`
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
 * sendAuthorizationCode
 * Envía el authorizationCode a la transacción en VTEX Payments.
 */
async function sendAuthorizationCode(transactionId: string, authorizationCode: string): Promise<any> {
  const url = `https://${VTEX_ACCOUNT}.vtexpayments.com.br/api/pvt/transactions/${transactionId}/additional-data`
  const payload = [
    {
      name: 'authorizationCode',
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
async function notifyPaymentApproved(orderId: string, paymentId: string): Promise<any> {
  const url = `https://${VTEX_ACCOUNT}.myvtex.com/api/oms/pvt/orders/${orderId}/payments/${paymentId}/payment-notification`
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
 * Cambia el estado de la orden a "handling" (que pasa a "ready-for-handling").
 */
async function startHandling(orderId: string): Promise<any> {
  const url = `https://${VTEX_ACCOUNT}.myvtex.com/api/oms/pvt/orders/${orderId}/start-handling`
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
 * getPaymentId
 * Extrae el paymentId de la orden (ubicado en paymentData.transactions[0].payments[0].id).
 */
async function getPaymentId(orderId: string): Promise<string> {
  const order = await getOrderDetails(orderId)
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
 * Handler principal:
 * - GET: Retorna los detalles de la orden
 * - POST: Recibe orderId y authorizationCode, actualiza el pago, 
 *   y mueve el pedido a "ready-for-handling".
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // 1. Consultar la orden
      const { orderId } = req.query
      if (!orderId || typeof orderId !== 'string') {
        return res.status(400).json({ message: 'Falta el parámetro "orderId"' })
      }
      const order = await getOrderDetails(orderId)
      return res.status(200).json(order)
    }
    
    if (req.method === 'POST') {
      const { orderId, authorizationCode } = req.body
      if (!orderId || typeof orderId !== 'string') {
        return res.status(400).json({ message: 'Falta el parámetro "orderId"' })
      }
      if (!authorizationCode || typeof authorizationCode !== 'string') {
        return res.status(400).json({ message: 'Falta el parámetro "authorizationCode"' })
      }

      // 1. Obtener detalles de la orden
      const order = await getOrderDetails(orderId)
      if (!order.paymentData || !order.paymentData.transactions || order.paymentData.transactions.length === 0) {
        throw new Error(`No se encontró información de transacciones en la orden ${orderId}`)
      }

      // 2. Extraer transactionId y paymentId
      const transactionId = order.paymentData.transactions[0].transactionId
      if (!transactionId) {
        throw new Error(`No se encontró transactionId en la orden ${orderId}`)
      }
      const paymentId = await getPaymentId(orderId)

      // 3. Enviar el authorizationCode a la transacción
      const authResult = await sendAuthorizationCode(transactionId, authorizationCode)

      // 4. Notificar a VTEX que el pago fue aprobado
      await notifyPaymentApproved(orderId, paymentId)

      // 5. Esperar a que la orden alcance "payment-approved" o "ready-for-handling"
      let attempts = 0
      let status = (await getOrderDetails(orderId)).status
      while (status !== 'payment-approved' && status !== 'ready-for-handling' && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Espera 5 segundos
        status = (await getOrderDetails(orderId)).status
        attempts++
      }
      if (status !== 'payment-approved' && status !== 'ready-for-handling') {
        throw new Error(`La orden no llegó a "payment-approved" o "ready-for-handling". Último estado: ${status}`)
      }

      // 6. Si el estado es "payment-approved", llamar a startHandling para avanzar a "ready-for-handling"
      let handlingResponse = {}
      if (status === 'payment-approved') {
        handlingResponse = await startHandling(orderId)
        status = 'ready-for-handling' // Forzamos el valor final
      }

      return res.status(200).json({
        message: 'AuthorizationCode enviado y flujo de pago actualizado correctamente',
        finalStatus: status,
        handlingResponse,
        authResult,
      })
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Error en la actualización del pedido:', error)
    return res.status(500).json({
      message: 'Error en la actualización del pedido',
      error: (error as Error).message,
    })
  }
}
