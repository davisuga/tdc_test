// components/organisms/MarketValuation.tsx
import * as React from "react"
import { ValueSection } from "components/molecules/ValueSection"
import { ConfidenceIndicator } from "components/molecules/ConfidenceIndicator"
import { Text } from "components/atoms/Typography"
import { cn } from "app/lib/utils"

export interface MarketValuationProps {
  marketValueRange: string
  tradeInValue: string
  tradeInDescription?: string
  aiConfidence: number
  aiConfidenceDescription?: string
  disclaimer?: string
  className?: string
}

export function MarketValuation({ 
  marketValueRange,
  tradeInValue,
  tradeInDescription = "This value considers the vehicle's condition, market trends, and dealership profit margins.",
  aiConfidence,
  aiConfidenceDescription = "High confidence in the analysis",
  disclaimer = "Disclaimer: This is an AI-Assisted Estimate. Final trade-in value may vary based on a physical inspection and dealership policies.",
  className 
}: MarketValuationProps) {
  return (
    <div className={cn("", className)}>
      <ValueSection
        title="Market Valuation"
        description="Based on current market data and vehicle condition, the estimated market value is:"
        value={marketValueRange}
        valueSize="medium"
      />
      
      <ValueSection
        title="Suggested Trade-In Value"
        value={tradeInValue}
        valueSize="large"
      />
      
      <Text className="text-base font-normal leading-normal pb-3 pt-1 px-4">
        {tradeInDescription}
      </Text>
      
      <ValueSection
        title="AI Confidence"
      />
      
      <ConfidenceIndicator
        label="AI Confidence Level"
        value={aiConfidence}
        description={aiConfidenceDescription}
      />
      
      <Text className="text-[#617589] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
        {disclaimer}
      </Text>
    </div>
  )
}