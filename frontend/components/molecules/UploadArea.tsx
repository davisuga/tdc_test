// components/molecules/UploadArea.tsx
import * as React from "react"
import { Button } from "components/atoms/Button"
import { cn } from "app/lib/utils"

export interface UploadAreaProps {
  onUpload?: (files: FileList) => void
  title?: string
  description?: string
  buttonText?: string
  className?: string
}


export function UploadArea({
  onUpload,
  title = "Drag and drop photos here",
  description = "Upload 4-6 photos of the vehicle, including front, rear, interior, and any damage areas.",
  buttonText = "Upload Photos",
  className
}: UploadAreaProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload?.(e.dataTransfer.files)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload?.(e.target.files)
    }
  }

  return (
    <div className={cn("flex flex-col p-4", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center gap-6 rounded-lg border-2 border-dashed px-6 py-14 transition-colors",
          isDragging ? "border-[#1172d4] bg-[#f0f8ff]" : "border-[#dbe0e6]"
        )}
      >
        <div className="flex max-w-[480px] flex-col items-center gap-2">
          <p className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em] max-w-[480px] text-center">
            {title}
          </p>
          <p className="text-[#111418] text-sm font-normal leading-normal max-w-[480px] text-center">
            {description}
          </p>
        </div>
        <Button variant="secondary" onClick={handleClick}>
          {buttonText}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  )
}