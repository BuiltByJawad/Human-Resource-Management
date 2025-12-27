/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,name]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,email]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,employeeNumber]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Department_name_key";

-- DropIndex
DROP INDEX "Employee_email_key";

-- DropIndex
DROP INDEX "Employee_employeeNumber_key";

-- AlterTable
ALTER TABLE "CompanyDocument" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "organizationId" TEXT;

-- CreateIndex
CREATE INDEX "CompanyDocument_organizationId_idx" ON "CompanyDocument"("organizationId");

-- CreateIndex
CREATE INDEX "Department_organizationId_idx" ON "Department"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_organizationId_name_key" ON "Department"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Employee_organizationId_idx" ON "Employee"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_organizationId_email_key" ON "Employee"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_organizationId_employeeNumber_key" ON "Employee"("organizationId", "employeeNumber");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
