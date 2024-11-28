import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useState } from 'react'

const brands = [
  { id: 'ventus', name: 'Ventus' },
  { id: 'blanik', name: 'Blanik' },
  { id: 'bbqgrill', name: 'BBQ Grill' },
  { id: 'libero', name: 'Libero' },
  { id: 'imega', name: 'Imega' },
  { id: 'rental', name: 'Rental' }
]

const projectTypes = [
  { id: 'instagram-post', name: 'Post para Instagram' },
  { id: 'linkedin-post', name: 'Post para Linkedin' },
  { id: 'facebook-post', name: 'Post para Facebook' },
  { id: 'llamado-banner', name: 'Llamado para Banners' },
  { id: 'email', name: 'Email Marketing' },
  { id: 'blog', name: 'Blog' },
  { id: 'product-description', name: 'Descripción de Producto' },
  { id: 'banner', name: 'Banner Publicitario' },
  { id: 'website', name: 'Contenido Web' },
  { id: 'brochure', name: 'Folleto' },
  
]

const contentSizes = [
  { id: '150', name: 'Muy Corto (~150 caracteres)' },
  { id: '280', name: 'Corto (~280 caracteres)' },
  { id: '500', name: 'Medio (~500 caracteres)' },
  { id: '1000', name: 'Largo (~1000 caracteres)' },
  { id: '2000', name: 'Muy Largo (~2000 caracteres)' },
  { id: '3500', name: 'Blog (~3500 caracteres)' }
]

const CustomTextArea = ({ label, value, onChange, placeholder, className = "", rows = 4 }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{label}</label>
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`w-full p-3 rounded-lg
        bg-white/70 dark:bg-gray-700/50 
        border border-gray-200 dark:border-gray-600 
        text-gray-900 dark:text-white 
        placeholder-gray-500 dark:placeholder-gray-400 
        backdrop-blur-sm
        shadow-inner dark:shadow-none
        focus:ring-2 focus:ring-blue-500 focus:border-transparent 
        resize-y min-h-[64px]
        transition-all duration-300 ${className}`}
    />
  </div>
)

const CustomSelect = ({ label, value, onChange, options }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full p-3 rounded-lg
        bg-white/70 dark:bg-gray-700/50 
        border border-gray-200 dark:border-gray-600 
        text-gray-900 dark:text-white 
        backdrop-blur-sm
        shadow-inner dark:shadow-none
        focus:ring-2 focus:ring-blue-500 focus:border-transparent 
        transition-all duration-300"
    >
      <option value="">Seleccionar...</option>
      {options.map(option => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  </div>
)

export default function TextGenerator() {
  const [projectType, setProjectType] = useState('')
  const [projectContent, setProjectContent] = useState('')
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState('')
  const [brand, setBrand] = useState('')
  const [contentSize, setContentSize] = useState('')
  const [bannedWords, setBannedWords] = useState('')
  const [generatedText, setGeneratedText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setGeneratedText('')

    const queryParams = new URLSearchParams({
      projectType,
      projectContent,
      audience,
      tone,
      brand,
      contentSize,
      country: 'Chile',
      bannedWords
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
    <div className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 
      p-4">
      <div className="w-full max-w-4xl rounded-xl p-6
        /* Glassmorphic Effect */
        backdrop-blur-md
        bg-white/30 dark:bg-gray-800/30
        
        /* Neumorphic Effect */
        border border-gray-100 dark:border-gray-700
        shadow-[20px_20px_60px_#d1d1d1,-20px_-20px_60px_#ffffff] 
        dark:shadow-[20px_20px_60px_#1a1a1a,-20px_-20px_60px_#242424]
        
        /* Modern & Minimal */
        transition-all duration-300">
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Generador de Textos para Marketing con IA
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Ingresa los detalles de tu proyecto para generar los textos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomSelect
              label="Marca"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              options={brands}
            />
            
            <CustomSelect
              label="Tipo de Proyecto"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              options={projectTypes}
            />
          </div>

          <CustomTextArea
            label="Descripción del Contenido"
            value={projectContent}
            onChange={(e) => setProjectContent(e.target.value)}
            placeholder="Describe el contenido específico que necesitas..."
            rows={4}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomTextArea
              label="Público Objetivo"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Describe tu audiencia..."
              rows={3}
            />

            <CustomTextArea
              label="Tono Deseado"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="Describe el tono..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomSelect
              label="Tamaño del Contenido"
              value={contentSize}
              onChange={(e) => setContentSize(e.target.value)}
              options={contentSizes}
            />

            <CustomTextArea
              label="Palabras Excluidas"
              value={bannedWords}
              onChange={(e) => setBannedWords(e.target.value)}
              placeholder="Ingresa palabras que no deseas usar, separadas por comas..."
              rows={3}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 
              rounded-lg transition duration-300 ease-in-out transform hover:-translate-y-1 
              hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
              backdrop-blur-sm bg-opacity-90"
          >
            {isLoading ? 'Generando...' : 'Generar Texto'}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <div className="w-full min-h-[160px] rounded-lg p-4 
            bg-white/70 dark:bg-gray-700/50 
            border border-gray-200 dark:border-gray-600
            backdrop-blur-sm
            prose dark:prose-invert max-w-none
            overflow-y-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {generatedText}
            </ReactMarkdown>
          </div>
          
          <button
            onClick={() => navigator.clipboard.writeText(generatedText)}
            className="w-full py-2 px-4 rounded-lg
              border border-gray-200 dark:border-gray-600 
              text-gray-700 dark:text-gray-200 
              hover:bg-gray-100 dark:hover:bg-gray-700/50 
              backdrop-blur-sm
              transition duration-300"
          >
            Copiar
          </button>
        </div>
      </div>
    </div>
  )
}