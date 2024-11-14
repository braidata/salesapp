// Primero instala: npm install react-markdown remark-gfm
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

export default function TextGenerator() {
  const [projectType, setProjectType] = useState('')
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState('')
  const [generatedText, setGeneratedText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setGeneratedText('')

    const queryParams = new URLSearchParams({
      projectType,
      audience,
      tone
    }).toString()

    try {
      const response = await fetch(`/api/generate?${queryParams}`)
      if (!response.ok) throw new Error('API request failed')
      
      const text = await response.text()
      setGeneratedText(text)
    } catch (error) {
      console.error('Error:', error)
      setGeneratedText('An error occurred while generating text.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <Card className="w-full max-w-2xl backdrop-blur-md bg-black/10 border border-gray-700 shadow-[0_8px_30px_rgba(255,255,255,0.1)]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-100">Generador de Textos para Marketing con IA</CardTitle>
          <CardDescription className="text-gray-300">Ingresa los detalles de tu proyecto para generar los textos</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectType" className="text-gray-200">Descripción de Proyecto</Label>
              <Input
                id="projectType"
                placeholder="e.g. poster, brochure, social media post"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="bg-black/20 border-gray-600 text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience" className="text-gray-200">Público Objetivo</Label>
              <Input
                id="audience"
                placeholder="e.g. young professionals, seniors, students"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="bg-black/20 border-gray-600 text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone" className="text-gray-200">Tono Deseado</Label>
              <Input
                id="tone"
                placeholder="e.g. professional, friendly, humorous"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="bg-black/20 border-gray-600 text-gray-100"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg"
            >
              {isLoading ? 'Generando...' : 'Generar Texto'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="w-full min-h-[160px] bg-black/20 border border-gray-600 rounded-md p-4">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              className="prose prose-invert max-w-none"
            >
              {generatedText}
            </ReactMarkdown>
          </div>
          <Button
            onClick={() => navigator.clipboard.writeText(generatedText)}
            variant="outline"
            className="w-full mt-2"
          >
            Copiar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}