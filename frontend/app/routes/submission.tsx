import type { Route } from "./+types/submission";
import { useParams } from "react-router";
import { useSubmission } from "hooks/useSubmission";
import { TradeInAppraisalPage } from "components/pages/TradeInAppraisalPage";
import { SubmissionInProgressPage } from "components/pages/SubmissionInProgressPage";
import { getIconFromString } from "utils/iconUtils";
import { Loader2 } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Submission Details" },
    { name: "description", content: "Details about the vehicle submission." },
  ];
}

export default function Submission({ loaderData }: Route.ComponentProps) {
  const { id } = useParams<{ id: string }>();
  const { data: submission, isLoading, error } = useSubmission(id || "");

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-gray-600">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p className="text-gray-600">
            {error ? "Failed to load submission" : "Submission not found"}
          </p>
        </div>
      </div>
    );
  }

  // If there's a vehicle assessment, show the TradeInAppraisalPage
  if (submission.vehicleAssessment) {
    const assessment = submission.vehicleAssessment;
    const vehicleDetails = assessment.vehicleDetails;
    
    return (
      <TradeInAppraisalPage
        vehicleDetails={{
          make: vehicleDetails.make || "Unknown",
          model: vehicleDetails.model || "Unknown", 
          year: vehicleDetails.year?.toString() || "Unknown",
          mileage: "Unknown", // Not available in current schema
          vin: vehicleDetails.vin || submission.vin,
        }}
        visualScore={assessment.visualScore}
        maxScore={assessment.maxScore}
        scoreDescription={assessment.scoreDescription}
        conditionIssues={assessment.conditionIssues?.map(issue => ({
          id: issue.id,
          title: issue.title,
          description: issue.description,
          icon: getIconFromString(issue.icon),
        })) || []}
        marketValueRange={assessment.marketValueRange}
        tradeInValue={assessment.tradeInValue}
        tradeInDescription={assessment.tradeInDescription}
        aiConfidence={assessment.aiConfidence}
        aiConfidenceDescription={assessment.aiConfidenceDescription}
      />
    );
  }

  // If no vehicle assessment, show in progress page
  return <SubmissionInProgressPage submissionId={submission.id} />;
}
