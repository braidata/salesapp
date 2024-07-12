import type { NextApiRequest, NextApiResponse } from 'next'
import axios, { AxiosError } from 'axios'

type Data = {
  success: boolean
  data?: any
  error?: string
  details?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

  try {
    if (!process.env.SELASKI_KEY || !process.env.SELASKI_PASS) {
      throw new Error('SELASKI_KEY or SELASKI_PASS environment variables are missing')
    }

    const data = {
      key_access: process.env.SELASKI_KEY,
      key_secret: process.env.SELASKI_PASS
    }

    const response = await axios.post(
      'https://api.selaski.com:8200/api/v2/auth/login',
      data,
      {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'  // Añadimos este encabezado
        }
      }
    )

    res.status(200).json({ success: true, data: response.data })
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