// components/pages/TradeInAppraisalPage.tsx
import * as React from "react"
import { VehicleDetailsGrid, type VehicleDetails } from "components/organisms/VehicleDetailsGrid"
import { ConditionAnalysis, type ConditionIssue } from "components/organisms/ConditionAnalysis"
import { MarketValuation } from "components/organisms/MarketValuation"
import { Title, Description } from "components/atoms/Typography"
import { Car, Armchair, CircleDot } from "lucide-react"
import { cn } from "app/lib/utils"

export interface TradeInAppraisalPageProps {
  vehicleDetails: VehicleDetails
  visualScore: number
  maxScore?: number
  scoreDescription?: string
  conditionIssues: ConditionIssue[]
  marketValueRange: string
  tradeInValue: string
  tradeInDescription?: string
  aiConfidence: number
  aiConfidenceDescription?: string
  disclaimer?: string
  className?: string
}

export function TradeInAppraisalPage({
  vehicleDetails,
  visualScore,
  maxScore = 10,
  scoreDescription = "Excellent condition with minor wear",
  conditionIssues,
  marketValueRange,
  tradeInValue,
  tradeInDescription,
  aiConfidence,
  aiConfidenceDescription,
  disclaimer,
  className
}: TradeInAppraisalPageProps) {
  return (
    <div className={cn("px-40 flex flex-1 justify-center py-5", className)}>
      <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
        {/* Header Section */}
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <div className="flex min-w-72 flex-col gap-3">
            <Title>Trade-In Appraisal Report</Title>
            <Description>AI-Assisted Estimate for a {vehicleDetails.year} {vehicleDetails.model}</Description>
          </div>
        </div>

        {/* Vehicle Details */}
        <VehicleDetailsGrid details={vehicleDetails} />

        {/* Condition Analysis */}
        <ConditionAnalysis
          visualScore={visualScore}
          maxScore={maxScore}
          scoreDescription={scoreDescription}
          issues={conditionIssues}
        />

        {/* Market Valuation */}
        <MarketValuation
          marketValueRange={marketValueRange}
          tradeInValue={tradeInValue}
          tradeInDescription={tradeInDescription}
          aiConfidence={aiConfidence}
          aiConfidenceDescription={aiConfidenceDescription}
          disclaimer={disclaimer}
        />
      </div>
    </div>
  )
}

// Default props for easy story creation
export const defaultTradeInData: Omit<TradeInAppraisalPageProps, 'className'> = {
  vehicleDetails: {
    make: "Acme",
    model: "Sedan X",
    year: "2018",
    mileage: "65,000 miles",
    vin: "1ABC234DEF567890"
  },
  visualScore: 8,
  maxScore: 10,
  scoreDescription: "Excellent condition with minor wear",
  conditionIssues: [
    {
      id: "scratches",
      title: "Scratches",
      description: "Minor scratches on the rear bumper",
      icon: <Car size={24} />
    },
    {
      id: "interior",
      title: "Interior Wear",
      description: "Slight discoloration on the driver's seat",
      icon: <Armchair size={24} />
    },
    {
      id: "tires",
      title: "Tire Condition",
      description: "Tire tread depth within acceptable limits",
      icon: <CircleDot size={24} />
    }
  ],
  marketValueRange: "$18,500 - $20,500",
  tradeInValue: "$19,250",
  tradeInDescription: "This value considers the vehicle's condition, market trends, and dealership profit margins.",
  aiConfidence: 95,
  aiConfidenceDescription: "High confidence in the analysis",
  disclaimer: "Disclaimer: This is an AI-Assisted Estimate. Final trade-in value may vary based on a physical inspection and dealership policies."
}