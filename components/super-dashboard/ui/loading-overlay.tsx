"use client"

import { motion } from "framer-motion"

export default function LoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        className="bg-gray-900/80 backdrop-blur-lg p-8 rounded-xl border border-gray-700 shadow-2xl flex flex-col items-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-16 h-16 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-white text-lg font-medium">Conectando con la API...</p>
        <p className="text-gray-400 text-sm mt-2">Obteniendo datos en tiempo real</p>
      </motion.div>
    </motion.div>
  )
}

