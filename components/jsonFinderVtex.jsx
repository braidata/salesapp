// pages/toolJson.js

import { useState } from 'react'
import axios from 'axios'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

export default function ToolJson() {
  const [idPedido, setIdPedido] = useState('')
  const [jsonData, setJsonData] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    setIdPedido(e.target.value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setJsonData(null)

    try {
      const response = await axios.post('/api/toolJsonVtex', { idPedido })
      setJsonData(response.data)
    } catch (error) {
      console.error('Error al obtener los datos:', error)
      setJsonData({ error: 'Error al obtener los datos' })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
    alert('JSON copiado al portapapeles')
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    const file = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
    element.href = URL.createObjectURL(file)
    element.download = `pedido_${idPedido}.json`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-10 px-4 mt-8 mb-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Herramienta JSON de Pedido y Cliente</h1>
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex items-center">
            <label htmlFor="idPedido" className="mr-2 font-medium">
              ID de Pedido:
            </label>
            <input
              type="text"
              id="idPedido"
              value={idPedido}
              onChange={handleInputChange}
              required
              className="flex-grow border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="ml-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none"
            >
              Buscar
            </button>
          </div>
        </form>

        {loading && <p className="text-center text-gray-600">Cargando...</p>}

        {jsonData && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleCopy}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 focus:outline-none mr-2"
              >
                Copiar JSON
              </button>
              <button
                onClick={handleDownload}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none"
              >
                Descargar JSON
              </button>
            </div>
            <div className="bg-gray-800 rounded-md overflow-hidden">
              <SyntaxHighlighter
                language="json"
                style={oneDark}
                customStyle={{ margin: 0, padding: '1rem' }}
              >
                {JSON.stringify(jsonData, null, 2)}
              </SyntaxHighlighter>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
