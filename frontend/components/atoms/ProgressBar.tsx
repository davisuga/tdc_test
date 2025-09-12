// components/atoms/ProgressBar.tsx
import * as React from "react"
import { cn } from "app/lib/utils"

export interface ProgressBarProps {
  value: number
  max?: number
  className?: string
}

export function ProgressBar({ value, max = 100, className }: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn("rounded bg-[#dbe0e6]", className)}>
      <div 
        className="h-2 rounded bg-[#111418] transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}