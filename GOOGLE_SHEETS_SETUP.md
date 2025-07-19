# Google Sheets Setup for Client & Invoice Management

## 📋 **New Worksheets Required**

You need to add the following new worksheets to your existing Google Sheets spreadsheet to support the Client & Invoice Management features:

### **1. Clients Worksheet**

Create a new worksheet named **"Clients"** with the following headers in Row 1:

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Client ID | Client Name | Contact Email | Contact Phone | Address | Company Name | Tax ID | Payment Terms | Hourly Rate | Status | Created Date | Notes |

**Column Details:**
- **A (Client ID)**: Auto-generated unique identifier (e.g., CLIENT-2024-123456-789)
- **B (Client Name)**: Full name of the client contact person
- **C (Contact Email)**: Primary email address for the client
- **D (Contact Phone)**: Phone number for the client
- **E (Address)**: Full address of the client
- **F (Company Name)**: Name of the client's company/organization
- **G (Tax ID)**: Tax identification number (GST, VAT, etc.)
- **H (Payment Terms)**: Number of days for payment (e.g., 30)
- **I (Hourly Rate)**: Default hourly rate for this client (in INR)
- **J (Status)**: Active or Inactive
- **K (Created Date)**: Date when client was added (YYYY-MM-DD format)
- **L (Notes)**: Additional notes about the client

### **2. Invoices Worksheet**

Create a new worksheet named **"Invoices"** with the following headers in Row 1:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Invoice ID | Invoice Number | Client ID | Project ID | Issue Date | Due Date | Status | Subtotal | Tax Rate | Tax Amount | Total Amount | Paid Amount | Balance Amount | Payment Date | Notes | Created By | Created Date |

**Column Details:**
- **A (Invoice ID)**: Auto-generated unique identifier (e.g., INV-2024-123456-789)
- **B (Invoice Number)**: Human-readable invoice number (e.g., INV-2024-000001)
- **C (Client ID)**: Reference to Client ID from Clients worksheet
- **D (Project ID)**: Reference to Project ID from Projects worksheet
- **E (Issue Date)**: Date when invoice was issued (YYYY-MM-DD format)
- **F (Due Date)**: Date when payment is due (YYYY-MM-DD format)
- **G (Status)**: Draft, Sent, Paid, Overdue, or Cancelled
- **H (Subtotal)**: Amount before tax (in INR)
- **I (Tax Rate)**: Tax rate as decimal (e.g., 0.18 for 18%)
- **J (Tax Amount)**: Calculated tax amount (in INR)
- **K (Total Amount)**: Subtotal + Tax Amount (in INR)
- **L (Paid Amount)**: Amount already paid (in INR)
- **M (Balance Amount)**: Remaining amount to be paid (in INR)
- **N (Payment Date)**: Date when payment was received (YYYY-MM-DD format)
- **O (Notes)**: Additional notes about the invoice
- **P (Created By)**: User who created the invoice
- **Q (Created Date)**: Timestamp when invoice was created

### **3. Expenses Worksheet**

Create a new worksheet named **"Expenses"** with the following headers in Row 1:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Expense ID | Project ID | Client ID | Expense Date | Category | Description | Amount | Receipt URL | Billable | Reimbursable | Status | Submitted By | Submitted Date | Approved By | Approved Date | Notes |

**Column Details:**
- **A (Expense ID)**: Auto-generated unique identifier (e.g., EXP-123456-789)
- **B (Project ID)**: Reference to Project ID from Projects worksheet
- **C (Client ID)**: Reference to Client ID from Clients worksheet
- **D (Expense Date)**: Date when expense was incurred (YYYY-MM-DD format)
- **E (Category)**: Travel, Materials, Software, Equipment, or Other
- **F (Description)**: Description of the expense
- **G (Amount)**: Expense amount (in INR)
- **H (Receipt URL)**: URL to receipt image/document (optional)
- **I (Billable)**: TRUE or FALSE - whether expense can be billed to client
- **J (Reimbursable)**: TRUE or FALSE - whether expense should be reimbursed
- **K (Status)**: Pending, Approved, Rejected, or Reimbursed
- **L (Submitted By)**: User who submitted the expense
- **M (Submitted Date)**: Timestamp when expense was submitted
- **N (Approved By)**: User who approved the expense (optional)
- **O (Approved Date)**: Date when expense was approved (optional)
- **P (Notes)**: Additional notes about the expense

### **4. Payments Worksheet**

Create a new worksheet named **"Payments"** with the following headers in Row 1:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| Payment ID | Invoice ID | Payment Date | Amount | Payment Method | Reference Number | Notes | Recorded By | Recorded Date |

**Column Details:**
- **A (Payment ID)**: Auto-generated unique identifier (e.g., PAY-123456-789)
- **B (Invoice ID)**: Reference to Invoice ID from Invoices worksheet
- **C (Payment Date)**: Date when payment was received (YYYY-MM-DD format)
- **D (Amount)**: Payment amount (in INR)
- **E (Payment Method)**: Cash, Check, Bank Transfer, Credit Card, PayPal, or Other
- **F (Reference Number)**: Transaction reference number
- **G (Notes)**: Additional notes about the payment
- **H (Recorded By)**: User who recorded the payment
- **I (Recorded Date)**: Timestamp when payment was recorded

## 🔧 **Setup Instructions**

### **Step 1: Add New Worksheets**
1. Open your existing Google Sheets spreadsheet
2. Right-click on the worksheet tabs at the bottom
3. Select "Insert sheet" for each new worksheet
4. Name them exactly as specified: "Clients", "Invoices", "Expenses", "Payments"

### **Step 2: Add Headers**
1. For each new worksheet, add the headers in Row 1 exactly as shown above
2. Make sure the column order matches exactly
3. You can format the header row (bold, background color) for better visibility

### **Step 3: Set Column Formatting (Optional)**
- **Date columns**: Format as Date (Format → Number → Date)
- **Amount columns**: Format as Currency (Format → Number → Currency → Indian Rupee)
- **Boolean columns**: Use Data Validation with TRUE/FALSE options
- **Status columns**: Use Data Validation with dropdown lists

### **Step 4: Verify Permissions**
- Ensure your Service Account email has "Editor" access to the spreadsheet
- Test that the application can read from and write to the new worksheets

## 📊 **Data Relationships**

The new worksheets integrate with existing data:

- **Clients** → **Projects** (via Client Name matching)
- **Projects** → **Invoices** (via Project ID)
- **Clients** → **Invoices** (via Client ID)
- **Projects** → **Expenses** (via Project ID)
- **Clients** → **Expenses** (via Client ID)
- **Invoices** → **Payments** (via Invoice ID)

## 🚀 **Features Enabled**

Once setup is complete, you'll have access to:

✅ **Client Management**: Add, view, and manage client information  
✅ **Invoice Generation**: Automatically create invoices from time entries  
✅ **Expense Tracking**: Record and categorize project expenses  
✅ **Payment Tracking**: Monitor invoice payments and outstanding balances  
✅ **Financial Reporting**: Enhanced reporting with client and financial data  

## 🔍 **Testing**

After setup, test the features:

1. **Add a Client**: Go to /clients and add a new client
2. **Generate Invoice**: Go to /invoices and generate an invoice for a project
3. **Add Expense**: Go to /expenses and record a project expense
4. **Verify Data**: Check that data appears correctly in your Google Sheets

## 📞 **Support**

If you encounter issues:
- Verify worksheet names match exactly (case-sensitive)
- Check that all required columns are present
- Ensure Service Account has proper permissions
- Review browser console for detailed error messages

---

*Last Updated: [Current Date]*  
*Version: 1.0*