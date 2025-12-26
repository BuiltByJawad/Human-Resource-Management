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

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

beforeAll(async () => {
  // Clean up test data before running tests
  await prisma.auditLog.deleteMany({})
  await prisma.employee.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.department.deleteMany({})
  await prisma.role.deleteMany({})

  // Seed required roles for auth flows
  await prisma.role.upsert({
    where: { name: 'Employee' },
    update: {},
    create: { name: 'Employee', description: 'Default employee role' },
  })
  await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin', description: 'Administrator role' },
  })
})

afterEach(async () => {
  // Clean up after each test (keep roles intact for subsequent tests)
  await prisma.auditLog.deleteMany({})
  await prisma.employee.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.department.deleteMany({})
})