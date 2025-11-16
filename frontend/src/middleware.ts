import { NextRequest, NextResponse } from 'next/server'
import type { NextFetchEvent } from 'next/server'

export function middleware(request: NextRequest, event: NextFetchEvent) {
  const disableAuth = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true'
  const token = request.cookies.get('accessToken')?.value
  const isAuthPage =
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname.startsWith('/auth')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  
  if (disableAuth) {
    return NextResponse.next()
  }

  if (isAuthPage) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }
  
  if (!isApiRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}