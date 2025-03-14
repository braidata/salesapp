import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs))
// },

// Mejorar la función formatCurrency para manejar mejor los valores no numéricos
export function formatCurrency(value: number): string {
  // Manejar valores nulos, indefinidos o NaN
  if (value === undefined || value === null || isNaN(value)) {
    value = 0
  }

  // Format as CLP currency
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(dateString: string, includeTime = false): string {
  if (!dateString) return "N/A"

  try {
    const date = new Date(dateString)

    if (isNaN(date.getTime())) return "Fecha inválida"

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    }

    if (includeTime) {
      options.hour = "2-digit"
      options.minute = "2-digit"
    }

    return new Intl.DateTimeFormat("es-CL", options).format(date)
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Fecha inválida"
  }
}

export function copyToClipboard(text: string): void {
  if (!text) {
    console.warn("Attempted to copy empty text to clipboard")
    return
  }

  navigator.clipboard.writeText(text).catch((err) => {
    console.error("Error al copiar al portapapeles:", err)
  })
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Función para manejar errores de API de forma consistente
export function handleApiError(error: any): string {
  console.error("API Error:", error)

  if (error instanceof Error) {
    return `Error: ${error.message}`
  }

  if (typeof error === "string") {
    return `Error: ${error}`
  }

  return "Se produjo un error desconocido al conectar con el servidor"
}

