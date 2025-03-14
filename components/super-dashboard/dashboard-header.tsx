"use client"

import { motion } from "framer-motion"

type ViewType = "logistics" | "accounting" | "products" | "analytics"

interface DashboardHeaderProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
}

export default function DashboardHeader({ activeView, onViewChange }: DashboardHeaderProps) {
  const views = [
    { id: "logistics", label: "Logística", icon: "truck" },
    { id: "accounting", label: "Contabilidad", icon: "dollar-sign" },
    { id: "products", label: "Productos", icon: "package" },
    { id: "analytics", label: "Análisis", icon: "bar-chart-2" },
  ]

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "truck":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
        )
      case "dollar-sign":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        )
      case "package":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        )
      case "bar-chart-2":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="mb-8 m-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Dashboard de Pedidos
          </h1>
          <p className="text-gray-400 mt-1">Gestión avanzada de pedidos, logística y análisis comercial</p>
        </div>

        <div className="mt-4 md:mt-0">
          <div className="text-sm text-gray-400">
            <span className="mr-2">Última actualización:</span>
            <span className="font-medium text-white">{new Date().toLocaleString("es-CL")}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 md:gap-4">
        {views.map((view) => (
          <motion.button
            key={view.id}
            onClick={() => onViewChange(view.id as ViewType)}
            className={`
              relative flex items-center gap-2 px-4 py-3 rounded-xl 
              transition-all duration-300 overflow-hidden
              ${
                activeView === view.id
                  ? "bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-white border border-blue-500/30"
                  : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 border border-gray-700/50"
              }
            `}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {getIcon(view.icon)}
            <span>{view.label}</span>

            {activeView === view.id && (
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 w-full"
                layoutId="activeTab"
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

