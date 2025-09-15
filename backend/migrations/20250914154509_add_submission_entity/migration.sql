-- CreateTable
CREATE TABLE "public"."VinSubmission" (
    "id" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "description" TEXT,
    "mileage" INTEGER,
    "s3Paths" TEXT[],
    "vehicleAssessmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VinSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VinSubmission_vehicleAssessmentId_key" ON "public"."VinSubmission"("vehicleAssessmentId");

-- AddForeignKey
ALTER TABLE "public"."VinSubmission" ADD CONSTRAINT "VinSubmission_vehicleAssessmentId_fkey" FOREIGN KEY ("vehicleAssessmentId") REFERENCES "public"."VehicleAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
