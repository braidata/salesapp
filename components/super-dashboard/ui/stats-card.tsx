"use client"

import type React from "react"

import { motion } from "framer-motion"

interface StatsCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export default function StatsCard({ title, value, icon, trend, className = "" }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        backdrop-blur-lg bg-white/5 rounded-xl border border-white/10
        shadow-[5px_5px_15px_rgba(0,0,0,0.2),-5px_-5px_15px_rgba(255,255,255,0.05)]
        p-6 h-full
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold mt-2 text-white">{value}</h3>

          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs ${trend.isPositive ? "text-green-400" : "text-red-400"} flex items-center`}>
                {trend.isPositive ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                )}
                {trend.value}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs. período anterior</span>
            </div>
          )}
        </div>

        {icon && (
          <div className="p-3 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  )
}

