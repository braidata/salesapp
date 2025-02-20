import { NextApiRequest, NextApiResponse } from 'next'

const VTEX_ACCOUNT = 'imegab2c'
const VTEX_ENVIRONMENT = 'myvtex.com'
const API_VTEX_KEY = process.env.API_VTEX_KEY || ''
const API_VTEX_TOKEN = process.env.API_VTEX_TOKEN || ''

if (!API_VTEX_KEY || !API_VTEX_TOKEN) {
  throw new Error('Las credenciales de VTEX no están configuradas (API_VTEX_KEY / API_VTEX_TOKEN)')
}

/**
 * Helper para parsear la respuesta de VTEX de forma segura.
 * - Si la respuesta no es OK, lanza un error con el texto completo.
 * - Si el body está vacío, retorna {}.
 * - Si tiene contenido, intenta parsear como JSON.
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
 * Obtiene el estado actual de la orden en VTEX.
 */
async function getOrderStatus(orderId: string): Promise<string> {
  const url = `https://${VTEX_ACCOUNT}.${VTEX_ENVIRONMENT}/api/oms/pvt/orders/${orderId}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-VTEX-API-AppKey': API_VTEX_KEY,
      'X-VTEX-API-AppToken': API_VTEX_TOKEN,
    },
  })

  const data = await parseVtexResponse(response)
  if (!data || typeof data.status !== 'string') {
    throw new Error(`No se obtuvo un "status" válido en la orden ${orderId}`)
  }
  return data.status
}

/**
 * Obtiene el paymentId real de la orden, necesario para notificar el pago.
 */
async function getPaymentId(orderId: string): Promise<string> {
  const url = `https://${VTEX_ACCOUNT}.${VTEX_ENVIRONMENT}/api/oms/pvt/orders/${orderId}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-VTEX-API-AppKey': API_VTEX_KEY,
      'X-VTEX-API-AppToken': API_VTEX_TOKEN,
    },
  })

  const data = await parseVtexResponse(response)

  if (
    !data.paymentData ||
    !data.paymentData.transactions ||
    data.paymentData.transactions.length === 0 ||
    !data.paymentData.transactions[0].payments ||
    data.paymentData.transactions[0].payments.length === 0
  ) {
    throw new Error(`No se encontraron pagos en la orden ${orderId}`)
  }

  const paymentId = data.paymentData.transactions[0].payments[0].id
  if (!paymentId) {
    throw new Error(`No se encontró paymentId en la orden ${orderId}`)
  }

  return paymentId
}

/**
 * Notifica a VTEX que el pago fue aprobado.
 */
async function notifyPaymentApproved(orderId: string, paymentId: string) {
  const url = `https://${VTEX_ACCOUNT}.${VTEX_ENVIRONMENT}/api/oms/pvt/orders/${orderId}/payments/${paymentId}/payment-notification`
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
 * Cambia el estado de la orden a "handling".
 */
async function startHandling(orderId: string) {
  const url = `https://${VTEX_ACCOUNT}.${VTEX_ENVIRONMENT}/api/oms/pvt/orders/${orderId}/start-handling`

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
 * Handler principal de la API:
 * 1) Recibe orderId por POST.
 * 2) Obtiene paymentId.
 * 3) Notifica a VTEX que el pago está aprobado.
 * 4) Espera hasta que la orden pase a "payment-approved" o "ready-for-handling".
 * 5) Si está en "payment-approved", llama a start-handling; si ya está en "ready-for-handling", omite ese paso.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { orderId } = req.body
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ message: 'Falta el parámetro "orderId"' })
  }

  try {
    // 1. Obtener paymentId
    const paymentId = await getPaymentId(orderId)

    // 2. Notificar pago aprobado
    await notifyPaymentApproved(orderId, paymentId)

    // 3. Esperar a que el pedido esté en "payment-approved" o "ready-for-handling"
    let attempts = 0
    let status = await getOrderStatus(orderId)
    while (
      status !== 'payment-approved' &&
      status !== 'ready-for-handling' &&
      attempts < 10
    ) {
      await new Promise(resolve => setTimeout(resolve, 5000))
      status = await getOrderStatus(orderId)
      attempts++
    }

    if (status !== 'payment-approved' && status !== 'ready-for-handling') {
      throw new Error(`La orden no llegó a "payment-approved" o "ready-for-handling". Último estado: ${status}`)
    }

    // 4. Si el estado es "payment-approved", llamar a start-handling para pasar a "ready-for-handling"
    let handlingResponse = {}
    if (status === 'payment-approved') {
      handlingResponse = await startHandling(orderId)
    }

    return res.status(200).json({
      message: 'Pedido aprobado correctamente',
      finalStatus: status,
      handlingResponse,
    })
  } catch (error) {
    console.error('Error en la actualización del pedido:', error)
    return res.status(500).json({
      message: 'Error en la actualización del pedido',
      error: (error as Error).message,
    })
  }
}
