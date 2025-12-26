import { NextRequest, NextResponse } from 'next/server'
import { extractTenantSlug } from '@/lib/tenant'

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json()
    const shouldRemember = rememberMe === true
    const tenantSlug = extractTenantSlug({
      headerSlug: request.headers.get('x-tenant-slug'),
      hostname: request.headers.get('host'),
    })
    
    const response = await fetch(`${process.env.BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
      },
      body: JSON.stringify({ email, password }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Login failed' },
        { status: response.status }
      )
    }
    
    const payload = data?.data ?? data
    const accessToken = payload?.accessToken
    const refreshToken = payload?.refreshToken

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