import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('Auth API: Session check request...');
    
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('auth-session');
    
    if (!sessionCookie) {
      return NextResponse.json({
        isAuthenticated: false,
        user: null
      });
    }

    try {
      const sessionData = JSON.parse(sessionCookie.value);
      
      // Check if session is still valid (within 24 hours)
      const loginTime = new Date(sessionData.loginTime);
      const now = new Date();
      const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLogin > 24) {
        // Session expired, clear cookie
        cookieStore.delete('auth-session');
        return NextResponse.json({
          isAuthenticated: false,
          user: null,
          message: 'Session expired'
        });
      }

      console.log(`Auth API: Valid session for user: ${sessionData.username}`);
      return NextResponse.json({
        isAuthenticated: true,
        user: { username: sessionData.username },
        loginTime: sessionData.loginTime
      });
    } catch (parseError) {
      console.error('Auth API: Invalid session data:', parseError);
      cookieStore.delete('auth-session');
      return NextResponse.json({
        isAuthenticated: false,
        user: null
      });
    }
  } catch (error) {
    console.error('Auth API: Session check error:', error);
    return NextResponse.json(
      { error: 'Session check failed' },
      { status: 500 }
    );
  }
}