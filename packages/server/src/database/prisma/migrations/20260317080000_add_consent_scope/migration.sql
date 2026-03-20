-- AlterTable
ALTER TABLE "Consent" ADD COLUMN "consentRequestId" TEXT NOT NULL;
ALTER TABLE "Consent" ADD COLUMN "resultStartAt" TIMESTAMP(3);
ALTER TABLE "Consent" ADD COLUMN "resultEndAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Consent_consentRequestId_key" ON "Consent"("consentRequestId");

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_consentRequestId_fkey" FOREIGN KEY ("consentRequestId") REFERENCES "ConsentRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
