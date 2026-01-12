import { NextRequest, NextResponse } from 'next/server'
import { extractTenantSlug } from '@/lib/tenant'
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

    const tenantSlug = extractTenantSlug({
      headerSlug: request.headers.get('x-tenant-slug'),
      hostname: request.headers.get('host'),
    })
    
    const backendBaseUrl = getBackendBaseUrl()

    const response = await fetch(`${backendBaseUrl}/api/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
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
    const combined = setCookies.length ? setCookies.join(',') : response.headers.get('set-cookie')
    const refreshMatch = typeof combined === 'string' ? combined.match(/(?:^|,\s*)refreshToken=([^;]+)/) : null
    const newRefreshToken = refreshMatch?.[1]

    const nextResponse = NextResponse.json(data)

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

    if (newRefreshToken) {
      nextResponse.cookies.set('refreshToken', '', {
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0),
      })
      nextResponse.cookies.set('refreshToken', newRefreshToken, {
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