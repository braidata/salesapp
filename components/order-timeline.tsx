import { formatDate } from "@/lib/utils"

export default function OrderTimeline({ orderData }) {
  // Create timeline events based on order data
  const events = []

  if (orderData.creationDate) {
    events.push({
      date: orderData.creationDate,
      title: "Pedido Creado",
      description: "El pedido ha sido creado exitosamente",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
    })
  }

  if (orderData.authorizedDate) {
    events.push({
      date: orderData.authorizedDate,
      title: "Pago Autorizado",
      description: `Pago autorizado con ${orderData.paymentData?.transactions?.[0]?.payments?.[0]?.paymentSystemName || "método de pago"}`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
      ),
    })
  }

  if (orderData.status === "handling") {
    events.push({
      date: orderData.lastChange,
      title: "Preparando Entrega",
      description: "El pedido está siendo preparado para su envío",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 13H12z" />
        </svg>
      ),
    })
  }

  if (orderData.invoicedDate) {
    events.push({
      date: orderData.invoicedDate,
      title: "Facturado",
      description: "El pedido ha sido facturado y está listo para ser enviado",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
      ),
    })
  }

  // Sort events by date
  events.sort((a, b) => new Date(a.date) - new Date(b.date))

  return (
    <div className="relative">
      {events.map((event, index) => (
        <div key={index} className="flex items-start mb-8 relative">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 mr-4 z-10">
            {event.icon}
          </div>

          {/* Vertical line connecting events */}
          {index < events.length - 1 && <div className="absolute left-5 top-10 w-0.5 h-full -mt-2 bg-gray-700"></div>}

          <div>
            <h3 className="font-medium text-white">{event.title}</h3>
            <p className="text-gray-300 text-sm">{event.description}</p>
            <p className="text-gray-400 text-xs mt-1">{formatDate(event.date, true)}</p>
          </div>
        </div>
      ))}

      {events.length === 0 && (
        <div className="text-center py-6 text-gray-300">No hay información de seguimiento disponible</div>
      )}
    </div>
  )
}

