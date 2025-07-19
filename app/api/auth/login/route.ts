import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('Auth API: Starting login request...');
    
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const credentials = {
      email: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY,
      apiKey: process.env.GOOGLE_SHEETS_API_KEY,
    };

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('Auth API: Missing spreadsheet ID');
      return NextResponse.json(
        { error: 'Google Sheets configuration is incomplete' },
        { status: 500 }
      );
    }

    console.log('Auth API: Initializing data service...');
    const dataService = new DataService(spreadsheetId, credentials);
    
    console.log('Auth API: Validating credentials...');
    const isValid = await dataService.validateCredentials(username, password);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Update last login timestamp
    console.log('Auth API: Updating last login timestamp...');
    await dataService.updateLastLogin(username);

    // Create session data
    const sessionData = {
      username,
      isAuthenticated: true,
      loginTime: new Date().toISOString()
    };

    // Set HTTP-only cookie for session
    const cookieStore = cookies();
    cookieStore.set('auth-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    console.log(`Auth API: Login successful for user: ${username}`);
    return NextResponse.json({
      success: true,
      user: { username },
      message: 'Login successful',
      loginTime: sessionData.loginTime
    });
  } catch (error) {
    console.error('Auth API: Error:', error);
    return NextResponse.json(
      { error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}