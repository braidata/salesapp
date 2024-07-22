import axios from 'axios'

const url = process.env.NEXTAUTH_URL

export async function getSelaskiToken() {
  try {
    const response = await axios.post(`${url}/api/apiSelaski`)
    if (response.data.success && response.data.data.access_token) {
      return response.data.data.access_token
    } else {
      throw new Error('Failed to get Selaski token')
    }
  } catch (error) {
    console.error('Error getting Selaski token:', error)
    throw error
  }
}