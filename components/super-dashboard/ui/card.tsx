"use client"

import type React from "react"

import { motion } from "framer-motion"

interface CardProps {
  title?: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  isLoading?: boolean
}

export default function Card({ title, icon, children, className = "", isLoading = false }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        backdrop-blur-lg bg-white/5 rounded-xl border border-white/10
        shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden
        ${className}
      `}
    >
      {title && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            {icon && <div className="text-blue-400">{icon}</div>}
            <h3 className="font-medium text-white">{title}</h3>
          </div>
        </div>
      )}

      <div className="p-2 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
            <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : null}

        {children}
      </div>
    </motion.div>
  )
}

