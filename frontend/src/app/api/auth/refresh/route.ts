import { NextRequest, NextResponse } from 'next/server'
import { getBackendBaseUrl } from '@/lib/config/env'

export async function POST(request: NextRequest) {
  try {
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const rememberMe = body?.rememberMe
    const shouldRemember = rememberMe === true

    const refreshTokenFromBody = body?.refreshToken
    const refreshTokenFromCookie = request.cookies.get('refreshToken')?.value
    const refreshToken = refreshTokenFromBody || refreshTokenFromCookie

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 401 }
      )
    }

    const backendBaseUrl = getBackendBaseUrl()

    const response = await fetch(`${backendBaseUrl}/api/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
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

    // Forward backend refreshToken cookie updates (including rotation) as-is.
    // This avoids losing the new refresh token when the backend rotates it.
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

    // refreshToken cookie is managed by the backend and forwarded above.
    
    return nextResponse
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}