/// <reference types="jest" />

import { describe, expect, it } from '@jest/globals'
import request from 'supertest'
import type { Application } from 'express'

import app from '../../src/index'

const getRefreshCookie = (setCookie: string | string[] | undefined): string => {
  const values = typeof setCookie === 'string' ? [setCookie] : setCookie
  const cookieHeader = Array.isArray(values) ? values.find((value) => value.startsWith('refreshToken=')) : undefined
  if (!cookieHeader) {
    throw new Error('Expected refreshToken cookie to be set')
  }
  return cookieHeader.split(';')[0] ?? cookieHeader
}

describe('Integration: Auth refresh using httpOnly cookie', () => {
  const testEmail = 'integration.user@example.com'
  const testPassword = 'IntegrationPass123!'

  it('register -> login sets refresh cookie -> refresh works with cookie only', async () => {
    const registerResponse = await request(app as unknown as Application)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        firstName: 'Integration',
        lastName: 'User',
      })
      .expect(201)

    expect(registerResponse.body?.success).toBe(true)

    const loginResponse = await request(app as unknown as Application)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200)

    expect(loginResponse.body?.success).toBe(true)
    expect(loginResponse.body?.data?.accessToken).toBeDefined()

    const refreshCookie = getRefreshCookie(loginResponse.headers['set-cookie'])

    const refreshResponse = await request(app as unknown as Application)
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie)
      .send({})
      .expect(200)

    expect(refreshResponse.body?.success).toBe(true)
    expect(refreshResponse.body?.data?.accessToken).toBeDefined()

    const rotatedCookie = getRefreshCookie(refreshResponse.headers['set-cookie'])
    expect(rotatedCookie).toContain('refreshToken=')
  })
})
