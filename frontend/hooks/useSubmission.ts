import { useQuery } from "@tanstack/react-query";
import { chain } from "services/graphql";

interface GetSubmissionInput {
  id: string;
}

const getSubmission = async (input: GetSubmissionInput) => {
  return (await chain("query")({
    getSubmission: [
      {
        id: input.id,
      },
      {
        id: true,
        vin: true,
        description: true,
        mileage: true,
        s3Paths: true,
        vehicleAssessment: {
          id: true,
          visualScore: true,
          maxScore: true,
          scoreDescription: true,
          marketValueRange: true,
          tradeInValue: true,
          tradeInDescription: true,
          aiConfidence: true,
          aiConfidenceDescription: true,
          vehicleDetails: {
            id: true,
            make: true,
            model: true,
            year: true,
            vin: true,
          },
          conditionIssues: {
            id: true,
            issueKey: true,
            title: true,
            description: true,
            icon: true,
          },
        },
      },
    ],
  })).getSubmission;
};

export const useSubmission = (id: string) => {
  return useQuery({
    queryKey: ["submission", id],
    queryFn: () => getSubmission({ id }),
    enabled: !!id,
    refetchInterval: 5000, // Poll every 5 seconds to check for updates
  });
};
