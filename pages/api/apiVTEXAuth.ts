// pages/api/vtex-add-auth-code.ts
import { NextApiRequest, NextApiResponse } from 'next'

const VTEX_ACCOUNT = 'imegab2c'
const API_VTEX_KEY = process.env.API_VTEX_KEY || ''
const API_VTEX_TOKEN = process.env.API_VTEX_TOKEN || ''

if (!API_VTEX_KEY || !API_VTEX_TOKEN) {
  throw new Error('Las credenciales de VTEX no están configuradas (API_VTEX_KEY / API_VTEX_TOKEN)')
}

/**
 * Helper para parsear la respuesta de VTEX de forma segura.
 * Si la respuesta no es OK, lanza un error con el mensaje completo.
 * Si el body está vacío, retorna {}.
 * Si tiene contenido, intenta parsearlo como JSON.
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
 * Obtiene los detalles de la orden en VTEX.
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
 * Envía el authorizationCode a la transacción usando el endpoint de VTEX Payments.
 * Se utiliza el transactionId obtenido de la orden.
 * El payload se envía como un arreglo:
 * [
 *   {
 *     "name": "authorizationCode",
 *     "value": "<authorizationCode>"
 *   }
 * ]
 */
async function sendAuthorizationCode(transactionId: string, authorizationCode: string): Promise<any> {
  const url = `https://${VTEX_ACCOUNT}.vtexpayments.com.br/api/pvt/transactions/${transactionId}/additional-data`
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
 * Handler principal:
 * 1. Recibe orderId y authorizationCode por POST.
 * 2. Obtiene los detalles de la orden y extrae el transactionId (ubicado en paymentData.transactions[0].transactionId).
 * 3. Envía el authorizationCode a VTEX Payments.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { orderId, authorizationCode } = req.body
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ message: 'Falta el parámetro "orderId"' })
  }
  if (!authorizationCode || typeof authorizationCode !== 'string') {
    return res.status(400).json({ message: 'Falta el parámetro "authorizationCode"' })
  }

  try {
    // 1. Obtener detalles de la orden
    const order = await getOrderDetails(orderId)
    if (
      !order.paymentData ||
      !order.paymentData.transactions ||
      order.paymentData.transactions.length === 0
    ) {
      throw new Error(`No se encontró información de transacciones en la orden ${orderId}`)
    }
    const transactionId = order.paymentData.transactions[0].transactionId
    if (!transactionId) {
      throw new Error(`No se encontró transactionId en la orden ${orderId}`)
    }
    // 2. Enviar el authorizationCode a la transacción
    const result = await sendAuthorizationCode(transactionId, authorizationCode)
    return res.status(200).json({
      message: 'AuthorizationCode enviado correctamente',
      result,
    })
  } catch (error) {
    console.error('Error al enviar authorizationCode:', error)
    return res.status(500).json({
      message: 'Error al enviar authorizationCode',
      error: (error as Error).message,
    })
  }
}
