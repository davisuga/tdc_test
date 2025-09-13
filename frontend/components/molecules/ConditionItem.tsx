// components/molecules/ConditionItem.tsx
import * as React from "react"
import { Text, Description } from "components/atoms/Typography"
import { cn } from "app/lib/utils"

export interface ConditionItemProps {
  title: string
  description: string
  icon: React.ReactNode
  className?: string
}

export function ConditionItem({ title, description, icon, className }: ConditionItemProps) {
  return (
    <div className={cn("flex items-center gap-4 bg-white px-4 min-h-[72px] py-2", className)}>
      <div className="text-[#111418] flex items-center justify-center rounded-lg bg-[#f0f2f4] shrink-0 size-12">
        {icon}
      </div>
      <div className="flex flex-col justify-center">
        <Text className="line-clamp-1">{title}</Text>
        <Description className="line-clamp-2">{description}</Description>
      </div>
    </div>
  )
}