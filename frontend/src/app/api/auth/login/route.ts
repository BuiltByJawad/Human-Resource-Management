import { NextRequest, NextResponse } from 'next/server'
import { extractTenantSlug } from '@/lib/tenant'
import { getBackendBaseUrl } from '@/lib/config/env'

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

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json()
    const shouldRemember = rememberMe === true

    const tenantSlug = extractTenantSlug({
      headerSlug: request.headers.get('x-tenant-slug'),
      hostname: request.headers.get('host'),
    })
    
    const backendBaseUrl = getBackendBaseUrl()

    let response: Response
    try {
      response = await fetch(`${backendBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
        },
        body: JSON.stringify({ email, password }),
      })
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Login proxy: backend request failed', error)
      }
      return NextResponse.json(
        { error: 'Unable to reach authentication service' },
        { status: 502 }
      )
    }

    const rawText = await response.text()
    const parsed = parseJsonSafely(rawText)
    const data: unknown = parsed ?? { message: rawText }
    
    if (!response.ok) {
      const message = extractErrorMessage(data, 'Login failed')
      return NextResponse.json(
        { error: message },
        { status: response.status }
      )
    }
    
    const dataRecord = getRecord(data)
    const nestedData = getRecord(dataRecord?.data)
    const payload = nestedData ?? dataRecord ?? {}

    const accessToken = typeof payload.accessToken === 'string' ? payload.accessToken : null
    const refreshTokenFromBody = typeof payload.refreshToken === 'string' ? payload.refreshToken : null

    const headerObj = response.headers as unknown as { getSetCookie?: () => string[] }
    const setCookies = typeof headerObj.getSetCookie === 'function' ? headerObj.getSetCookie() : []
    const combined = setCookies.length ? setCookies.join(',') : response.headers.get('set-cookie')
    const refreshMatch = typeof combined === 'string' ? combined.match(/(?:^|,\s*)refreshToken=([^;]+)/) : null
    const refreshTokenFromCookie = refreshMatch?.[1]

    const refreshToken = refreshTokenFromBody || refreshTokenFromCookie

    const nextResponse = NextResponse.json(data)
    
    nextResponse.cookies.delete('accessToken')
    nextResponse.cookies.delete('refreshToken')

    nextResponse.cookies.set('accessToken', '', {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
    })
    nextResponse.cookies.set('refreshToken', '', {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
    })
    
    if (accessToken) {
      nextResponse.cookies.set('accessToken', accessToken, {
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        ...(shouldRemember ? { maxAge: 60 * 15 } : {}),
      })
    }
    
    if (refreshToken) {
      nextResponse.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        ...(shouldRemember ? { maxAge: 60 * 60 * 24 * 7 } : {}),
      })
    }
    
    return nextResponse
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}