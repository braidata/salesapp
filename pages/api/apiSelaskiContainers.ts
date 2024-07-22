import type { NextApiRequest, NextApiResponse } from 'next'
import axios, { AxiosError } from 'axios'
import { getSelaskiToken } from '../../utils/getSelaskiToken'

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
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

  try {
    const token = await getSelaskiToken()
    if (!token) {
      throw new Error('SELASKI_TOKEN environment variable is missing')
    }

    const response = await axios.get(
      'https://api.selaski.com:8200/api/v2/references/containers',
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
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