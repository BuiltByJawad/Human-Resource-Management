/*
  Warnings:

  - A unique constraint covering the columns `[organizationId]` on the table `CompanySettings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "organizationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CompanySettings_organizationId_key" ON "CompanySettings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySettings" ADD CONSTRAINT "CompanySettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
