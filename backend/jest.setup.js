const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')

if (process.env.DOTENV_CONFIG_PATH) {
  dotenv.config({ path: process.env.DOTENV_CONFIG_PATH })
} else {
  const testEnvPath = path.resolve(__dirname, '.env.test')
  if (fs.existsSync(testEnvPath)) {
    dotenv.config({ path: testEnvPath })
  } else {
    dotenv.config()
  }
}

const { prisma, redis } = require('./src/shared/config/database')

const clearTestData = async () => {
  await prisma.shiftSwapRequest.deleteMany({})
  await prisma.shift.deleteMany({})
  await prisma.timeEntry.deleteMany({})
  await prisma.expenseClaim.deleteMany({})
  await prisma.employeeTraining.deleteMany({})
  await prisma.keyResult.deleteMany({})
  await prisma.performanceGoal.deleteMany({})
  await prisma.performanceReview.deleteMany({})
  await prisma.employeeBenefit.deleteMany({})
  await prisma.benefitPlan.deleteMany({})
  await prisma.emergencyContact.deleteMany({})
  await prisma.employeeDocument.deleteMany({})
  await prisma.assetAssignment.deleteMany({})
  await prisma.maintenanceLog.deleteMany({})
  await prisma.asset.deleteMany({})
  await prisma.complianceLog.deleteMany({})
  await prisma.document.deleteMany({})
  await prisma.leaveRequest.deleteMany({})
  await prisma.attendance.deleteMany({})
  await prisma.onboardingTask.deleteMany({})
  await prisma.onboardingProcess.deleteMany({})
  await prisma.offboardingTask.deleteMany({})
  await prisma.offboardingProcess.deleteMany({})
  await prisma.payrollOverride.deleteMany({})
  await prisma.payrollRecord.deleteMany({})
  await prisma.auditLog.deleteMany({})
  await prisma.employee.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.department.deleteMany({})
}

beforeAll(async () => {
  // Clean up test data before running tests
  await clearTestData()

  // Seed required roles for auth flows
  await prisma.role.createMany({
    data: [
      { name: 'Employee', description: 'Default employee role' },
      { name: 'Admin', description: 'Administrator role' },
    ],
    skipDuplicates: true,
  })
})

afterEach(async () => {
  // Clean up after each test (keep roles intact for subsequent tests)
  await clearTestData()
})

afterAll(async () => {
  await prisma.$disconnect()
  try {
    await redis.disconnect()
  } catch {
    // ignore
  }
})