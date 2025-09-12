// components/molecules/ProgressSection.tsx
import * as React from "react"
import { ProgressBar } from "components/atoms/ProgressBar"
import { Text } from "components/atoms/Typography"
import { cn } from "app/lib/utils"

export interface ProgressSectionProps {
  current: number
  total: number
  label?: string
  className?: string
}

export function ProgressSection({ 
  current, 
  total, 
  label,
  className 
}: ProgressSectionProps) {
  const defaultLabel = `Uploading ${current} of ${total} photos`
  
  return (
    <div className={cn("flex flex-col gap-3 p-4", className)}>
      <div className="flex gap-6 justify-between">
        <Text>{label || defaultLabel}</Text>
      </div>
      <ProgressBar value={current} max={total} />
    </div>
  )
}