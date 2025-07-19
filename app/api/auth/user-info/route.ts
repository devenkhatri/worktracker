import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import DataService from '@/lib/data-service';

export async function GET(request: NextRequest) {
  try {
    console.log('User Info API: Starting request...');
    
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('auth-session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const sessionData = JSON.parse(sessionCookie.value);
    const username = sessionData.username;

    const credentials = {
      email: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY,
      apiKey: process.env.GOOGLE_SHEETS_API_KEY,
    };

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('User Info API: Missing spreadsheet ID');
      return NextResponse.json(
        { error: 'Google Sheets configuration is incomplete' },
        { status: 500 }
      );
    }

    console.log('User Info API: Initializing data service...');
    const dataService = new DataService(spreadsheetId, credentials);
    
    console.log('User Info API: Getting user information...');
    const users = await dataService.getUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user info without password
    const userInfo = {
      username: user.username,
      lastLogin: user.lastLogin,
      currentSession: sessionData.loginTime
    };

    console.log(`User Info API: Returning info for user: ${username}`);
    return NextResponse.json(userInfo);
  } catch (error) {
    console.error('User Info API: Error:', error);
    return NextResponse.json(
      { error: `Failed to get user info: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}