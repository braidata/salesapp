import type { NextApiRequest, NextApiResponse } from 'next'
import axios, { AxiosError } from 'axios'
import { getSelaskiToken } from '../../utils/getSelaskiToken'

type OrderData = {
  Order: {
    Fraccionada: boolean
    OrderNumber: string
    OrderDetails: string
    TotalValue: number
    IdMoney: number
    DateTime: string
    IdProvider: number
    IdIncoterm: number
    DeliveryDate: string
    Status: number
    IdBusiness: number
    IdTag: number
  }
  Products: Array<{
    SKU: string
    Mark: string
    Position: string
    Description: string
    Detail: string
    Observation: string
    Quantity: number
    IdUnit: number
    ValueUnit: number
    QtyBox: number
    Weight: number
    Volumen: number
  }>
}

type ResponseData = {
  success: boolean
  data?: any
  error?: string
  details?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

  try {
    const token = await getSelaskiToken()

    if (!token) {
      throw new Error('Failed to obtain Selaski token')
    }

    const orderData: OrderData = req.body

    const response = await axios.post(
      'https://api.selaski.com:8200/api/v2/orders/import/create',
      orderData,
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        maxBodyLength: Infinity
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