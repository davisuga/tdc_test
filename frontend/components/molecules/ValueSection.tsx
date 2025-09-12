// components/molecules/ValueSection.tsx
import * as React from "react"
import { Title, Subtitle, Text } from "components/atoms/Typography"
import { cn } from "app/lib/utils"

export interface ValueSectionProps {
  title: string
  value?: string
  description?: string
  valueSize?: "large" | "medium" | "small"
  className?: string
}

export function ValueSection({ 
  title, 
  value, 
  description, 
  valueSize = "medium",
  className 
}: ValueSectionProps) {
  const ValueComponent = valueSize === "large" ? Title : 
                        valueSize === "medium" ? 
                        ({ children, className: cn }: { children: React.ReactNode, className?: string }) => (
                          <h2 className={`text-[#111418] tracking-light text-[28px] font-bold leading-tight ${cn || ''}`}>
                            {children}
                          </h2>
                        ) : Text

  return (
    <div className={cn("", className)}>
      <Subtitle className="px-4 pb-3 pt-5">{title}</Subtitle>
      {description && (
        <Text className="text-base font-normal leading-normal pb-3 pt-1 px-4">
          {description}
        </Text>
      )}
      {value && (
        <ValueComponent className="px-4 text-left pb-3 pt-5">
          {value}
        </ValueComponent>
      )}
    </div>
  )
}