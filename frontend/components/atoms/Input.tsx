// components/atoms/Input.tsx
import * as React from "react"
import { cn } from "app/lib/utils"
import { type InputHTMLAttributes, forwardRef } from "react"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex flex-col min-w-40 flex-1">
        {label && (
          <span className="text-sm font-medium text-[#111418] mb-1">{label}</span>
        )}
        <input
          ref={ref}
          className={cn(
            "form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg",
            "text-[#111418] focus:outline-0 focus:ring-0 border border-[#dbe0e6]",
            "bg-white focus:border-[#dbe0e6] h-14 placeholder:text-[#617589]",
            "p-[15px] text-base font-normal leading-normal",
            className
          )}
          {...props}
        />
      </label>
    )
  }
)
Input.displayName = "Input"

export { Input }