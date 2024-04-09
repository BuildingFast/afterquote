/*
  Warnings:

  - You are about to alter the column `orderValue` on the `Rfq` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(12,4)`.
  - You are about to alter the column `orderValue` on the `SalesOrder` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(12,4)`.

*/
-- AlterTable
ALTER TABLE "Rfq" ALTER COLUMN "orderValue" SET DATA TYPE DECIMAL(12,4);

-- AlterTable
ALTER TABLE "SalesOrder" ALTER COLUMN "orderValue" SET DATA TYPE DECIMAL(12,4);
