/*
  Warnings:

  - You are about to drop the `CostingProcesses` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CostingProcesses" DROP CONSTRAINT "CostingProcesses_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "CostingProcesses" DROP CONSTRAINT "CostingProcesses_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "CostingProcesses" DROP CONSTRAINT "CostingProcesses_quoteLineItemId_fkey";

-- DropTable
DROP TABLE "CostingProcesses";

-- CreateTable
CREATE TABLE "CostingOperations" (
    "id" TEXT NOT NULL,
    "quoteLineItemId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "operationName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,
    "setUpTimeMinutes" INTEGER,
    "runTimeMinutes" INTEGER,
    "cost" INTEGER,

    CONSTRAINT "CostingOperations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineCatalog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" INTEGER,

    CONSTRAINT "MachineCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationsCatalog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" INTEGER,
    "toolingRate" INTEGER,

    CONSTRAINT "OperationsCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationsOnMachines" (
    "operationId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,

    CONSTRAINT "OperationsOnMachines_pkey" PRIMARY KEY ("operationId","machineId")
);

-- CreateTable
CREATE TABLE "MaterialCatalog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" INTEGER,
    "units" TEXT,

    CONSTRAINT "MaterialCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartsLibrary" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PartsLibrary_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CostingOperations" ADD CONSTRAINT "CostingOperations_quoteLineItemId_fkey" FOREIGN KEY ("quoteLineItemId") REFERENCES "QuoteLineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostingOperations" ADD CONSTRAINT "CostingOperations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostingOperations" ADD CONSTRAINT "CostingOperations_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineCatalog" ADD CONSTRAINT "MachineCatalog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationsCatalog" ADD CONSTRAINT "OperationsCatalog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationsOnMachines" ADD CONSTRAINT "OperationsOnMachines_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "OperationsCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationsOnMachines" ADD CONSTRAINT "OperationsOnMachines_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "MachineCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialCatalog" ADD CONSTRAINT "MaterialCatalog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
