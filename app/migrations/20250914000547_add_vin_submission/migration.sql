-- CreateTable
CREATE TABLE "public"."VinSubmission" (
    "id" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "description" TEXT,
    "s3Paths" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VinSubmission_pkey" PRIMARY KEY ("id")
);