-- CreateTable
CREATE TABLE "ProcessesCatalog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deleted" TIMESTAMP(3),

    CONSTRAINT "ProcessesCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessMachine" (
    "processId" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,

    CONSTRAINT "ProcessMachine_pkey" PRIMARY KEY ("processId","machineId")
);

-- CreateTable
CREATE TABLE "ProcessMaterial" (
    "processId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,

    CONSTRAINT "ProcessMaterial_pkey" PRIMARY KEY ("processId","materialId")
);

-- AddForeignKey
ALTER TABLE "ProcessesCatalog" ADD CONSTRAINT "ProcessesCatalog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessMachine" ADD CONSTRAINT "ProcessMachine_processId_fkey" FOREIGN KEY ("processId") REFERENCES "ProcessesCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessMachine" ADD CONSTRAINT "ProcessMachine_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "MachineCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessMaterial" ADD CONSTRAINT "ProcessMaterial_processId_fkey" FOREIGN KEY ("processId") REFERENCES "ProcessesCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessMaterial" ADD CONSTRAINT "ProcessMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "MaterialCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
