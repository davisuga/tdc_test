// components/atoms/Button.tsx
import * as React from "react"
import { cn } from "app/lib/utils"
import {type ButtonHTMLAttributes, forwardRef } from "react"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, children, ...props }, ref) => {
    const variants = {
      primary: "bg-[#1172d4] text-white hover:bg-[#0e5eb3]",
      secondary: "bg-[#f0f2f4] text-[#111418] hover:bg-[#e1e4e8]"
    }

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base"
    }

    return (
      <button
        ref={ref}
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-lg font-bold leading-normal tracking-[0.015em] transition-colors cursor-pointer",
          variants[variant],
          sizes[size],
          fullWidth ? "w-full" : "min-w-[84px] max-w-[480px]",
          className
        )}
        {...props}
      >
        <span className="truncate">{children}</span>
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }