/*
  Warnings:

  - You are about to drop the column `customFieldSchema` on the `Organization` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "customFieldSchema",
ADD COLUMN     "orderCustomFieldSchema" JSONB,
ADD COLUMN     "rfqCustomFieldSchema" JSONB;
