/*
  Warnings:

  - You are about to drop the column `status` on the `SalesOrder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "orderStatusOptions" TEXT[] DEFAULT ARRAY['Backlog', 'In progress', 'Shipped', 'Delivered', 'Completed', 'Hold']::TEXT[];

-- AlterTable
ALTER TABLE "SalesOrder" DROP COLUMN "status",
ADD COLUMN     "orderStatus" TEXT;

-- DropEnum
DROP TYPE "OrderStatusEnum";
