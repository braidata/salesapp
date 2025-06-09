// pages/api/apiVTEXStatusChanger.ts
import { NextApiRequest, NextApiResponse } from 'next'

const VTEX_ACCOUNT = 'imegab2c'
const VTEX_ENVIRONMENT = 'myvtex.com'
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
  const url = `https://${VTEX_ACCOUNT}.${VTEX_ENVIRONMENT}/api/oms/pvt/orders/${orderId}`
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
 * Extrae el paymentId de la orden.
 */
async function getPaymentId(orderId: string): Promise<string> {
  const order = await getOrderDetails(orderId)
  const transactions = order.paymentData?.transactions
  if (!transactions || transactions.length === 0) {
    throw new Error(`No se encontró información de transacciones en la orden ${orderId}`)
  }
  const payments = transactions[0].payments
  if (!payments || payments.length === 0) {
    throw new Error(`No se encontró payments en la orden ${orderId}`)
  }
  const paymentId = payments[0].id
  if (!paymentId) {
    throw new Error(`No se encontró paymentId en la orden ${orderId}`)
  }
  return paymentId
}

/**
 * findAuthorizationCodeInOrder
 * Busca el código de autorización en múltiples ubicaciones dentro de la orden.
 */
function findAuthorizationCodeInOrder(order: any): string | null {
  const transaction = order.paymentData?.transactions?.[0]
  const payment = transaction?.payments?.[0]
  if (!transaction || !payment) return null

  // 1. En connectorResponses.authId
  if (payment.connectorResponses?.authId) {
    return payment.connectorResponses.authId
  }
  // 2. En connectorResponses.authorizationCode
  if (payment.connectorResponses?.authorizationCode) {
    return payment.connectorResponses.authorizationCode
  }
  // 3. En authorizationId del payment
  if (payment.authorizationId) {
    return payment.authorizationId
  }
  // 4. En fields de la transacción
  if (transaction.fields && Array.isArray(transaction.fields)) {
    const posibles = [
      'authorizationCode',
      'authorisationCode',
      'authCode',
      'webpayAuthCode',
      'authorizationId',
      'authId',
    ]
    for (const name of posibles) {
      const field = transaction.fields.find((f: any) => f.name === name)
      if (field?.value) {
        return field.value
      }
    }
  }
  // 5. Otras ubicaciones comunes
  return (
    payment.authorizationCode ||
    payment.paymentResponse?.authorizationCode ||
    payment.webpayResponse?.authorizationCode ||
    transaction.authorizationCode ||
    null
  )
}

/**
 * sendAuthorizationCode
 * Envía el authorizationCode a la transacción en VTEX Payments.
 */
