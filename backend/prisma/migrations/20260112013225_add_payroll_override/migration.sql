-- CreateTable
CREATE TABLE "PayrollOverride" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "payPeriod" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PayrollOverride_payPeriod_idx" ON "PayrollOverride"("payPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollOverride_employeeId_payPeriod_key" ON "PayrollOverride"("employeeId", "payPeriod");

-- AddForeignKey
ALTER TABLE "PayrollOverride" ADD CONSTRAINT "PayrollOverride_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
