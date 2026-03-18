-- Add patient personalization fields for Vitamin D dosing.
ALTER TABLE "Patient"
ADD COLUMN IF NOT EXISTS "weightKg" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "targetVitaminDNgMl" DOUBLE PRECISION;

