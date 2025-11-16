import request from 'supertest'
import app from '../src/index'
import { prisma } from '../src/config/database'
import { hashPassword } from '../src/utils/auth'

describe('Employee API', () => {
  let authToken: string
  let testDepartment: any
  let testRole: any

  beforeEach(async () => {
    await prisma.employee.deleteMany()
    await prisma.department.deleteMany()
    await prisma.role.deleteMany()
    await prisma.user.deleteMany()

    const password = await hashPassword('TestPassword123!')
    const user = await prisma.user.create({
      data: {
        email: 'hr@example.com',
        password,
        role: 'hr_admin',
        isActive: true,
      },
    })

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'hr@example.com',
        password: 'TestPassword123!',
      })

    authToken = loginResponse.body.data.accessToken

    testDepartment = await prisma.department.create({
      data: {
        name: 'Engineering',
        description: 'Software Engineering Department',
      },
    })

    testRole = await prisma.role.create({
      data: {
        name: 'Software Engineer',
        description: 'Software Engineer Role',
        permissions: { read: true, write: true },
      },
    })
  })

  describe('GET /api/employees', () => {
    it('should get all employees', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.pagination).toBeDefined()
    })

    it('should filter employees by department', async () => {
      await prisma.employee.create({
        data: {
          employeeNumber: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          departmentId: testDepartment.id,
          roleId: testRole.id,
          hireDate: new Date(),
          salary: 50000,
          status: 'active',
        },
      })

      const response = await request(app)
        .get(`/api/employees?departmentId=${testDepartment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.length).toBe(1)
    })
  })

  describe('POST /api/employees', () => {
    it('should create a new employee', async () => {
      const employeeData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        departmentId: testDepartment.id,
        roleId: testRole.id,
        hireDate: new Date().toISOString(),
        salary: 60000,
      }

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(employeeData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.email).toBe('jane@example.com')
      expect(response.body.data.employeeNumber).toBeDefined()
    })

    it('should fail with invalid email', async () => {
      const employeeData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'invalid-email',
        departmentId: testDepartment.id,
        roleId: testRole.id,
        hireDate: new Date().toISOString(),
        salary: 60000,
      }

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(employeeData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/employees/:id', () => {
    it('should get employee by id', async () => {
      const employee = await prisma.employee.create({
        data: {
          employeeNumber: 'EMP002',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          departmentId: testDepartment.id,
          roleId: testRole.id,
          hireDate: new Date(),
          salary: 50000,
          status: 'active',
        },
      })

      const response = await request(app)
        .get(`/api/employees/${employee.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.email).toBe('john@example.com')
    })

    it('should return 404 for non-existent employee', async () => {
      const response = await request(app)
        .get('/api/employees/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })
})