-- CreateTable
CREATE TABLE "public"."VehicleAssessment" (
    "id" TEXT NOT NULL,
    "vehicleDetailsId" TEXT NOT NULL,
    "visualScore" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "scoreDescription" TEXT NOT NULL,
    "marketValueRange" TEXT NOT NULL,
    "tradeInValue" TEXT NOT NULL,
    "tradeInDescription" TEXT NOT NULL,
    "aiConfidence" INTEGER NOT NULL,
    "aiConfidenceDescription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VehicleDetails" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" TEXT NOT NULL,
    "vin" TEXT NOT NULL,

    CONSTRAINT "VehicleDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConditionIssue" (
    "id" TEXT NOT NULL,
    "issueKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "vehicleAssessmentId" TEXT NOT NULL,

    CONSTRAINT "ConditionIssue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."VehicleAssessment" ADD CONSTRAINT "VehicleAssessment_vehicleDetailsId_fkey" FOREIGN KEY ("vehicleDetailsId") REFERENCES "public"."VehicleDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConditionIssue" ADD CONSTRAINT "ConditionIssue_vehicleAssessmentId_fkey" FOREIGN KEY ("vehicleAssessmentId") REFERENCES "public"."VehicleAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
