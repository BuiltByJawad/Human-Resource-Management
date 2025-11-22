/*
  Warnings:

  - A unique constraint covering the columns `[employeeId,payPeriod]` on the table `PayrollRecord` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `PayrollRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PayrollRecord" ADD COLUMN     "allowancesBreakdown" JSONB,
ADD COLUMN     "attendanceSummary" JSONB,
ADD COLUMN     "deductionsBreakdown" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRecord_employeeId_payPeriod_key" ON "PayrollRecord"("employeeId", "payPeriod");
