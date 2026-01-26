import { NextRequest, NextResponse } from 'next/server'
import { getBackendBaseUrl } from '@/lib/config/env'

export async function GET(request: NextRequest) {
  const accessTokenFromCookie = request.cookies.get('accessToken')?.value
  const authHeader = request.headers.get('authorization')
  const accessTokenFromHeader = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : undefined
  const accessToken = accessTokenFromCookie || accessTokenFromHeader

  const backendBaseUrl = getBackendBaseUrl()

  const res = await fetch(`${backendBaseUrl}/api/notifications`, {
    method: 'GET',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    },
    cache: 'no-store',
  })

  const text = await res.text()
  const contentType = res.headers.get('content-type') || ''

  const nextRes = new NextResponse(text, {
    status: res.status,
    headers: {
      'Content-Type': contentType || 'application/json',
      'Cache-Control': 'no-store, max-age=0',
      Pragma: 'no-cache',
    },
  })

  return nextRes
}
