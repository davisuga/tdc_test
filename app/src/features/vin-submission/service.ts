import { prisma } from "../../lib/prisma";
import { runAssessmentForSubmission } from "../vehicle-assessment/assessment.service";
import type { VinSubmission } from "../../../generated/prisma/client";
import { s3Client } from "../../lib/s3";

interface CreateSubmissionArgs {
  vin: string;
  description?: string | null;
  mileage?: number | null;
  s3Paths: string[];
}

export async function create(
  args: CreateSubmissionArgs,
): Promise<VinSubmission> {
  const { vin, description, mileage, s3Paths } = args;

  if (!vin || vin.trim().length === 0) {
    throw new Error("VIN is required");
  }

  const submission = await prisma.vinSubmission.create({
    data: {
      vin: vin.trim(),
      description: description?.trim() || null,
      mileage: mileage || null,
      s3Paths,
    },
  });

  // Run assessment asynchronously, but the call site is clean
  runAssessmentForSubmission(submission).catch((error) => {
    console.error(
      `Background assessment failed for submission ${submission.id}:`,
      error,
    );
  });

  return submission;
}

export async function getById(
  id: string,
): Promise<VinSubmission | null> {
  return prisma.vinSubmission.findUnique({ where: { id } });
}
export function generatePresignedUrls(filenames: string[]) {
  if (!Array.isArray(filenames) ||
    filenames.length < 1 ||
    filenames.length > 10) {
    throw new Error("filenames must be an array of 1-10 items");
  }
  const urls: string[] = filenames.map((filename) => {
    const randomPath = `uploads/${crypto.randomUUID()}/${filename}`;
    console.log("Generating presigned URL for", randomPath);
    return s3Client.presign(randomPath, {
      method: "PUT",
      expiresIn: 3600, // 1 hour
    });
  });
  return urls.map((url) => ({ url }));
}
