import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';

export async function GET() {
  try {
    console.log('API: Starting payments fetch...');
    
    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      console.error('Missing environment variables');
      return NextResponse.json(
        { error: 'GOOGLE_SHEETS_SPREADSHEET_ID environment variable is required.' },
        { status: 500 }
      );
    }

    const credentials: { email?: string; privateKey?: string; apiKey?: string } = {};
    
    if (process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      credentials.email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
      credentials.privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
      console.log('Using Service Account authentication');
    } else if (process.env.GOOGLE_SHEETS_API_KEY) {
      credentials.apiKey = process.env.GOOGLE_SHEETS_API_KEY;
      console.log('Using API Key authentication (read-only)');
    } else {
      return NextResponse.json(
        { error: 'Either Service Account credentials or API key must be provided.' },
        { status: 500 }
      );
    }

    console.log('Creating DataService...');
    const dataService = new DataService(
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      credentials
    );
    
    console.log('Calling getPayments...');
    const payments = await dataService.getPayments();
    console.log('Payments fetched:', payments.length, 'items');
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: `Failed to fetch payments: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      return NextResponse.json(
        { error: 'GOOGLE_SHEETS_SPREADSHEET_ID environment variable is required.' },
        { status: 500 }
      );
    }

    const credentials: { email?: string; privateKey?: string; apiKey?: string } = {};
    
    if (process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      credentials.email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
      credentials.privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    } else {
      return NextResponse.json(
        { error: 'Service Account credentials are required for recording payments.' },
        { status: 500 }
      );
    }

    const dataService = new DataService(
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      credentials
    );
    
    const body = await request.json();
    const payment = await dataService.addPayment(body);
    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
}