import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { orderId } = req.query

  if (!orderId || typeof orderId !== "string") {
    return res.status(400).json({ message: "Falta el parámetro orderId" })
  }

  const VTEX_API_URL = `https://imegab2c.myvtex.com/api/oms/pvt/orders/${orderId}`
  const API_VTEX_TOKEN = process.env.API_VTEX_TOKEN

  if (!API_VTEX_TOKEN) {
    return res.status(500).json({ message: "API_VTEX_TOKEN no está configurada en las variables de entorno" })
  }

  try {
    const response = await fetch(VTEX_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VTEX-API-AppKey": process.env.API_VTEX_KEY || "", // Asegurate de que esta variable contenga la clave correcta
        "X-VTEX-API-AppToken": process.env.API_VTEX_TOKEN || "", // Si necesitás un token adicional
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Error en la API de VTEX: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error("Error al obtener la orden de VTEX:", error)
    return res.status(500).json({ message: "Error al obtener la orden de VTEX" })
  }
}
