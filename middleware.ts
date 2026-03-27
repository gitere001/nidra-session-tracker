import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const publicPaths = ['/', '/api/auth/login']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = publicPaths.includes(pathname)
  const token = req.cookies.get('token')?.value

  if (isPublic) {
    if (token && pathname === '/') {
      const user = await verifyToken(token)
      if (user) return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  if (!token) return NextResponse.redirect(new URL('/', req.url))

  const user = await verifyToken(token)
  if (!user) {
    const res = NextResponse.redirect(new URL('/', req.url))
    res.cookies.set('token', '', { maxAge: 0 })
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}