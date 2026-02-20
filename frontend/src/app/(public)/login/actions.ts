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
  accessToken?: string | null
  refreshToken?: string | null
  user?: Record<string, unknown> | null
  permissions?: string[]
  requiresMfa?: boolean
  mfaToken?: string | null
  mustSetupMfa?: boolean
}

interface VerifyMfaInput {
  mfaToken: string
  code: string
  rememberMe: boolean
}

interface VerifyMfaResult {
  destination?: string
  error?: string
  accessToken?: string | null
  refreshToken?: string | null
  user?: Record<string, unknown> | null
  permissions?: string[]
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

const splitSetCookieHeader = (raw: string): string[] => {
  return raw.split(/,(?=\s*[^\s;,]+=)/g).map((part) => part.trim()).filter(Boolean)
}

const extractCookieValue = (setCookieHeaders: string[], name: string): string | null => {
  const prefix = `${name}=`
  for (const header of setCookieHeaders) {
    if (typeof header !== 'string') continue
    const trimmed = header.trim()
    if (!trimmed.toLowerCase().startsWith(prefix.toLowerCase())) continue
    const valuePart = trimmed.slice(prefix.length)
    const endIdx = valuePart.indexOf(';')
    const value = (endIdx === -1 ? valuePart : valuePart.slice(0, endIdx)).trim()
    return value || null
  }
  return null
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
  const requiresMfa = (payload as Record<string, unknown>)?.requiresMfa === true
  const mfaToken = typeof (payload as Record<string, unknown>)?.mfaToken === 'string'
    ? ((payload as Record<string, unknown>).mfaToken as string)
    : null
  const mustSetupMfa = (payload as Record<string, unknown>)?.mustSetupMfa === true
  const accessToken = typeof payload.accessToken === 'string' ? payload.accessToken : null

  const rawSetCookie = response.headers.get('set-cookie')
  const cookieCandidates = rawSetCookie ? splitSetCookieHeader(rawSetCookie) : []
  const refreshTokenFromPayload = typeof payload.refreshToken === 'string' ? payload.refreshToken : null
  const refreshTokenFromSetCookie =
    extractCookieValue(cookieCandidates, 'refreshToken') ?? extractCookieValue(cookieCandidates, 'refresh_token')
  const refreshToken = refreshTokenFromPayload || refreshTokenFromSetCookie
  const user = (payload.user && typeof payload.user === 'object' && !Array.isArray(payload.user))
    ? (payload.user as Record<string, unknown>)
    : null
  const permissions = Array.isArray((payload as Record<string, unknown>).permissions)
    ? ((payload as Record<string, unknown>).permissions as string[])
    : []
  const role = typeof payload.role === 'string'
    ? payload.role
    : typeof payload.user === 'object' && payload.user && typeof (payload.user as Record<string, unknown>).role === 'string'
      ? ((payload.user as Record<string, unknown>).role as string)
      : null

  const cookieStore = await cookies()

  // For MFA step 1, do not set auth cookies yet; the second step will complete login.
  if (!requiresMfa) {
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
  }

  const isAdminRole = typeof role === 'string' && role.toLowerCase().includes('admin')
  const destination = isAdminRole ? '/dashboard' : '/employees'

  if (requiresMfa && mfaToken) {
    return {
      requiresMfa: true,
      mfaToken,
      user,
      permissions,
      mustSetupMfa,
    }
  }

  return { destination, accessToken, refreshToken, user, permissions, mustSetupMfa }
}

export async function verifyMfaAction(input: VerifyMfaInput): Promise<VerifyMfaResult> {
  const mfaToken = typeof input.mfaToken === 'string' ? input.mfaToken : ''
  const code = typeof input.code === 'string' ? input.code : ''
  const rememberMe = input.rememberMe === true

  if (!mfaToken || !code) {
    return { error: 'MFA token and code are required' }
  }

  const backendBaseUrl = getBackendBaseUrl()

  let response: Response
  try {
    response = await fetch(`${backendBaseUrl}/api/auth/mfa/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mfaToken, code }),
      cache: 'no-store',
    })
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('verifyMfaAction: backend request failed', error)
    }
    return { error: 'Unable to reach authentication service' }
  }

  const rawText = await response.text()
  const parsed = parseJsonSafely(rawText)
  const data: unknown = parsed ?? { message: rawText }

  if (!response.ok) {
    return { error: extractErrorMessage(data, 'MFA verification failed') }
  }

  const dataRecord = getRecord(data)
  const nestedData = getRecord(dataRecord?.data)
  const payload = nestedData ?? dataRecord ?? {}

  const accessToken = typeof (payload as Record<string, unknown>).accessToken === 'string'
    ? ((payload as Record<string, unknown>).accessToken as string)
    : null

  const rawSetCookie = response.headers.get('set-cookie')
  const cookieCandidates = rawSetCookie ? splitSetCookieHeader(rawSetCookie) : []
  const refreshTokenFromPayload = typeof (payload as Record<string, unknown>).refreshToken === 'string'
    ? ((payload as Record<string, unknown>).refreshToken as string)
    : null
  const refreshTokenFromSetCookie =
    extractCookieValue(cookieCandidates, 'refreshToken') ?? extractCookieValue(cookieCandidates, 'refresh_token')
  const refreshToken = refreshTokenFromPayload || refreshTokenFromSetCookie
  const user = (payload as Record<string, unknown>).user && typeof (payload as Record<string, unknown>).user === 'object'
    ? ((payload as Record<string, unknown>).user as Record<string, unknown>)
    : null
  const permissions = Array.isArray((payload as Record<string, unknown>).permissions)
    ? ((payload as Record<string, unknown>).permissions as string[])
    : []
  const role = typeof (payload as Record<string, unknown>).role === 'string'
    ? ((payload as Record<string, unknown>).role as string)
    : typeof (payload as Record<string, unknown>).user === 'object' && (payload as Record<string, unknown>).user &&
        typeof ((payload as Record<string, unknown>).user as Record<string, unknown>).role === 'string'
      ? (((payload as Record<string, unknown>).user as Record<string, unknown>).role as string)
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

  return { destination, accessToken, refreshToken, user, permissions }
}
