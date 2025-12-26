import { NextRequest, NextResponse } from 'next/server'
import { extractTenantSlug } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value
    
    if (!accessToken) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const tenantSlug = extractTenantSlug({
      headerSlug: request.headers.get('x-tenant-slug'),
      hostname: request.headers.get('host'),
    })
    
    const response = await fetch(`${process.env.BACKEND_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
      },
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json({ user: null }, { status: response.status })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}