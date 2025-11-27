/*
  Warnings:

  - The values [onboarding] on the enum `EmployeeStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [error] on the enum `PayrollStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdAt` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `filePath` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `fileType` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `Document` table. All the data in the column will be lost.
  - The `status` column on the `LeaveRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `goals` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `reviewPeriod` on the `PerformanceReview` table. All the data in the column will be lost.
  - Added the required column `fileUrl` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cycleId` to the `PerformanceReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `PerformanceReview` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('single', 'married', 'divorced', 'widowed');

-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterEnum
BEGIN;
CREATE TYPE "EmployeeStatus_new" AS ENUM ('active', 'inactive', 'terminated');
ALTER TABLE "Employee" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Employee" ALTER COLUMN "status" TYPE "EmployeeStatus_new" USING ("status"::text::"EmployeeStatus_new");
ALTER TYPE "EmployeeStatus" RENAME TO "EmployeeStatus_old";
ALTER TYPE "EmployeeStatus_new" RENAME TO "EmployeeStatus";
DROP TYPE "EmployeeStatus_old";
ALTER TABLE "Employee" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PayrollStatus_new" AS ENUM ('draft', 'processed', 'paid');
ALTER TABLE "PayrollRecord" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "PayrollRecord" ALTER COLUMN "status" TYPE "PayrollStatus_new" USING ("status"::text::"PayrollStatus_new");
ALTER TYPE "PayrollStatus" RENAME TO "PayrollStatus_old";
ALTER TYPE "PayrollStatus_new" RENAME TO "PayrollStatus";
DROP TYPE "PayrollStatus_old";
ALTER TABLE "PayrollRecord" ALTER COLUMN "status" SET DEFAULT 'processed';
COMMIT;

-- DropIndex
DROP INDEX "Document_fileName_idx";

-- DropIndex
DROP INDEX "Employee_status_idx";

-- DropIndex
DROP INDEX "PayrollRecord_employeeId_idx";

-- DropIndex
DROP INDEX "PayrollRecord_status_idx";

-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "companyAddress" TEXT NOT NULL DEFAULT '123 Business Road, Tech City',
ADD COLUMN     "faviconUrl" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "siteName" TEXT NOT NULL DEFAULT 'NovaHR',
ADD COLUMN     "tagline" TEXT NOT NULL DEFAULT 'Workspace';

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "createdAt",
DROP COLUMN "fileName",
DROP COLUMN "filePath",
DROP COLUMN "fileType",
DROP COLUMN "metadata",
DROP COLUMN "updatedAt",
DROP COLUMN "version",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "fileUrl" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "address" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "emergencyContact" JSONB,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "maritalStatus" "MaritalStatus",
ADD COLUMN     "phoneNumber" TEXT;

-- AlterTable
ALTER TABLE "LeaveRequest" DROP COLUMN "status",
ADD COLUMN     "status" "LeaveRequestStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "PayrollRecord" ALTER COLUMN "status" SET DEFAULT 'processed';

-- AlterTable
ALTER TABLE "PerformanceReview" DROP COLUMN "goals",
DROP COLUMN "reviewPeriod",
ADD COLUMN     "cycleId" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;

-- DropEnum
DROP TYPE "LeaveStatus";

-- CreateTable
CREATE TABLE "UserInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewCycle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewCycle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserInvite_tokenHash_key" ON "UserInvite"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "Employee_userId_idx" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");

-- CreateIndex
CREATE INDEX "PerformanceReview_cycleId_idx" ON "PerformanceReview"("cycleId");

-- AddForeignKey
ALTER TABLE "UserInvite" ADD CONSTRAINT "UserInvite_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ReviewCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
