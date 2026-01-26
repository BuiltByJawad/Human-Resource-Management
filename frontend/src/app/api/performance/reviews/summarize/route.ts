import { NextRequest, NextResponse } from 'next/server'
import { getBackendBaseUrl } from '@/lib/config/env'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    const accessTokenFromCookie = request.cookies.get('accessToken')?.value
    const authHeader = request.headers.get('authorization')
    const accessTokenFromHeader = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : undefined
    const accessToken = accessTokenFromCookie || accessTokenFromHeader

    const backendBaseUrl = getBackendBaseUrl()

    const response = await fetch(`${backendBaseUrl}/api/performance/reviews/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body,
    })

    const text = await response.text()
    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
