import type { NextApiRequest, NextApiResponse } from 'next'
import axios, { AxiosError } from 'axios'
import { getSelaskiToken } from '../../utils/getSelaskiToken'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

  try {
    const token = await getSelaskiToken()

    if (!token) {
      throw new Error('Failed to obtain Selaski token')
    }

    // Configurar la respuesta para streaming
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
    })

    // Iniciar el streaming de la respuesta
    res.write('{"success":true,"data":[')

    let isFirstChunk = true

    const response = await axios.get(
      'https://api.selaski.com:8200/api/v2/orders/import/allOrders',
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        responseType: 'stream',
      }
    )

    response.data.on('data', (chunk: Buffer) => {
      // Procesar y enviar cada chunk
      const chunkStr = chunk.toString()
      if (!isFirstChunk) {
        res.write(',')
      } else {
        isFirstChunk = false
      }
      res.write(chunkStr)
    })

    response.data.on('end', () => {
      // Finalizar la respuesta
      res.write(']}')
      res.end()
    })

  } catch (error) {
    console.error('Error details:', error)
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      res.status(axiosError.response?.status || 500).json({ 
        success: false, 
        error: 'Error calling Selaski API', 
        details: axiosError.response?.data || axiosError.message 
      })
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Internal Server Error',
        details: (error as Error).message 
      })
    }
  }
}