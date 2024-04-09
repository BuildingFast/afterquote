-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "customFields" JSONB;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "contactsCustomFieldSchema" JSONB;
