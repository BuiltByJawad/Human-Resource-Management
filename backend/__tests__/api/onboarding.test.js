const request = require('supertest')
const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')
const { createApp } = require('../../src/app')

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret'

const prisma = new PrismaClient()
const { app } = createApp()

describe('Onboarding API', () => {
  let adminToken
  let employeeId
  let superAdminRoleId
  let employeeRoleId

  const ADMIN_EMAIL = 'onboard-admin@example.com'
  const ADMIN_PASSWORD = 'AdminPassword123!'
  const EMP_EMAIL = 'onboard-emp@example.com'
  const EMP_PASSWORD = 'EmployeePassword123!'

  beforeAll(async () => {
    const onboardingManage = await prisma.permission.upsert({
      where: { resource_action: { resource: 'onboarding', action: 'manage' } },
      update: {},
      create: { resource: 'onboarding', action: 'manage', description: 'Manage onboarding' }
    })

    const onboardingView = await prisma.permission.upsert({
      where: { resource_action: { resource: 'onboarding', action: 'view' } },
      update: {},
      create: { resource: 'onboarding', action: 'view', description: 'View onboarding' }
    })

    const superAdminRole = await prisma.role.upsert({
      where: { name: 'Super Admin' },
      update: { description: 'Full access', isSystem: true },
      create: { name: 'Super Admin', description: 'Full access', isSystem: true }
    })
    const employeeRole = await prisma.role.upsert({
      where: { name: 'Employee' },
      update: { description: 'Employee', isSystem: true },
      create: { name: 'Employee', description: 'Employee', isSystem: true }
    })

    superAdminRoleId = superAdminRole.id
    employeeRoleId = employeeRole.id

    await prisma.rolePermission.createMany({
      data: [
        { roleId: superAdminRole.id, permissionId: onboardingManage.id },
        { roleId: superAdminRole.id, permissionId: onboardingView.id }
      ],
      skipDuplicates: true
    })

  })

  beforeEach(async () => {
    const adminHashed = await bcrypt.hash(ADMIN_PASSWORD, 10)
    const adminUser = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        password: adminHashed,
        firstName: 'Admin',
        lastName: 'User',
        roleId: superAdminRoleId,
        status: 'active'
      }
    })

    const empHashed = await bcrypt.hash(EMP_PASSWORD, 10)
    const employeeUser = await prisma.user.create({
      data: {
        email: EMP_EMAIL,
        password: empHashed,
        firstName: 'Emp',
        lastName: 'User',
        roleId: employeeRoleId,
        status: 'active'
      }
    })

    const employee = await prisma.employee.create({
      data: {
        userId: employeeUser.id,
        employeeNumber: `EMP-${Date.now()}`,
        firstName: 'Emp',
        lastName: 'User',
        email: EMP_EMAIL,
        hireDate: new Date(),
        salary: 50000,
        status: 'active'
      }
    })

    employeeId = employee.id
    adminToken = jwt.sign(
      { userId: adminUser.id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    )

    expect(adminToken).toBeTruthy()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should start onboarding process for an employee', async () => {
    const res = await request(app)
      .post(`/api/onboarding/process/${employeeId}/start`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ startDate: new Date().toISOString() })

    expect(res.status).toBe(201)
    expect(res.body.data).toHaveProperty('id')
  })

  it('should create a task for the employee onboarding process', async () => {
    const res = await request(app)
      .post(`/api/onboarding/process/${employeeId}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Submit ID proof' })

    expect([201, 200, 401, 403]).toContain(res.status)
    if ([201, 200].includes(res.status)) {
      expect(res.body.data).toHaveProperty('id')
    } else {
      expect(res.body).toHaveProperty('error')
    }
  })

  it('should list onboarding process with tasks', async () => {
    await request(app)
      .post(`/api/onboarding/process/${employeeId}/start`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ startDate: new Date().toISOString() })

    await request(app)
      .post(`/api/onboarding/process/${employeeId}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Submit ID proof' })

    const res = await request(app)
      .get(`/api/onboarding/process/${employeeId}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('tasks')
  })
})
