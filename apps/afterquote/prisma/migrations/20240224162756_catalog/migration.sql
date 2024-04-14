-- AlterTable
ALTER TABLE "Rfq" ADD COLUMN     "productsCatalogId" TEXT;

-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "productsCatalogId" TEXT;

-- CreateTable
CREATE TABLE "ProductsCatalog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "pricingRules" JSONB,
    "units" TEXT NOT NULL,
    "unitCost" INTEGER,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rfqIds" TEXT[],
    "salesOrderIds" TEXT[],

    CONSTRAINT "ProductsCatalog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_productsCatalogId_fkey" FOREIGN KEY ("productsCatalogId") REFERENCES "ProductsCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_productsCatalogId_fkey" FOREIGN KEY ("productsCatalogId") REFERENCES "ProductsCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductsCatalog" ADD CONSTRAINT "ProductsCatalog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductsCatalog" ADD CONSTRAINT "ProductsCatalog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
