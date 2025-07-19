import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';

export async function GET(request: NextRequest) {
  try {
    console.log('Activities API: Starting request...');
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const credentials = {
      email: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY,
      apiKey: process.env.GOOGLE_SHEETS_API_KEY,
    };

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      console.error('Activities API: Missing spreadsheet ID');
      return NextResponse.json(
        { error: 'Google Sheets configuration is incomplete. Please check your environment variables.' },
        { status: 500 }
      );
    }

    console.log('Activities API: Initializing data service...');
    const dataService = new DataService(spreadsheetId, credentials);
    
    console.log('Activities API: Fetching recent activities...');
    const activities = await dataService.getRecentActivities(limit);
    
    console.log(`Activities API: Returning ${activities.length} activities`);
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Activities API: Error:', error);
    return NextResponse.json(
      { error: `Failed to fetch activities: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}