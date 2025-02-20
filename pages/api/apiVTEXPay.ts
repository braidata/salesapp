// pages/api/vtex-get-auth-code.ts
import { NextApiRequest, NextApiResponse } from 'next'

const VTEX_ACCOUNT = 'imegab2c'
const API_VTEX_KEY = process.env.API_VTEX_KEY || ''
const API_VTEX_TOKEN = process.env.API_VTEX_TOKEN || ''

if (!API_VTEX_KEY || !API_VTEX_TOKEN) {
  throw new Error('Las credenciales de VTEX no están configuradas (API_VTEX_KEY / API_VTEX_TOKEN)')
}

/**
 * Helper para parsear la respuesta de VTEX.
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
 * Obtiene los detalles de la orden desde el OMS de VTEX.
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
 * Obtiene la transacción completa desde VTEX Payments.
 */
async function getTransaction(transactionId: string): Promise<any> {
  const url = `https://${VTEX_ACCOUNT}.vtexpayments.com.br/api/pvt/transactions/${transactionId}`
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
 * Handler principal:
 * 1. Recibe orderId por query (GET).
 * 2. Obtiene los detalles de la orden y extrae el transactionId (ubicado en paymentData.transactions[0].transactionId).
 * 3. Obtiene la transacción completa usando VTEX Payments.
 * 4. Extrae y retorna solo el valor del campo authorizationCode.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { orderId } = req.query
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ message: 'Falta el parámetro "orderId" en la query' })
  }

  try {
    // Obtener detalles de la orden (OMS)
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

    // Obtener la transacción completa desde VTEX Payments
    const transaction = await getTransaction(transactionId)
    
    // Buscar en el arreglo "fields" el campo authorizationCode
    let authCode = "codigo no disponible"
    if (transaction.fields && Array.isArray(transaction.fields)) {
      const field = transaction.fields.find((f: any) => f.name === "authorizationCode")
      if (field && field.value) {
        authCode = field.value
      }
    }

    return res.status(200).json({ authorizationCode: authCode })
  } catch (error) {
    console.error('Error al obtener authorizationCode:', error)
    return res.status(500).json({
      message: 'Error al obtener authorizationCode',
      error: (error as Error).message,
    })
  }
}
