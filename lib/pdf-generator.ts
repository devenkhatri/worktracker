import { Invoice, Client, Project, TimeEntry } from '@/lib/types';

export interface PDFInvoiceData {
  invoice: Invoice;
  client?: Client;
  project?: Project;
  timeEntries?: TimeEntry[];
}

export function generateInvoiceHTML(data: PDFInvoiceData): string {
  const { invoice, client, project, timeEntries = [] } = data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR' 
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          line-height: 1.6;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          border-bottom: 2px solid #eee;
          padding-bottom: 20px;
        }
        .company-info {
          text-align: right;
        }
        .invoice-title {
          font-size: 36px;
          font-weight: bold;
          color: #2563eb;
          margin: 0;
        }
        .invoice-number {
          color: #666;
          margin-top: 5px;
        }
        .details-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .bill-to, .invoice-details {
          width: 45%;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
          color: #2563eb;
        }
        .time-entries-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .time-entries-table th,
        .time-entries-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .time-entries-table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .time-entries-table .text-right {
          text-align: right;
        }
        .summary-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }
        .summary-table {
          width: 300px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }
        .summary-total {
          border-top: 2px solid #333;
          font-weight: bold;
          font-size: 18px;
          padding-top: 12px;
        }
        .payment-terms {
          border-top: 1px solid #eee;
          padding-top: 20px;
          margin-top: 40px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #666;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-paid { background-color: #dcfce7; color: #166534; }
        .status-sent { background-color: #dbeafe; color: #1d4ed8; }
        .status-overdue { background-color: #fee2e2; color: #dc2626; }
        .status-draft { background-color: #f3f4f6; color: #374151; }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="header">
          <div>
            <h1 class="invoice-title">INVOICE</h1>
            <p class="invoice-number">Invoice #${invoice.invoiceNumber}</p>
          </div>
          <div class="company-info">
            <h2 style="margin: 0; font-size: 20px;">Your Company Name</h2>
            <p style="margin: 5px 0 0 0; color: #666;">
              Your Address Line 1<br>
              Your Address Line 2<br>
              City, State, PIN Code<br>
              Email: your-email@company.com<br>
              Phone: +91 XXXXX XXXXX
            </p>
          </div>
        </div>

        <!-- Details Section -->
        <div class="details-section">
          <div class="bill-to">
            <h3 class="section-title">Bill To:</h3>
            <div>
              <p style="margin: 0; font-weight: bold;">${client?.clientName || 'Client Name'}</p>
              ${client?.companyName ? `<p style="margin: 5px 0;">${client.companyName}</p>` : ''}
              ${client?.address ? `<p style="margin: 5px 0; white-space: pre-line;">${client.address}</p>` : ''}
              ${client?.contactEmail ? `<p style="margin: 5px 0;">Email: ${client.contactEmail}</p>` : ''}
              ${client?.contactPhone ? `<p style="margin: 5px 0;">Phone: ${client.contactPhone}</p>` : ''}
              ${client?.taxId ? `<p style="margin: 5px 0;">Tax ID: ${client.taxId}</p>` : ''}
            </div>
          </div>
          <div class="invoice-details">
            <h3 class="section-title">Invoice Details:</h3>
            <div>
              <p><strong>Issue Date:</strong> ${formatDate(invoice.issueDate)}</p>
              <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
              <p><strong>Status:</strong> 
                <span class="status-badge status-${invoice.status.toLowerCase().replace(' ', '-')}">${invoice.status}</span>
              </p>
              ${project ? `<p><strong>Project:</strong> ${project.projectName}</p>` : ''}
            </div>
          </div>
        </div>

        <!-- Time Entries Table -->
        ${timeEntries.length > 0 ? `
        <div>
          <h3 class="section-title">Time Entries</h3>
          <table class="time-entries-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th class="text-right">Hours</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${timeEntries.map(entry => `
                <tr>
                  <td>${formatDate(entry.date)}</td>
                  <td>${entry.description || 'Time entry'}</td>
                  <td class="text-right">${entry.duration.toFixed(2)}</td>
                  <td class="text-right">₹${project?.perHourRate || 0}</td>
                  <td class="text-right">₹${(entry.duration * (project?.perHourRate || 0)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Summary Section -->
        <div class="summary-section">
          <div class="summary-table">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(invoice.subtotal)}</span>
            </div>
            <div class="summary-row">
              <span>Tax (${(invoice.taxRate * 100).toFixed(0)}%):</span>
              <span>${formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div class="summary-row summary-total">
              <span>Total:</span>
              <span>${formatCurrency(invoice.totalAmount)}</span>
            </div>
            ${invoice.paidAmount > 0 ? `
            <div class="summary-row" style="color: #16a34a;">
              <span>Paid:</span>
              <span>-${formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div class="summary-row summary-total" style="color: #dc2626;">
              <span>Balance Due:</span>
              <span>${formatCurrency(invoice.balanceAmount)}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Payment Terms -->
        <div class="payment-terms">
          <h3 class="section-title">Payment Terms</h3>
          <p>Payment is due within ${client?.paymentTerms || 30} days of invoice date.</p>
          <p>Please include the invoice number with your payment.</p>
          ${invoice.notes ? `
          <div style="margin-top: 20px;">
            <h4>Notes:</h4>
            <p style="font-size: 14px;">${invoice.notes}</p>
          </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}