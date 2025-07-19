import { NextRequest, NextResponse } from 'next/server';
import DataService from '@/lib/data-service';
import { generateInvoiceHTML } from '@/lib/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    
    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
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
      return NextResponse.json(
        { error: 'Google Sheets configuration is incomplete' },
        { status: 500 }
      );
    }

    const dataService = new DataService(spreadsheetId, credentials);
    
    // Get invoice data
    const invoices = await dataService.getInvoices();
    const invoice = invoices.find(inv => inv.id === invoiceId);
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Get related data
    const [clients, projects, timeEntries] = await Promise.all([
      dataService.getClients(),
      dataService.getProjects(),
      dataService.getTimeEntries()
    ]);

    const client = clients.find(c => c.id === invoice.clientId);
    const project = projects.find(p => p.id === invoice.projectId);
    const invoiceTimeEntries = timeEntries.filter(te => te.projectId === invoice.projectId);

    // Generate HTML
    const html = generateInvoiceHTML({
      invoice,
      client,
      project,
      timeEntries: invoiceTimeEntries
    });

    // For now, return HTML (in production, you'd use a library like Puppeteer to generate PDF)
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.html"`
      }
    });

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    );
  }
}