-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('employees', 'attendance', 'leave', 'payroll');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('csv', 'pdf');

-- CreateEnum
CREATE TYPE "ReportScheduleFrequency" AS ENUM ('daily', 'weekly', 'monthly');

-- CreateEnum
CREATE TYPE "ReportRunStatus" AS ENUM ('queued', 'running', 'success', 'failed');

-- CreateTable
CREATE TABLE "ScheduledReport" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "format" "ReportFormat" NOT NULL,
    "frequency" "ReportScheduleFrequency" NOT NULL,
    "filters" JSONB,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "nextRunAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledReportRecipient" (
    "id" TEXT NOT NULL,
    "scheduledReportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledReportRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledReportRun" (
    "id" TEXT NOT NULL,
    "scheduledReportId" TEXT NOT NULL,
    "status" "ReportRunStatus" NOT NULL DEFAULT 'queued',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledReportRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledReport_organizationId_idx" ON "ScheduledReport"("organizationId");

-- CreateIndex
CREATE INDEX "ScheduledReport_isEnabled_idx" ON "ScheduledReport"("isEnabled");

-- CreateIndex
CREATE INDEX "ScheduledReport_nextRunAt_idx" ON "ScheduledReport"("nextRunAt");

-- CreateIndex
CREATE INDEX "ScheduledReportRecipient_userId_idx" ON "ScheduledReportRecipient"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledReportRecipient_scheduledReportId_userId_key" ON "ScheduledReportRecipient"("scheduledReportId", "userId");

-- CreateIndex
CREATE INDEX "ScheduledReportRun_scheduledReportId_idx" ON "ScheduledReportRun"("scheduledReportId");

-- CreateIndex
CREATE INDEX "ScheduledReportRun_status_idx" ON "ScheduledReportRun"("status");

-- AddForeignKey
ALTER TABLE "ScheduledReport" ADD CONSTRAINT "ScheduledReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledReport" ADD CONSTRAINT "ScheduledReport_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledReportRecipient" ADD CONSTRAINT "ScheduledReportRecipient_scheduledReportId_fkey" FOREIGN KEY ("scheduledReportId") REFERENCES "ScheduledReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledReportRecipient" ADD CONSTRAINT "ScheduledReportRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledReportRun" ADD CONSTRAINT "ScheduledReportRun_scheduledReportId_fkey" FOREIGN KEY ("scheduledReportId") REFERENCES "ScheduledReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
