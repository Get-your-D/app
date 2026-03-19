-- Add numeric Vitamin D value + units on TestResult
DO $$ BEGIN
  CREATE TYPE "VitaminDUnit" AS ENUM ('NG_ML', 'NMOL_L');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "TestResult"
ADD COLUMN IF NOT EXISTS "valueNumber" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "unit" "VitaminDUnit";

-- Recommendation snapshot linked to a specific TestResult
CREATE TABLE IF NOT EXISTS "VitaminDRecommendation" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "testResultId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "weightKg" DOUBLE PRECISION NOT NULL,
  "currentVitaminDNgMl" DOUBLE PRECISION NOT NULL,
  "targetVitaminDNgMl" DOUBLE PRECISION NOT NULL,
  "recommendedIuPerDay" INTEGER NOT NULL,
  "phases" JSONB NOT NULL,
  "context" TEXT NOT NULL,
  "disclaimer" TEXT NOT NULL,
  "algorithmVersion" TEXT NOT NULL,
  CONSTRAINT "VitaminDRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VitaminDRecommendation_testResultId_key" ON "VitaminDRecommendation"("testResultId");

ALTER TABLE "VitaminDRecommendation"
  ADD CONSTRAINT "VitaminDRecommendation_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VitaminDRecommendation"
  ADD CONSTRAINT "VitaminDRecommendation_testResultId_fkey"
  FOREIGN KEY ("testResultId") REFERENCES "TestResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

