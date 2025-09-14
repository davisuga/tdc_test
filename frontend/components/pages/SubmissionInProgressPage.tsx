// components/pages/SubmissionInProgressPage.tsx
import * as React from "react";
import { PageLayout } from "components/templates/PageLayout";
import { Title, Description } from "components/atoms/Typography";
import { Loader2 } from "lucide-react";
import { cn } from "app/lib/utils";

export interface SubmissionInProgressPageProps {
  submissionId: string;
  className?: string;
}

export function SubmissionInProgressPage({
  submissionId,
  className
}: SubmissionInProgressPageProps) {
  return (
    <div className={cn("px-40 flex flex-1 justify-center py-5", className)}>
      <div className="layout-content-container flex flex-col max-w-[960px] flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          
          <div className="flex flex-col gap-3">
            <Title>Analysis in Progress</Title>
            <Description>
              Your vehicle submission is being processed by our AI system. 
              This typically takes a few minutes.
            </Description>
            <Description className="text-sm text-gray-500">
              Submission ID: {submissionId}
            </Description>
          </div>

          <div className="mt-4 rounded-lg bg-blue-50 p-4">
            <Description className="text-blue-800">
              We're analyzing your vehicle photos and VIN data to provide you with 
              an accurate trade-in appraisal. You can refresh this page to check for updates.
            </Description>
          </div>
        </div>
      </div>
    </div>
  );
}
