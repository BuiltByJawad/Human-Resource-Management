import { config } from 'dotenv'
import { prisma } from '../src/config/database'

config({ path: '.env.test' })

beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  await prisma.$disconnect()
})

beforeEach(async () => {
  await prisma.$transaction([
    prisma.attendance.deleteMany(),
    prisma.leaveRequest.deleteMany(),
    prisma.payrollRecord.deleteMany(),
    prisma.performanceReview.deleteMany(),
    prisma.document.deleteMany(),
    prisma.employee.deleteMany(),
    prisma.department.deleteMany(),
    prisma.role.deleteMany(),
    prisma.user.deleteMany(),
  ])
})

export {}