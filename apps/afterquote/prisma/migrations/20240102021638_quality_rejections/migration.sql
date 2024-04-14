-- CreateTable
CREATE TABLE "QualityRejection" (
    "id" TEXT NOT NULL,
    "serialNumber" SERIAL NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "dateOfRejection" TIMESTAMP(3) NOT NULL,
    "actualWidth" DECIMAL(12,4) NOT NULL,
    "actualLength" DECIMAL(12,4) NOT NULL,
    "qualityDecision" TEXT NOT NULL,
    "qualityObservation" TEXT NOT NULL,
    "disposableMaterials" TEXT,
    "finalStatus" TEXT,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "submittedBy" TEXT,
    "shiftNumber" TEXT NOT NULL,

    CONSTRAINT "QualityRejection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QualityRejection" ADD CONSTRAINT "QualityRejection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityRejection" ADD CONSTRAINT "QualityRejection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
