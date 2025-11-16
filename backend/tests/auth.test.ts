import request from 'supertest'
import app from '../src/index'
import { prisma } from '../src/config/database'
import { hashPassword } from '../src/utils/auth'

describe('Auth API', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany()
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const password = await hashPassword('TestPassword123!')
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          password,
          role: 'employee',
          isActive: true,
        },
      })

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.accessToken).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
      expect(response.body.data.user.email).toBe('test@example.com')
    })

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Invalid credentials')
    })

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token', async () => {
      const password = await hashPassword('TestPassword123!')
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password,
          role: 'employee',
          isActive: true,
        },
      })

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        })

      const refreshToken = loginResponse.body.data.refreshToken

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.accessToken).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
    })
  })

  describe('GET /api/auth/me', () => {
    it('should get user profile', async () => {
      const password = await hashPassword('TestPassword123!')
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          password,
          role: 'employee',
          isActive: true,
        },
      })

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        })

      const accessToken = loginResponse.body.data.accessToken

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe('test@example.com')
    })
  })
})