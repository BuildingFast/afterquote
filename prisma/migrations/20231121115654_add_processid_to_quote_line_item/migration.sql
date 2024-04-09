-- AlterTable
ALTER TABLE "QuoteLineItem" ADD COLUMN     "processId" TEXT;

-- AddForeignKey
ALTER TABLE "QuoteLineItem" ADD CONSTRAINT "QuoteLineItem_processId_fkey" FOREIGN KEY ("processId") REFERENCES "ProcessesCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
