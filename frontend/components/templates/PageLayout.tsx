// components/templates/PageLayout.tsx
import * as React from "react"
import { cn } from "app/lib/utils"

export interface PageLayoutProps {
  children: React.ReactNode
  className?: string
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn(
      "relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden",
      className
    )}
    style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-40 flex flex-1 justify-center py-5">
          {children}
        </div>
      </div>
    </div>
  )
}