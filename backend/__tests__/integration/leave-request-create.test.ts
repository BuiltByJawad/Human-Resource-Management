/// <reference types="jest" />

import { describe, expect, it, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import type { Application } from 'express'
import { Prisma, PrismaClient } from '@prisma/client'

import app from '../../src/index'
import { hashPassword } from '../../src/shared/utils/auth'

describe('Integration: Leave request creation', () => {
  const prisma = new PrismaClient()

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret'
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('logs in a user with an employee profile and can create a leave request', async () => {
    const role = await prisma.role.findFirst({ where: { name: 'Employee' } })
    if (!role) {
      throw new Error('Required role "Employee" not seeded for tests')
    }

    const email = `leave.integration.${Date.now()}@example.com`
    const plainPassword = 'IntegrationPass123!'

    const user = await prisma.user.create({
      data: {
        email,
        password: await hashPassword(plainPassword),
        roleId: role.id,
        status: 'active',
        verified: true,
      },
    })

    await prisma.employee.create({
      data: {
        userId: user.id,
        employeeNumber: `EMP-${Date.now()}`,
        firstName: 'Leave',
        lastName: 'Requester',
        email,
        hireDate: new Date(),
        salary: new Prisma.Decimal('0.00'),
      },
    })

    const loginResponse = await request(app as unknown as Application)
      .post('/api/auth/login')
      .send({ email, password: plainPassword })
      .expect(200)

    const token: string | undefined = loginResponse.body?.data?.accessToken
    expect(token).toBeTruthy()

    const today = new Date()
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 7))
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 8))

    const response = await request(app as unknown as Application)
      .post('/api/leave')
      .set('Authorization', `Bearer ${token}`)
      .send({
        leaveType: 'annual',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        reason: 'Integration test leave request',
      })
      .expect(201)

    expect(response.body?.success).toBe(true)
    expect(response.body?.data?.id).toBeTruthy()
    expect(response.body?.data?.leaveType).toBe('annual')
  })
})
