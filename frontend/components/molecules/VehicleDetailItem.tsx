// components/molecules/VehicleDetailItem.tsx
import * as React from "react"
import { Description, Text } from "components/atoms/Typography"
import { cn } from "app/lib/utils"

export interface VehicleDetailItemProps {
  label: string
  value: string
  className?: string
}

export function VehicleDetailItem({ label, value, className }: VehicleDetailItemProps) {
  return (
    <div className={cn("flex flex-col gap-1 border-t border-solid border-t-[#dbe0e6] py-4", className)}>
      <Description>{label}</Description>
      <Text className="text-[#111418] text-sm font-normal leading-normal">{value}</Text>
    </div>
  )
}