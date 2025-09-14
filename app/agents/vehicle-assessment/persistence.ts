import { PrismaClient } from "../../generated/prisma/client";
import type { VehicleAssessmentPrismaShape } from './engine';

const prisma = new PrismaClient();

export async function saveAssessment(shape: VehicleAssessmentPrismaShape, vinSubmissionId?: string) {
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
      ...(vinSubmissionId
        ? { vinSubmission: { connect: { id: vinSubmissionId } } }
        : {}),
    },
  });

  return assessment;
}
