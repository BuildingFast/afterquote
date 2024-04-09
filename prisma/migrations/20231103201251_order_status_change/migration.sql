/*
  Warnings:

  - The `status` column on the `SalesOrder` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "OrderStatusEnum" AS ENUM ('BACKLOG', 'PROGRESS', 'HOLD', 'COMPLETED', 'SHIPPED', 'DELIVERED');

-- AlterTable
ALTER TABLE "SalesOrder" DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatusEnum" NOT NULL DEFAULT 'BACKLOG';

-- DropEnum
DROP TYPE "OrderStatus";
