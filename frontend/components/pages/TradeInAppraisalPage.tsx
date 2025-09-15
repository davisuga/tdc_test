// components/pages/TradeInAppraisalPage.tsx
import * as React from "react"
import { VehicleDetailsGrid, type VehicleDetails } from "components/organisms/VehicleDetailsGrid"
import { ConditionAnalysis, type ConditionIssue } from "components/organisms/ConditionAnalysis"
import { MarketValuation } from "components/organisms/MarketValuation"
import { Title, Description } from "components/atoms/Typography"
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