async function sendAuthorizationCode(
  transactionId: string,
  authorizationCode: string
): Promise<any> {
  const url = `https://${VTEX_ACCOUNT}.vtexpayments.com.br/api/pvt/transactions/${transactionId}/additional-data`
  const payload = [
    {
      name: 'authorizationCode',
      value: authorizationCode,
    },
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
 * startHandling
 * Cambia el estado de la orden a "ready-for-handling" / "handling".
 */
async function startHandling(orderId: string): Promise<any> {
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
 * Handler principal
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

  if (authorizationCode && typeof authorizationCode !== 'string') {
    return res.status(400).json({ message: 'El parámetro "authorizationCode" debe ser un string' })
  }

  try {
    console.log(`🔍 Consultando orden: ${orderId}`)
    const order = await getOrderDetails(orderId)
    console.log(`📊 Estado actual: ${order.status}`)

    const transactions = order.paymentData?.transactions
    if (!transactions || transactions.length === 0) {
      throw new Error(`No se encontró información de transacciones en la orden ${orderId}`)
    }
    const transaction = transactions[0]
    if (!transaction.transactionId) {
      throw new Error(`No se encontró transactionId en la orden ${orderId}`)
    }
    const payment = transaction.payments?.[0] || {}
    const existingAuthCode = findAuthorizationCodeInOrder(order)
    const isAlreadyAuthorized =
      payment.status === 'approved' ||
      payment.status === 'authorized' ||
      ['payment-approved', 'ready-for-handling', 'invoiced'].includes(order.status)

    console.log(`🔐 Estado del pago: ${payment.status || 'sin status'}`)
    console.log(`✅ ¿Ya autorizado?: ${isAlreadyAuthorized}`)

    // Si ya está autorizado o en ready-for-handling/invoiced, no hacer nada adicional
    if (isAlreadyAuthorized) {
      if (order.status === 'payment-approved') {
        console.log('🚀 Moviendo de payment-approved a ready-for-handling')
        const handlingResponse = await startHandling(orderId)
        const updatedOrder = await getOrderDetails(orderId)
        return res.status(200).json({
          message: 'Orden aprobada previamente. Se movió a ready-for-handling.',
          originalStatus: order.status,
          finalStatus: updatedOrder.status,
          handlingResponse,
          authorizationCode: existingAuthCode || 'N/A',
        })
      }
      return res.status(200).json({
        message: 'La orden ya está en un estado válido para fulfillment.',
        currentStatus: order.status,
        authorizationCode: existingAuthCode || 'N/A',
        noActionNeeded: true,
      })
    }

    // Si está en payment-pending o pending, intentamos salto directo
    if (['payment-pending', 'pending'].includes(order.status)) {
      console.log('🐛 BUG VTEX: Pedido en payment-pending con pago confirmado en Transbank/Webpay.')
      console.log(`📅 Autorizado en: ${order.authorizedDate}`)
      console.log(`🔍 Código encontrado: ${existingAuthCode}`)

      const paymentId = await getPaymentId(orderId)
      let authResult = null
      let handlingResponse = null
      let finalStatus = order.status

      // Intentamos reenviar código si lo tenemos
      const codeToUse = authorizationCode?.trim() || existingAuthCode
      if (codeToUse) {
        try {
          console.log(`📤 Enviando authorizationCode: ${codeToUse}`)
          authResult = await sendAuthorizationCode(transaction.transactionId, codeToUse)
          console.log('✅ Código enviado exitosamente')
        } catch (authError) {
          console.log(`⚠️ Error enviando código (continuando): ${authError.message}`)
        }
      }

      // Ejecutamos startHandling directamente (salto a ready-for-handling)
      try {
        console.log('🚀 Ejecutando startHandling() desde payment-pending...')
        handlingResponse = await startHandling(orderId)
        console.log('✅ StartHandling ejecutado!')
        const finalOrder = await getOrderDetails(orderId)
        finalStatus = finalOrder.status
        console.log(`🎯 Estado final: ${finalStatus}`)
      } catch (handlingError) {
        console.log(`❌ Error en startHandling directo: ${handlingError.message}`)
        finalStatus = order.status
      }

      const wasSuccessful = finalStatus === 'ready-for-handling'
      return res.status(200).json({
        message: `INTENTO DIRECTO payment-pending → ready-for-handling: ${
          wasSuccessful ? '🎉 ÉXITO!' : '❌ FALLÓ'
        }`,
        originalStatus: order.status,
        finalStatus,
        codeUsed: codeToUse || 'Sin código',
        codeSource: authorizationCode?.trim() ? 'Usuario' : existingAuthCode ? 'VTEX' : 'Ninguno',
        operations: {
          authCodeSent: !!authResult,
          directStartHandling: !!handlingResponse,
        },
        responses: {
          authResult,
          handlingResponse: handlingResponse || null,
        },
        connectorResponses: payment.connectorResponses || null,
      })
    }

    // Si no está aprobado y no estaba en pending, procedemos con flujo normal
    console.log('🔄 Pago no autorizado, procediendo con flujo estándar')
    const paymentId = await getPaymentId(orderId)
    let authResult: any = null
    const codeToUse = authorizationCode?.trim() || existingAuthCode

    if (codeToUse) {
      console.log(`📤 Enviando authorizationCode: ${codeToUse}`)
      authResult = await sendAuthorizationCode(transaction.transactionId, codeToUse)
    }

    console.log('🔔 Notificando pago aprobado...')
    await notifyPaymentApproved(orderId, paymentId)

    // Esperamos hasta 5 ciclos de 3s para ver cambio a payment-approved o ready-for-handling
    let attempts = 0
    let currentStatus = order.status
    while (
      !['payment-approved', 'ready-for-handling'].includes(currentStatus) &&
      attempts < 5
    ) {
      console.log(`⏳ Intento ${attempts + 1}/5 - Estado: ${currentStatus}`)
      await new Promise((r) => setTimeout(r, 3000))
      const checkOrder = await getOrderDetails(orderId)
      currentStatus = checkOrder.status
      attempts++
    }

    let handlingResponse: any = {}
    if (currentStatus === 'payment-approved') {
      console.log('🚀 Moviendo a ready-for-handling...')
      handlingResponse = await startHandling(orderId)
      currentStatus = 'ready-for-handling'
    }

    return res.status(200).json({
      message: 'Flujo de pago procesado correctamente',
      finalStatus: currentStatus,
      authorizationCodeSent: codeToUse || 'No enviado',
      codeSource: authorizationCode?.trim() ? 'Usuario' : existingAuthCode ? 'VTEX' : 'Ninguno',
      wasAlreadyAuthorized: false,
      attemptsUsed: attempts,
      handlingResponse,
      authResult,
    })
  } catch (error) {
    console.error('❌ Error en la actualización del pedido:', error)
    return res.status(500).json({
      message: 'Error en la actualización del pedido',
      error: (error as Error).message,
    })
  }
}
