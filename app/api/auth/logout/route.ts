import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('Auth API: Logout request...');
    
    // Clear the session cookie
    const cookieStore = cookies();
    cookieStore.delete('auth-session');

    console.log('Auth API: Logout successful');
    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Auth API: Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}