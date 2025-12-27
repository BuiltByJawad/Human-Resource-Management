/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,serialNumber]` on the table `Asset` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,name]` on the table `ComplianceRule` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Asset_serialNumber_key";

-- DropIndex
DROP INDEX "ComplianceRule_name_key";

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "ComplianceRule" ADD COLUMN     "organizationId" TEXT;

-- CreateIndex
CREATE INDEX "Asset_organizationId_idx" ON "Asset"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_organizationId_serialNumber_key" ON "Asset"("organizationId", "serialNumber");

-- CreateIndex
CREATE INDEX "ComplianceRule_organizationId_idx" ON "ComplianceRule"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceRule_organizationId_name_key" ON "ComplianceRule"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "ComplianceRule" ADD CONSTRAINT "ComplianceRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
