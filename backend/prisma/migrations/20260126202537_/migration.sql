/*
  Warnings:

  - You are about to drop the column `description` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `CompanyDocument` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `CompanySettings` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `ComplianceRule` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `ReviewCycle` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `ScheduledReport` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Organization` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[serialNumber]` on the table `Asset` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `ComplianceRule` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employeeNumber]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `Asset` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Asset" DROP CONSTRAINT "Asset_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "CompanyDocument" DROP CONSTRAINT "CompanyDocument_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "CompanySettings" DROP CONSTRAINT "CompanySettings_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ComplianceRule" DROP CONSTRAINT "ComplianceRule_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "PerformanceReview" DROP CONSTRAINT "PerformanceReview_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ReviewCycle" DROP CONSTRAINT "ReviewCycle_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduledReport" DROP CONSTRAINT "ScheduledReport_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_organizationId_fkey";

-- DropIndex
DROP INDEX "Asset_organizationId_idx";

-- DropIndex
DROP INDEX "Asset_organizationId_serialNumber_key";

-- DropIndex
DROP INDEX "CompanyDocument_organizationId_idx";

-- DropIndex
DROP INDEX "CompanySettings_organizationId_key";

-- DropIndex
DROP INDEX "ComplianceRule_organizationId_idx";

-- DropIndex
DROP INDEX "ComplianceRule_organizationId_name_key";

-- DropIndex
DROP INDEX "Department_organizationId_idx";

-- DropIndex
DROP INDEX "Department_organizationId_name_key";

-- DropIndex
DROP INDEX "Employee_organizationId_email_key";

-- DropIndex
DROP INDEX "Employee_organizationId_employeeNumber_key";

-- DropIndex
DROP INDEX "Employee_organizationId_idx";

-- DropIndex
DROP INDEX "PerformanceReview_organizationId_idx";

-- DropIndex
DROP INDEX "ReviewCycle_organizationId_idx";

-- DropIndex
DROP INDEX "ScheduledReport_organizationId_idx";

-- DropIndex
DROP INDEX "User_organizationId_idx";

-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "description",
DROP COLUMN "organizationId",
DROP COLUMN "type",
ADD COLUMN     "category" TEXT NOT NULL,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "purchaseDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CompanyDocument" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "CompanySettings" DROP COLUMN "organizationId",
ADD COLUMN     "leavePolicy" JSONB,
ADD COLUMN     "payrollConfig" JSONB;

-- AlterTable
ALTER TABLE "ComplianceRule" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "PerformanceReview" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "ReviewCycle" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "ScheduledReport" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "organizationId";

-- DropTable
DROP TABLE "Organization";

-- CreateIndex
CREATE UNIQUE INDEX "Asset_serialNumber_key" ON "Asset"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceRule_name_key" ON "ComplianceRule"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeNumber_key" ON "Employee"("employeeNumber");
