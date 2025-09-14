import { useMutation } from "@tanstack/react-query";
import { chain } from "services/graphql";

interface CreateVinSubmissionInput {
  vin: string;
  description?: string;
  mileage?: number;
  s3Paths: string[];
}

const createVinSubmission = async (input: CreateVinSubmissionInput) => {
  return chain("mutation")({
    createVinSubmission: [
      {
        vin: input.vin,
        description: input.description,
        mileage: input.mileage,
        s3Paths: input.s3Paths,
      },
      {
        id: true,
        vin: true,
        description: true,
        mileage: true,
        s3Paths: true,
        createdAt: true,
        updatedAt: true,
      },
    ],
  });
};

export const useCreateVinSubmission = () => {
  return useMutation({
    mutationFn: createVinSubmission,
  });
};