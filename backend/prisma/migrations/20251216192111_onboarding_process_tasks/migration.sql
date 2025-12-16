/*
  Warnings:

  - You are about to drop the column `progress` on the `OnboardingProcess` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `OnboardingProcess` table. All the data in the column will be lost.
  - The `status` column on the `OnboardingProcess` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `assigneeRole` on the `OnboardingTask` table. All the data in the column will be lost.
  - You are about to drop the column `dueInDays` on the `OnboardingTask` table. All the data in the column will be lost.
  - You are about to drop the column `isRequired` on the `OnboardingTask` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `OnboardingTask` table. All the data in the column will be lost.
  - You are about to drop the `OnboardingTaskInstance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OnboardingTemplate` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `processId` to the `OnboardingTask` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `OnboardingTask` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('draft', 'active', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "OnboardingTaskStatus" AS ENUM ('todo', 'in_progress', 'blocked', 'done');

-- DropForeignKey
ALTER TABLE "OnboardingProcess" DROP CONSTRAINT "OnboardingProcess_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "OnboardingTask" DROP CONSTRAINT "OnboardingTask_templateId_fkey";

-- DropForeignKey
ALTER TABLE "OnboardingTaskInstance" DROP CONSTRAINT "OnboardingTaskInstance_processId_fkey";

-- AlterTable
ALTER TABLE "ComplianceLog" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "OnboardingProcess" DROP COLUMN "progress",
DROP COLUMN "templateId",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "OnboardingStatus" NOT NULL DEFAULT 'active',
ALTER COLUMN "startDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OnboardingTask" DROP COLUMN "assigneeRole",
DROP COLUMN "dueInDays",
DROP COLUMN "isRequired",
DROP COLUMN "templateId",
ADD COLUMN     "assigneeUserId" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "processId" TEXT NOT NULL,
ADD COLUMN     "status" "OnboardingTaskStatus" NOT NULL DEFAULT 'todo',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "order" DROP NOT NULL,
ALTER COLUMN "order" DROP DEFAULT;

-- DropTable
DROP TABLE "OnboardingTaskInstance";

-- DropTable
DROP TABLE "OnboardingTemplate";

-- CreateIndex
CREATE INDEX "OnboardingProcess_employeeId_idx" ON "OnboardingProcess"("employeeId");

-- CreateIndex
CREATE INDEX "OnboardingTask_processId_idx" ON "OnboardingTask"("processId");

-- CreateIndex
CREATE INDEX "OnboardingTask_assigneeUserId_idx" ON "OnboardingTask"("assigneeUserId");

-- AddForeignKey
ALTER TABLE "ComplianceLog" ADD CONSTRAINT "ComplianceLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingProcess" ADD CONSTRAINT "OnboardingProcess_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingTask" ADD CONSTRAINT "OnboardingTask_processId_fkey" FOREIGN KEY ("processId") REFERENCES "OnboardingProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingTask" ADD CONSTRAINT "OnboardingTask_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
