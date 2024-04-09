/*
  Warnings:

  - You are about to drop the column `cost` on the `CostingOperations` table. All the data in the column will be lost.
  - You are about to alter the column `setUpTimeMinutes` on the `CostingOperations` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(12,4)`.
  - You are about to alter the column `runTimeMinutes` on the `CostingOperations` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(12,4)`.
  - You are about to drop the column `totalCost` on the `CostingRawMaterial` table. All the data in the column will be lost.
  - You are about to drop the column `volume` on the `CostingRawMaterial` table. All the data in the column will be lost.
  - You are about to drop the column `volumeUnits` on the `CostingRawMaterial` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `CostingRawMaterial` table. All the data in the column will be lost.
  - You are about to drop the column `weightUnits` on the `CostingRawMaterial` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CostingOperations" DROP COLUMN "cost",
ADD COLUMN     "rate" DECIMAL(12,4),
ALTER COLUMN "setUpTimeMinutes" SET DATA TYPE DECIMAL(12,4),
ALTER COLUMN "runTimeMinutes" SET DATA TYPE DECIMAL(12,4);

-- AlterTable
ALTER TABLE "CostingRawMaterial" DROP COLUMN "totalCost",
DROP COLUMN "volume",
DROP COLUMN "volumeUnits",
DROP COLUMN "weight",
DROP COLUMN "weightUnits",
ADD COLUMN     "costingJson" JSONB;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "materialCostingFields" JSONB,
ADD COLUMN     "materialCostingFormula" JSONB;

-- CreateTable
CREATE TABLE "CostingTooling" (
    "id" TEXT NOT NULL,
    "quoteLineItemId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,
    "setUpTimeMinutes" DECIMAL(12,4),
    "runTimeMinutes" DECIMAL(12,4),
    "rate" DECIMAL(12,4),
    "toolingLength" DECIMAL(12,4),
    "toolingWidth" DECIMAL(12,4),
    "toolingHeight" DECIMAL(12,4),
    "toolingWeight" DECIMAL(12,4),
    "toolingFactor" DECIMAL(12,4) DEFAULT 1.0,

    CONSTRAINT "CostingTooling_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CostingTooling" ADD CONSTRAINT "CostingTooling_quoteLineItemId_fkey" FOREIGN KEY ("quoteLineItemId") REFERENCES "QuoteLineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostingTooling" ADD CONSTRAINT "CostingTooling_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostingTooling" ADD CONSTRAINT "CostingTooling_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
