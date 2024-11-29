import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI || ''
})

export const runtime = 'edge'

export default async function handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const projectType = searchParams.get('projectType')
    const projectContent = searchParams.get('projectContent')
    const audience = searchParams.get('audience')
    const tone = searchParams.get('tone')
    const brand = searchParams.get('brand')
    const contentSize = searchParams.get('contentSize')
    const bannedWords = searchParams.get('bannedWords')
    const country = searchParams.get('country')
    const variants = searchParams.get('variants')

    if (!projectType || !projectContent || !audience || !tone || !brand || !contentSize) {
      return new Response('Missing parameters', { status: 400 })
    }

    const bannedWordsArray = bannedWords ? bannedWords.split(',').map(word => word.trim()) : []

    const systemPrompt = `You are an AI assistant specialized in generating marketing content for Chilean audiences.
    Key requirements:
    - Generate exactly ${contentSize} characters of content
    - Generate ${variants} different versions
    - Separate each version with "---" on its own line
    - Write in Spanish
    - Focus on Chilean market and cultural context
    - Maintain brand voice and identity
    ${bannedWordsArray.length > 0 ? `- Avoid using these words: ${bannedWordsArray.join(', ')}` : ''}
    - Ensure content is appropriate for the specific project type and format`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Create marketing content for ${brand} brand in Chile:
          - Project Type: ${projectType}
          - Content Details: ${projectContent}
          - Target Audience: ${audience}
          - Tone: ${tone}
          Please generate content that matches exactly ${contentSize} characters.`
        }
      ],
      stream: false
    })

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