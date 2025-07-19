import { NextResponse } from 'next/server';
import DataService from '@/lib/data-service';

export async function GET() {
  try {
    console.log('Dashboard API: Starting...');
    // Check environment variables
    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      console.error('Missing GOOGLE_SHEETS_SPREADSHEET_ID');
      return NextResponse.json(
        { error: 'GOOGLE_SHEETS_SPREADSHEET_ID environment variable is not set' },
        { status: 500 }
      );
    }
    
    // Prepare credentials based on available environment variables
    const credentials: { email?: string; privateKey?: string; apiKey?: string } = {};
    
    if (process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      credentials.email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
      credentials.privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
      console.log('Dashboard API: Using Service Account authentication');
    } else if (process.env.GOOGLE_SHEETS_API_KEY) {
      credentials.apiKey = process.env.GOOGLE_SHEETS_API_KEY;
      console.log('Dashboard API: Using API Key authentication');
    } else {
      console.error('Missing authentication credentials');
      return NextResponse.json(
        { error: 'Either Service Account credentials or API key must be provided' },
        { status: 500 }
      );
    }

    console.log('Dashboard API: Creating DataService...');
    const dataService = new DataService(
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      credentials
    );

    console.log('Dashboard API: Getting stats...');
    const stats = await dataService.getDashboardStats();
    console.log('Dashboard API: Stats retrieved:', stats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    if (error instanceof Error) {
      console.error('Dashboard API Error stack:', error.stack);
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to fetch dashboard stats: ${errorMessage}` },
      { status: 500 }
    );
  }
}