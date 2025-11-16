const request = require('supertest')
const app = require('../src/app')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

describe('Authentication API', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({})
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
          firstName: 'John',
          lastName: 'Doe',
          role: 'EMPLOYEE'
        })

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('user')
      expect(response.body.user.email).toBe('test@example.com')
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('should not register user with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!',
          firstName: 'John',
          lastName: 'Doe',
          role: 'EMPLOYEE'
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should not register user with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'weak',
          firstName: 'John',
          lastName: 'Doe',
          role: 'EMPLOYEE'
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should not register user with duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'EMPLOYEE'
        })

      expect(response.status).toBe(409)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user.email).toBe('test@example.com')
    })

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        })

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!'
        })

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    it('should not login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message', 'Logged out successfully')
    })
  })

  describe('POST /api/auth/refresh', () => {
    let authToken: string

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        })
      
      authToken = loginResponse.body.token
    })

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
    })

    it('should not refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    it('should not refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })
  })
})

describe('Employee API', () => {
  let authToken: string
  let adminToken: string

  beforeAll(async () => {
    // Create admin user
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'AdminPassword123!',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN'
      })
    
    adminToken = adminResponse.body.token

    // Create regular employee
    const employeeResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'employee@example.com',
        password: 'EmployeePassword123!',
        firstName: 'Employee',
        lastName: 'User',
        role: 'EMPLOYEE'
      })
    
    authToken = employeeResponse.body.token
  })

  afterAll(async () => {
    await prisma.employee.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.$disconnect()
  })

  describe('GET /api/employees', () => {
    it('should get all employees with admin role', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('employees')
      expect(Array.isArray(response.body.employees)).toBe(true)
    })

    it('should not allow employees without proper permissions', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(403)
      expect(response.body).toHaveProperty('error')
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/employees')

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/employees', () => {
    it('should create employee with admin role', async () => {
      const employeeData = {
        employeeNumber: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        hireDate: '2023-01-15',
        salary: 75000,
        status: 'ACTIVE'
      }

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(employeeData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('employee')
      expect(response.body.employee.email).toBe('john.doe@company.com')
      expect(response.body.employee.employeeNumber).toBe('EMP001')
    })

    it('should not create employee with invalid data', async () => {
      const invalidData = {
        employeeNumber: 'EMP002',
        firstName: '',
        lastName: 'Smith',
        email: 'invalid-email',
        hireDate: 'invalid-date',
        salary: -1000,
        status: 'INVALID_STATUS'
      }

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })

    it('should not create employee with duplicate employee number', async () => {
      const duplicateData = {
        employeeNumber: 'EMP001',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        hireDate: '2023-02-01',
        salary: 80000,
        status: 'ACTIVE'
      }

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateData)

      expect(response.status).toBe(409)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /api/employees/:id', () => {
    let employeeId: string

    beforeEach(async () => {
      const employeeResponse = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeNumber: 'EMP003',
          firstName: 'Test',
          lastName: 'Employee',
          email: 'test.employee@company.com',
          hireDate: '2023-03-01',
          salary: 65000,
          status: 'ACTIVE'
        })
      
      employeeId = employeeResponse.body.employee.id
    })

    it('should get employee by id', async () => {
      const response = await request(app)
        .get(`/api/employees/${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('employee')
      expect(response.body.employee.id).toBe(employeeId)
    })

    it('should return 404 for non-existent employee', async () => {
      const response = await request(app)
        .get('/api/employees/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('PUT /api/employees/:id', () => {
    let employeeId: string

    beforeEach(async () => {
      const employeeResponse = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeNumber: 'EMP004',
          firstName: 'Update',
          lastName: 'Employee',
          email: 'update.employee@company.com',
          hireDate: '2023-04-01',
          salary: 70000,
          status: 'ACTIVE'
        })
      
      employeeId = employeeResponse.body.employee.id
    })

    it('should update employee successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        salary: 75000,
        status: 'INACTIVE'
      }

      const response = await request(app)
        .put(`/api/employees/${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)

      expect(response.status).toBe(200)
      expect(response.body.employee.firstName).toBe('Updated')
      expect(response.body.employee.lastName).toBe('Name')
      expect(response.body.employee.salary).toBe(75000)
      expect(response.body.employee.status).toBe('INACTIVE')
    })

    it('should not update employee with invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        salary: -5000
      }

      const response = await request(app)
        .put(`/api/employees/${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('DELETE /api/employees/:id', () => {
    let employeeId: string

    beforeEach(async () => {
      const employeeResponse = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeNumber: 'EMP005',
          firstName: 'Delete',
          lastName: 'Employee',
          email: 'delete.employee@company.com',
          hireDate: '2023-05-01',
          salary: 60000,
          status: 'ACTIVE'
        })
      
      employeeId = employeeResponse.body.employee.id
    })

    it('should delete employee successfully', async () => {
      const response = await request(app)
        .delete(`/api/employees/${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message', 'Employee deleted successfully')

      const getResponse = await request(app)
        .get(`/api/employees/${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(getResponse.status).toBe(404)
    })

    it('should return 404 for non-existent employee', async () => {
      const response = await request(app)
        .delete('/api/employees/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error')
    })
  })
})