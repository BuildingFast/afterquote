-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('SalesTax', 'GST', 'VAT', 'Custom');

-- CreateTable
CREATE TABLE "Taxes" (
    "id" TEXT NOT NULL,
    "type" "TaxType" NOT NULL DEFAULT 'SalesTax',
    "region" TEXT NOT NULL,
    "description" TEXT,
    "rate" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Taxes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Taxes" ADD CONSTRAINT "Taxes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Taxes" ADD CONSTRAINT "Taxes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
