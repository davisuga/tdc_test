import { prisma } from "../../lib/prisma";
import { s3Client } from "../../lib/s3";
import { assessVehicle, type AssessInput, type VehicleAssessmentPrismaShape } from "./assessment.engine";
import { fetchVehicleInfo } from "../../services/nhtsa";
import { fetchMarketData } from "../../services/marketcheck";
import type { VinSubmission } from "../../../generated/prisma/client";

/**
 * Saves a vehicle assessment to the database.
 * This function was previously in `persistence.ts`.
 */
async function saveAssessment(shape: VehicleAssessmentPrismaShape, vinSubmissionId: string) {
  const details = await prisma.vehicleDetails.create({
    data: {
      make: shape.vehicleDetails.make,
      model: shape.vehicleDetails.model,
      year: shape.vehicleDetails.year,
      mileage: shape.vehicleDetails.mileage,
      vin: shape.vehicleDetails.vin,
    },
  });

  const assessment = await prisma.vehicleAssessment.create({
    data: {
      vehicleDetailsId: details.id,
      visualScore: shape.visualScore,
      maxScore: shape.maxScore,
      scoreDescription: shape.scoreDescription,
      marketValueRange: shape.marketValueRange,
      tradeInValue: shape.tradeInValue,
      tradeInDescription: shape.tradeInDescription,
      aiConfidence: shape.aiConfidence,
      aiConfidenceDescription: shape.aiConfidenceDescription,
      conditionIssues: {
        create: shape.conditionIssues.map(ci => ({
          issueKey: ci.issueKey,
          title: ci.title,
          description: ci.description,
          icon: ci.icon,
        })),
      },
      vinSubmission: { connect: { id: vinSubmissionId } },
    },
  });

  return assessment;
}

/**
 * Runs the full vehicle assessment process for a given VIN submission.
 * This orchestrates fetching data, running the AI engine, and saving the result.
 * The logic is consolidated from the former `background-assessment.ts`.
 */
export async function runAssessmentForSubmission(submission: VinSubmission) {
  const { id: submissionId, vin, mileage, description, s3Paths } = submission;

  try {
    console.log(`Starting assessment for submission ${submissionId}`);

    const photosWithData: { data: string; mediaType: string }[] = [];
    for (const s3Path of s3Paths) {
      try {
        console.log(`Fetching image from S3: ${s3Path}`);
        const imageBuffer = await s3Client.file(s3Path).arrayBuffer();
        const base64Data = Buffer.from(imageBuffer).toString("base64");

        const extension = s3Path.split(".").pop()?.toLowerCase();
        const mediaType =
          extension === "png"
            ? "image/png"
            : extension === "webp"
            ? "image/webp"
            : extension === "gif"
            ? "image/gif"
            : "image/jpeg";

        photosWithData.push({
          data: base64Data,
          mediaType,
        });
      } catch (error) {
        console.error(`Failed to fetch or process image ${s3Path}:`, error);
      }
    }

    if (photosWithData.length === 0) {
      // In a real app, we might want to update the submission status to "failed"
      throw new Error("No images could be fetched or processed from S3");
    }

    const nhtsaData = await fetchVehicleInfo(vin).catch(err => {
      console.warn(`NHTSA data fetch failed for VIN ${vin}:`, err);
      return null;
    });

    let marketData = null;
    if (nhtsaData?.Results?.[0]) {
      const vehicleInfo = nhtsaData.Results[0];
      marketData = await fetchMarketData({
        year: Number(vehicleInfo.ModelYear),
        make: vehicleInfo.Make,
        model: vehicleInfo.Model,
        mileage: mileage ?? 0,
      }).catch(err => {
        console.warn(`Market data fetch failed:`, err);
        return null;
      });
    }
    if (!marketData || !nhtsaData) {
      throw new Error("Insufficient data to run assessment");
    }

    const assessInput: AssessInput = {
      vin,
      mileage: mileage ?? 0,
      description: description ?? "",
      photos: photosWithData,
      nhtsa: nhtsaData,
      market: marketData,
    };

    console.log(`Running AI assessment with ${photosWithData.length} photos`);
    const assessmentResult = await assessVehicle(assessInput);

    console.log(`Saving assessment to database`);
    const savedAssessment = await saveAssessment(assessmentResult, submissionId);

    console.log(`Assessment completed for submission ${submissionId}`);
    return savedAssessment;

  } catch (error) {
    console.error(`Assessment failed for submission ${submissionId}:`, error);
    // Here you might add more robust error handling, like updating the
    // submission status in the database to reflect the failure.
    throw error;
  }
}
