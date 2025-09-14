// components/molecules/PhotoGrid.tsx
import * as React from "react"
import { cn } from "app/lib/utils"

export interface Photo {
  id: string
  url: string
  alt?: string
}

export interface PhotoGridProps {
  photos: Photo[]
  className?: string
}

export function PhotoGrid({ photos, className }: PhotoGridProps) {
  return (
    <div className={cn(
      "flex flex-1 flex-wrap gap-3 p-4 ",
      className
    )}>
      {photos.map((photo) => (
        <div key={photo.id} className="flex flex-col gap-3">
          <div
            className="w-[200px] h-[200px] bg-center bg-no-repeat bg-cover rounded-lg"
            style={{ backgroundImage: `url("${photo.url}")` }}
            role="img"
            aria-label={photo.alt || "Vehicle photo"}
          />
        </div>
      ))}
    </div>
  )
}