'use server'

import { cookies } from 'next/headers'
import { getBackendBaseUrl } from '@/lib/config/env'

interface LoginActionInput {
  email: string
  password: string
  rememberMe: boolean
}

interface LoginActionResult {
  destination?: string
  error?: string
}

const parseJsonSafely = (text: string): unknown | null => {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

const extractErrorMessage = (data: unknown, fallback: string): string => {
  if (!data || typeof data !== 'object') return fallback

  const obj = data as Record<string, unknown>
  const message = obj.message
  if (typeof message === 'string' && message) return message

  const error = obj.error
  if (typeof error === 'string' && error) return error
  if (error && typeof error === 'object') {
    const nested = (error as Record<string, unknown>).message
    if (typeof nested === 'string' && nested) return nested
  }

  const dataNode = obj.data
  if (dataNode && typeof dataNode === 'object') {
    const nested = (dataNode as Record<string, unknown>).message
    if (typeof nested === 'string' && nested) return nested
  }

  return fallback
}

const getRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export async function loginAction(input: LoginActionInput): Promise<LoginActionResult> {
  const email = typeof input.email === 'string' ? input.email.trim() : ''
  const password = typeof input.password === 'string' ? input.password : ''
  const rememberMe = input.rememberMe === true

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const backendBaseUrl = getBackendBaseUrl()

  let response: Response
  try {
    response = await fetch(`${backendBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    })
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Login action: backend request failed', error)
    }
    return { error: 'Unable to reach authentication service' }
  }

  const rawText = await response.text()
  const parsed = parseJsonSafely(rawText)
  const data: unknown = parsed ?? { message: rawText }

  if (!response.ok) {
    return { error: extractErrorMessage(data, 'Login failed') }
  }

  const dataRecord = getRecord(data)
  const nestedData = getRecord(dataRecord?.data)
  const payload = nestedData ?? dataRecord ?? {}
  const accessToken = typeof payload.accessToken === 'string' ? payload.accessToken : null
  const refreshToken = typeof payload.refreshToken === 'string' ? payload.refreshToken : null
  const role = typeof payload.role === 'string'
    ? payload.role
    : typeof payload.user === 'object' && payload.user && typeof (payload.user as Record<string, unknown>).role === 'string'
      ? ((payload.user as Record<string, unknown>).role as string)
      : null

  const cookieStore = await cookies()

  cookieStore.set('accessToken', '', {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
  })

  if (accessToken) {
    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      ...(rememberMe ? { maxAge: 60 * 15 } : {}),
    })
  }

  if (refreshToken) {
    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      ...(rememberMe ? { maxAge: 60 * 60 * 24 * 7 } : {}),
    })
  }

  const isAdminRole = typeof role === 'string' && role.toLowerCase().includes('admin')
  const destination = isAdminRole ? '/dashboard' : '/employees'

  return { destination }
}
