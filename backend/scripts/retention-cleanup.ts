import path from 'path'
import dotenv from 'dotenv'
import { Prisma, PrismaClient } from '@prisma/client'

const ENV_PATH = path.resolve(__dirname, '../.env')

dotenv.config({ path: ENV_PATH })

const prisma = new PrismaClient()

const yearsAgo = (years: number): Date => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - years)
  return date
}

const buildRedactedEmail = (employeeId: string) => `redacted+${employeeId}@example.invalid`
const buildRedactedEmployeeNumber = (employeeId: string) => `redacted-${employeeId}`

const anonymizeEmployee = async (employeeId: string) => {
  const redactedEmail = buildRedactedEmail(employeeId)
  const redactedEmployeeNumber = buildRedactedEmployeeNumber(employeeId)

  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      firstName: 'Redacted',
      lastName: 'Employee',
      email: redactedEmail,
      phoneNumber: null,
      address: null,
      dateOfBirth: null,
      gender: null,
      maritalStatus: null,
      emergencyContact: Prisma.JsonNull,
      employeeNumber: redactedEmployeeNumber,
      salary: 0,
      status: 'inactive',
      userId: null,
    },
  })
}

const cleanupRetentionData = async () => {
  const auditLogCutoff = yearsAgo(5)
  const attendanceCutoff = yearsAgo(3)
  const payrollCutoff = yearsAgo(7)
  const employeeCutoff = yearsAgo(7)

  const deletedAuditLogs = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: auditLogCutoff } },
  })

  const deletedAttendance = await prisma.attendance.deleteMany({
    where: { checkIn: { lt: attendanceCutoff } },
  })

  const deletedPayroll = await prisma.payrollRecord.deleteMany({
    where: { createdAt: { lt: payrollCutoff } },
  })

  const deletedPayrollOverrides = await prisma.payrollOverride.deleteMany({
    where: { createdAt: { lt: payrollCutoff } },
  })

  const offboardingProcesses = await prisma.offboardingProcess.findMany({
    where: { exitDate: { lt: employeeCutoff } },
    select: { id: true, employeeId: true },
  })

  for (const process of offboardingProcesses) {
    await anonymizeEmployee(process.employeeId)
  }

  const deletedOffboardingTasks = await prisma.offboardingTask.deleteMany({
    where: { processId: { in: offboardingProcesses.map((process) => process.id) } },
  })

  const deletedOffboardingProcesses = await prisma.offboardingProcess.deleteMany({
    where: { id: { in: offboardingProcesses.map((process) => process.id) } },
  })

  return {
    deletedAuditLogs: deletedAuditLogs.count,
    deletedAttendance: deletedAttendance.count,
    deletedPayroll: deletedPayroll.count,
    deletedPayrollOverrides: deletedPayrollOverrides.count,
    anonymizedEmployees: offboardingProcesses.length,
    deletedOffboardingTasks: deletedOffboardingTasks.count,
    deletedOffboardingProcesses: deletedOffboardingProcesses.count,
  }
}

const run = async () => {
  try {
    const result = await cleanupRetentionData()
    console.log('Retention cleanup completed', result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Retention cleanup failed', message)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

run()
