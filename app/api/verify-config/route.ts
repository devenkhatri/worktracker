import { NextResponse } from 'next/server';
import DataService from '@/lib/data-service';

export async function GET() {
  try {
    // Check environment variables first
    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      return NextResponse.json({
        success: false,
        message: 'GOOGLE_SHEETS_SPREADSHEET_ID environment variable is not set',
        details: { missingEnvVars: ['GOOGLE_SHEETS_SPREADSHEET_ID'] }
      });
    }
    
    // Prepare credentials based on available environment variables
    const credentials: { email?: string; privateKey?: string; apiKey?: string } = {};
    const missingEnvVars: string[] = [];
    
    if (process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      credentials.email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
      credentials.privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    } else if (process.env.GOOGLE_SHEETS_API_KEY) {
      credentials.apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    } else {
      if (!process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL) {
        missingEnvVars.push('GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL');
      }
      if (!process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
        missingEnvVars.push('GOOGLE_SHEETS_PRIVATE_KEY');
      }
      if (!process.env.GOOGLE_SHEETS_API_KEY) {
        missingEnvVars.push('GOOGLE_SHEETS_API_KEY');
      }
      
      return NextResponse.json({
        success: false,
        message: 'Either Service Account credentials (GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL + GOOGLE_SHEETS_PRIVATE_KEY) or API key (GOOGLE_SHEETS_API_KEY) must be provided',
        details: { missingEnvVars }
      });
    }

    const dataService = new DataService(
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      credentials
    );

    const verification = await dataService.verifyConfiguration();
    return NextResponse.json(verification);
  } catch (error) {
    console.error('Error verifying configuration:', error);
    return NextResponse.json({
      success: false,
      message: `Configuration verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.message : error }
    });
  }
}