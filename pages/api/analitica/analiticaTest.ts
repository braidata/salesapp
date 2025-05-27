// pages/api/analytics-test.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleAuth } from 'google-auth-library';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Intenta una autenticación básica primero
    const auth = new GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || ''),
      scopes: ['https://www.googleapis.com/auth/analytics.readonly']
    });
    
    const client = await auth.getClient();
    const projectId = await auth.getProjectId();
    
    // Si llega aquí, la autenticación básica funcionó
    res.status(200).json({
      success: true,
      message: 'Autenticación exitosa con Google Cloud',
      data: { projectId }
    });
  } catch (error: any) {
    console.error('Error completo:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error de autenticación',
      error: error.message
    });
  }
}