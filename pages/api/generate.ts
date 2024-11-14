import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI || ''
})

export const runtime = 'edge'

export default async function handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const projectType = searchParams.get('projectType')
    const audience = searchParams.get('audience')
    const tone = searchParams.get('tone')

    if (!projectType || !audience || !tone) {
      return new Response('Missing parameters', { status: 400 })
    }

    // Primero obtenemos la respuesta completa sin streaming
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant specialized in generating concise, project-specific text that fits the precise dimensions and requirements of graphic design pieces.'
        },
        {
          role: 'user',
          content: `Write marketing text for a ${projectType} targeting ${audience} using a ${tone} tone.`
        }
      ],
      stream: false // Desactivamos streaming para obtener la respuesta completa
    })

    // Extraemos el texto de la respuesta
    const text = completion.choices[0]?.message?.content || ''

    return new Response(text, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response('Error generating text', { status: 500 })
  }
}