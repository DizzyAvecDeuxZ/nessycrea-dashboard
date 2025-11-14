import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect root to site
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/site/', request.url))
  }

  // Serve static site files
  if (pathname.startsWith('/site')) {
    const url = request.nextUrl.clone()

    // Map /site to /site/index.html if it's just /site or /site/
    if (pathname === '/site' || pathname === '/site/') {
      url.pathname = '/site/index.html'
      return NextResponse.rewrite(url)
    }

    // For other /site paths, serve them as is
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/site/:path*',
  ],
}
