const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

beforeAll(async () => {
  // Clean up test data before running tests
  await prisma.employee.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.department.deleteMany({})
  await prisma.role.deleteMany({})
})

afterAll(async () => {
  await prisma.$disconnect()
})

afterEach(async () => {
  // Clean up after each test
  await prisma.employee.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.department.deleteMany({})
  await prisma.role.deleteMany({})
})