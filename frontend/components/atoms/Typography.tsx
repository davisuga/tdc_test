// components/atoms/Typography.tsx
import * as React from "react"
import { cn } from "app/lib/utils"

interface TypographyProps {
  children: React.ReactNode
  className?: string
}

export function Title({ children, className }: TypographyProps) {
  return (
    <p className={cn(
      "text-[#111418] tracking-light text-[32px] font-bold leading-tight",
      className
    )}>
      {children}
    </p>
  )
}

export function Subtitle({ children, className }: TypographyProps) {
  return (
    <h2 className={cn(
      "text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em]",
      className
    )}>
      {children}
    </h2>
  )
}

export function Description({ children, className }: TypographyProps) {
  return (
    <p className={cn(
      "text-[#617589] text-sm font-normal leading-normal",
      className
    )}>
      {children}
    </p>
  )
}

export function Text({ children, className }: TypographyProps) {
  return (
    <p className={cn(
      "text-[#111418] text-base font-medium leading-normal",
      className
    )}>
      {children}
    </p>
  )
}