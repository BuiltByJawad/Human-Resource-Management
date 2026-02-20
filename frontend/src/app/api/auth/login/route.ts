import { NextRequest, NextResponse } from 'next/server'
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

const splitSetCookieHeader = (raw: string): string[] => {
  // Best-effort split for multiple cookies in one header value.
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

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json()
    const shouldRemember = rememberMe === true

    const backendBaseUrl = getBackendBaseUrl()

    let response: Response
    try {
      response = await fetch(`${backendBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
    const nextResponse = NextResponse.json(data)

    const headerObj = response.headers as unknown as { getSetCookie?: () => string[] }
    const setCookies = typeof headerObj.getSetCookie === 'function' ? headerObj.getSetCookie() : []
    if (setCookies.length) {
      setCookies.forEach((cookie) => {
        nextResponse.headers.append('set-cookie', cookie)
      })
    } else {
      const rawSetCookie = response.headers.get('set-cookie')
      if (rawSetCookie) {
        nextResponse.headers.set('set-cookie', rawSetCookie)
      }
    }

    const refreshTokenFromBody = typeof (payload as Record<string, unknown>)?.refreshToken === 'string'
      ? ((payload as Record<string, unknown>).refreshToken as string)
      : null
    const rawSetCookie = response.headers.get('set-cookie')
    const cookieCandidates = setCookies.length
      ? setCookies
      : (rawSetCookie ? splitSetCookieHeader(rawSetCookie) : [])
    const refreshTokenFromSetCookie =
      extractCookieValue(cookieCandidates, 'refreshToken') ??
      extractCookieValue(cookieCandidates, 'refresh_token')
    const refreshToken = refreshTokenFromBody || refreshTokenFromSetCookie
    
    nextResponse.cookies.delete('accessToken')

    nextResponse.cookies.set('accessToken', '', {
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