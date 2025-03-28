'use client'

import { useState } from 'react'

interface ResultadoRUT {
  rut: string
  isValid: boolean
}

export default function RutValidator() {
  const [input, setInput] = useState('')
  const [resultados, setResultados] = useState<ResultadoRUT[]>([])
  const [cargando, setCargando] = useState(false)

  const validarRuts = async () => {
    const ruts = input
      .split('\n')
      .map(r => r.trim())
      .filter(Boolean)

    setCargando(true)
    const nuevosResultados: ResultadoRUT[] = []

    for (const rut of ruts) {
      try {
        const res = await fetch(`/api/rutTester?rut=${rut}`)
        const data = await res.json()
        nuevosResultados.push({
          rut: data.rut,
          isValid: data.isValid,
        })
      } catch {
        nuevosResultados.push({
          rut,
          isValid: false,
        })
      }
    }

    setResultados(nuevosResultados)
    setCargando(false)
  }

  return (
    <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-lg max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Validador de RUTs</h2>

      <textarea
        className="w-full h-40 p-3 bg-gray-800 border border-gray-700 rounded-md mb-4 focus:outline-none focus:ring focus:ring-cyan-500"
        placeholder="Ingresa RUTs con dígito verificador (uno por línea)..."
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      <button
        onClick={validarRuts}
        className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50"
        disabled={cargando}
      >
        {cargando ? 'Validando...' : 'Validar RUTs'}
      </button>

      {resultados.length > 0 && (
        <table className="w-full mt-6 table-auto border-collapse">
          <thead>
            <tr className="bg-cyan-700 text-white">
              <th className="p-2 border border-gray-700">RUT</th>
              <th className="p-2 border border-gray-700">¿Es válido?</th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((r, i) => (
              <tr key={i} className="text-center">
                <td className="p-2 border border-gray-700">{r.rut}</td>
                <td
                  className={`p-2 border border-gray-700 font-semibold ${
                    r.isValid ? 'text-green-400' : 'text-red-500'
                  }`}
                >
                  {r.isValid ? 'Válido' : 'No válido'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
