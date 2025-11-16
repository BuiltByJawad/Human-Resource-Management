import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.json({ message: 'Logged out successfully' })
  
  response.cookies.delete('accessToken')
  response.cookies.delete('refreshToken')
  
  return response
}