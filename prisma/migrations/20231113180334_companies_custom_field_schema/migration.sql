-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "customFields" JSONB;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "companiesCustomFieldSchema" JSONB;
