import { NextRequest, NextResponse } from 'next/server'
import { getBackendBaseUrl } from '@/lib/config/env'

const splitSetCookieHeader = (raw: string): string[] => {
  // Some servers (or proxies) may return multiple cookies in a single header value.
  // Split on commas that start a new cookie (best-effort; avoids breaking on Expires=...)
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
    let body: unknown = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }
    
    const bodyRecord = (body && typeof body === 'object' && !Array.isArray(body))
      ? (body as Record<string, unknown>)
      : {}

    const rememberMe = bodyRecord.rememberMe
    const shouldRemember = rememberMe === true

    const refreshTokenFromRequestBody = typeof bodyRecord.refreshToken === 'string' ? bodyRecord.refreshToken : null
    const refreshTokenFromCookie = request.cookies.get('refreshToken')?.value
    const refreshToken = refreshTokenFromRequestBody || refreshTokenFromCookie

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 401 }
      )
    }

    const backendBaseUrl = getBackendBaseUrl()

    const cookieHeader = request.headers.get('cookie')

    // Prefer the backend refresh endpoint that supports cookie-based refresh.
    const response = await fetch(`${backendBaseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      body: JSON.stringify({ refreshToken }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Refresh proxy failed', { status: response.status })
      }
      return NextResponse.json(
        { error: data.message || 'Token refresh failed' },
        { status: response.status }
      )
    }
    
    const payload = data?.data ?? data
    const accessToken = payload?.accessToken

    const headerObj = response.headers as unknown as { getSetCookie?: () => string[] }
    const setCookies = typeof headerObj.getSetCookie === 'function' ? headerObj.getSetCookie() : []
    const nextResponse = NextResponse.json(data)

    const rawSetCookie = response.headers.get('set-cookie')
    const refreshTokenFromResponseBody = typeof payload?.refreshToken === 'string' ? payload.refreshToken : null
    const cookieCandidates = setCookies.length
      ? setCookies
      : (rawSetCookie ? splitSetCookieHeader(rawSetCookie) : [])
    const refreshTokenFromSetCookie =
      extractCookieValue(cookieCandidates, 'refreshToken') ??
      extractCookieValue(cookieCandidates, 'refresh_token')
    const nextRefreshToken = refreshTokenFromResponseBody || refreshTokenFromSetCookie

    // Forward backend refreshToken cookie updates (including rotation) as-is.
    // This avoids losing the new refresh token when the backend rotates it.
    if (setCookies.length) {
      setCookies.forEach((cookie) => {
        nextResponse.headers.append('set-cookie', cookie)
      })
    } else {
      if (rawSetCookie) {
        nextResponse.headers.set('set-cookie', rawSetCookie)
      }
    }

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

    // Ensure the refresh token is persisted on the frontend domain as well.
    // Some backends set a Domain attribute that won't match localhost, so forwarding
    // set-cookie alone can lead to missing refreshToken cookies in the browser.
    if (nextRefreshToken) {
      nextResponse.cookies.set('refreshToken', nextRefreshToken, {
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        ...(shouldRemember ? { maxAge: 60 * 60 * 24 * 7 } : {}),
      })
    }

    return nextResponse
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Refresh proxy error', error)
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}