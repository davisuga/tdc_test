// components/organisms/ConditionAnalysis.tsx
import * as React from "react"
import { ConditionItem } from "components/molecules/ConditionItem"
import { ConfidenceIndicator } from "components/molecules/ConfidenceIndicator"
import { Subtitle } from "components/atoms/Typography"
import { cn } from "app/lib/utils"

export interface ConditionIssue {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

export interface ConditionAnalysisProps {
  visualScore: number
  maxScore?: number
  scoreDescription?: string
  issues: ConditionIssue[]
  className?: string
}

export function ConditionAnalysis({ 
  visualScore, 
  maxScore = 10, 
  scoreDescription = "Excellent condition with minor wear",
  issues,
  className 
}: ConditionAnalysisProps) {
  return (
    <div className={cn("", className)}>
      <Subtitle className="px-4 pb-3 pt-5">Condition Analysis</Subtitle>
      <ConfidenceIndicator
        label="Visual Condition Score"
        value={visualScore}
        max={maxScore}
        description={scoreDescription}
      />
      <div className="flex flex-col">
        {issues.map((issue) => (
          <ConditionItem
            key={issue.id}
            title={issue.title}
            description={issue.description}
            icon={issue.icon}
          />
        ))}
      </div>
    </div>
  )
}