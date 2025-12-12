-- CreateTable
CREATE TABLE "OnboardingTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" TEXT,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingTask" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeRole" TEXT,
    "dueInDays" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OnboardingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingProcess" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "templateId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startDate" TIMESTAMP(3) NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingTaskInstance" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assigneeID" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,

    CONSTRAINT "OnboardingTaskInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProcess_employeeId_key" ON "OnboardingProcess"("employeeId");

-- AddForeignKey
ALTER TABLE "OnboardingTask" ADD CONSTRAINT "OnboardingTask_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "OnboardingTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingProcess" ADD CONSTRAINT "OnboardingProcess_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingTaskInstance" ADD CONSTRAINT "OnboardingTaskInstance_processId_fkey" FOREIGN KEY ("processId") REFERENCES "OnboardingProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
