import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value
    
    if (!accessToken) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const response = await fetch(`${process.env.BACKEND_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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