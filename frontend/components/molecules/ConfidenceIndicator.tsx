// components/molecules/ConfidenceIndicator.tsx
import * as React from "react"
import { ProgressBar } from "components/atoms/ProgressBar"
import { Text, Description } from "components/atoms/Typography"
import { cn } from "app/lib/utils"

export interface ConfidenceIndicatorProps {
  label: string
  value: number
  max?: number
  description?: string
  className?: string
}

export function ConfidenceIndicator({ 
  label, 
  value, 
  max = 100, 
  description,
  className 
}: ConfidenceIndicatorProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  return (
    <div className={cn("flex flex-col gap-3 p-4", className)}>
      <div className="flex gap-6 justify-between">
        <Text>{label}</Text>
        <p className="text-[#111418] text-sm font-normal leading-normal">
          {percentage}%
        </p>
      </div>
      <ProgressBar value={value} max={max} />
      {description && (
        <Description>{description}</Description>
      )}
    </div>
  )
}