import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.json({ message: 'Logged out successfully' })

  response.cookies.set('accessToken', '', {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
  })
  response.cookies.set('refreshToken', '', {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
  })

  response.cookies.delete('accessToken')
  response.cookies.delete('refreshToken')
  
  return response
}