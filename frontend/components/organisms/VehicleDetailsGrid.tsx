// components/organisms/VehicleDetailsGrid.tsx
import * as React from "react"
import { VehicleDetailItem } from "components/molecules/VehicleDetailItem"
import { Subtitle } from "components/atoms/Typography"
import { cn } from "app/lib/utils"

export interface VehicleDetails {
  make: string
  model: string
  year: string
  mileage: string
  vin: string
}

export interface VehicleDetailsGridProps {
  details: VehicleDetails
  className?: string
}

export function VehicleDetailsGrid({ details, className }: VehicleDetailsGridProps) {
  return (
    <div className={cn("", className)}>
      <Subtitle className="px-4 pb-3 pt-5">Vehicle Details</Subtitle>
      <div className="p-4 grid grid-cols-2">
        <VehicleDetailItem 
          label="Make" 
          value={details.make} 
          className="pr-2"
        />
        <VehicleDetailItem 
          label="Model" 
          value={details.model} 
          className="pl-2"
        />
        <VehicleDetailItem 
          label="Year" 
          value={details.year} 
          className="pr-2"
        />
        <VehicleDetailItem 
          label="Mileage" 
          value={details.mileage} 
          className="pl-2"
        />
        <VehicleDetailItem 
          label="VIN" 
          value={details.vin} 
          className="col-span-2 pr-[50%]"
        />
      </div>
    </div>
  )
}