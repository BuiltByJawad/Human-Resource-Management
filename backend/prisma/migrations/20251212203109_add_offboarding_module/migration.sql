-- CreateTable
CREATE TABLE "OffboardingProcess" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "exitDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OffboardingProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OffboardingTask" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assigneeRole" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,

    CONSTRAINT "OffboardingTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OffboardingProcess_employeeId_key" ON "OffboardingProcess"("employeeId");

-- AddForeignKey
ALTER TABLE "OffboardingProcess" ADD CONSTRAINT "OffboardingProcess_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffboardingTask" ADD CONSTRAINT "OffboardingTask_processId_fkey" FOREIGN KEY ("processId") REFERENCES "OffboardingProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
