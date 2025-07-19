import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api/auth/login', '/api/auth/session'];
  
  // Check if the current path is public
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('auth-session');
  
  if (!sessionCookie) {
    // Redirect to login if no session
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Parse and validate session
    const sessionData = JSON.parse(sessionCookie.value);
    
    // Check if session is expired (24 hours)
    const loginTime = new Date(sessionData.loginTime);
    const now = new Date();
    const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLogin > 24 || !sessionData.isAuthenticated) {
      // Session expired, redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-session');
      return response;
    }
    
    // Session is valid, continue
    return NextResponse.next();
  } catch (error) {
    // Invalid session data, redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-session');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};