# WorkTracker - Project Management System

A comprehensive work tracking application built with Next.js that integrates with Google Sheets for project workflows, task assignments, and time tracking.

## Features

- **Project Management**: Create and track projects with client information, budgets, and timelines
- **Task Assignment**: Assign tasks to team members with priorities and due dates
- **Kanban Board**: Visual task management with drag-and-drop functionality and detailed task views
- **Real-Time Time Tracking**: Floating timer with pause/resume functionality and automatic data refresh
- **Google Sheets Integration**: Real-time synchronization with Google Sheets for all data operations
- **Dashboard Analytics**: Visual insights into project progress and team performance with recent activity feed
- **User Authentication**: Secure login system with session management and last login tracking
- **Activity Tracking**: Comprehensive audit trail of all system activities and changes
- **Export Functionality**: Export data in CSV or JSON formats with filtering options
- **Client & Invoice Management**: Complete invoicing system with client portal access
- **Expense Tracking**: Track and categorize project expenses with approval workflows
- **Payment Management**: Record payments and automatically update invoice balances
- **Financial Reporting**: Comprehensive financial reports and analytics
- **Invoice Preview & PDF**: Generate professional invoices with preview and PDF export
- **Currency Support**: Full Indian Rupee (INR) support with proper formatting
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Charts**: Recharts for data visualization
- **Drag & Drop**: Native HTML5 API (with optional @hello-pangea/dnd support)
- **Backend**: Next.js API routes with middleware authentication
- **Database**: Google Sheets API integration with real-time sync
- **Authentication**: Session-based with HTTP-only cookies
- **Icons**: Lucide React
- **Currency**: Indian Rupee (INR) formatting and calculations

## New Features (Latest Update)

### **Client & Invoice Management System**
- **Client Management**: Complete client database with contact information, payment terms, and billing rates
- **Invoice Generation**: Automatic invoice creation from unbilled time entries with tax calculations
- **Invoice Preview & PDF**: Professional invoice preview with PDF export functionality
- **Smart Billing**: Tracks billed vs unbilled hours, prevents double billing
- **Payment Tracking**: Record payments and automatically update invoice balances
- **Client Portal**: Dedicated client access to view project progress and invoices

### **Expense Management**
- **Expense Tracking**: Categorize and track project expenses with receipt management
- **Approval Workflow**: Expense approval process with status tracking
- **Billable Expenses**: Mark expenses as billable to clients for invoice inclusion

### **Enhanced Financial Reporting**
- **Revenue Analytics**: Track revenue by client, project, and time period
- **Outstanding Balances**: Monitor unpaid invoices and payment status
- **Expense Analysis**: Categorized expense reporting and analysis
- **Monthly Trends**: Revenue and expense trends over time
- **Profitability Reports**: Project and client profitability analysis

## Google Sheets Setup

### 1. Authentication Setup

**IMPORTANT**: This application supports two authentication methods:

#### Option A: Service Account Authentication (Recommended)
**Provides full read/write access to Google Sheets**

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API
4. Go to "Credentials" → "Create Credentials" → "Service Account"
5. Fill in the service account details and create
6. Click on the created service account
7. Go to the "Keys" tab → "Add Key" → "Create New Key" → "JSON"
8. Download the JSON key file
9. Extract the `client_email` and `private_key` from the JSON file
10. Share your Google Sheet with the service account email
11. Give the service account "Editor" permissions on your sheet

#### Option B: API Key Authentication (Read-Only)
**Only provides read access - cannot create, update, or delete data**

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API
4. Create credentials (API Key)
5. Copy your API key
6. Make your Google Sheet publicly viewable (Share → Anyone with the link can view)

**Note**: API key authentication is suitable for read-only dashboards and reports, but you'll need Service Account authentication for full functionality.

### 2. Create Your Google Sheet

Create a new Google Sheet with the following worksheets:

#### Projects Sheet
Headers (Row 1):
```
Project ID | Project Name | Client Name | Project Description | Start Date | End Date | Status | Budget | Per Hour Rate | Total Estimated Hours | Total Actual Hours | Total Billed Hours | Total Amount
```

#### Tasks Sheet
Headers (Row 1):
```
Task ID | Project ID | Task Name | Task Description | Assigned To | Priority | Status | Estimated Hours | Actual Hours | Billed Hours | Project Per Hour Rate | Task Per Hour Rate | Calculated Amount | Due Date | Artifacts
```

#### TimeEntries Sheet
Headers (Row 1):
```
Time Entry ID | Project ID | Task ID | Date | Start Time | End Time | Duration | Description/Notes | User/Employee Name
```

#### Activities Sheet
Headers (Row 1):
```
Activity ID | Timestamp | Type | Description | Entity ID | Entity Name | User Name | Metadata
```

#### Users Sheet
Headers (Row 1):
```
Username | Password | Last Login
```

**Note**: Add user credentials to this sheet for authentication. Each row should contain a username and password combination. The Last Login column will be automatically updated when users log in.

### 3. Get Your Spreadsheet ID

1. Open your Google Sheet
2. Copy the ID from the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. The spreadsheet ID is the long string between `/d/` and `/edit`

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd worktracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your Google Sheets credentials:

**For Service Account Authentication (Recommended):**
```
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
```

**For API Key Authentication (Read-Only):**
```
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key_here
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
```

**Important Notes:**
- The private key should include the `\n` characters as literal text in the environment variable
- If using Service Account, do not set the API key variable
- If using API key, do not set the Service Account variables
5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Creating Projects
1. Navigate to the Projects page
2. Click "Create Project"
3. Fill in project details including client information, budget, and timeline
4. The system will auto-generate a unique Project ID

### Managing Tasks
1. Go to the Tasks page
2. Click "Create Task"
3. Select a project and fill in task details
4. Tasks are automatically linked to projects with referential integrity

### Kanban Board
1. Navigate to the Kanban page
2. Select a project from the dropdown
3. View all project tasks in a visual Kanban board with 4 columns (To Do, In Progress, Review, Completed)
4. Drag and drop tasks between columns to change their status
5. Double-click any task card to view detailed task information
6. Status changes are automatically saved to Google Sheets
7. Activity is logged for all status changes

### Time Tracking
1. **Real-Time Timer (Recommended)**:
   - Use the floating timer button (bottom-right corner) available on all pages
   - Select project and task from dropdowns
   - Click "Start" to begin real-time timing
   - Use "Pause/Resume" as needed during work
   - Click "Stop" to automatically log time (minimum 1 minute, rounded to nearest minute)
   - Data automatically refreshes after logging
2. **Manual Entry**:
   - Navigate to Time Tracking page and click "Manual Entry"
   - Select project and task
   - Enter start/end times (duration is auto-calculated)
   - Add description of work performed
3. **View Time Entries**:
   - See recent time entries with project/task context
   - View time tracking statistics and weekly summaries

### Viewing Reports
1. Go to the Reports page
2. Use filters to view specific projects or all data
3. View charts for project status, task priorities, and revenue analysis
4. Export reports as needed

### User Authentication
1. **Login**: Access the application using credentials stored in the Users sheet
2. **Session Management**: Secure 24-hour sessions with automatic expiration
3. **User Profile**: View login history and session information
4. **Last Login Tracking**: Automatic tracking of user login times
5. **Logout**: Secure session termination

### Exporting Data
1. Visit the Export page
2. Select project filter and export format (CSV or JSON)
3. Choose which data types to include
4. Download your data

## Data Relationships

The application maintains referential integrity between:
- Projects → Tasks (one-to-many)
- Tasks → Time Entries (one-to-many)
- Projects → Time Entries (through tasks)

## Auto-Calculations

- **Project Total Actual Hours**: Sum of actual hours from all tasks
- **Project Total Amount**: Total billed hours × per hour rate
- **Task Actual Hours**: Sum of time entries for that task
- **Task Calculated Amount**: Billed hours × task per hour rate
- **Time Entry Duration**: Auto-calculated from start/end times

## Key Features & Improvements

### Real-Time Time Tracking
- **Floating Timer Button**: Always accessible from any page (bottom-right corner)
- **Live Timer**: Real-time countdown with pause/resume functionality
- **Minimum Time Validation**: Ensures at least 1 minute is tracked
- **Automatic Data Refresh**: Latest time entries appear immediately after logging
- **Session Persistence**: Timer state maintained during navigation

### Enhanced Kanban Board
- **Drag & Drop**: Move tasks between status columns (To Do → In Progress → Review → Completed)
- **Task Details**: Double-click any task card to view comprehensive task information
- **Real-Time Updates**: Status changes immediately sync to Google Sheets
- **Visual Feedback**: Color-coded columns and priority indicators
- **Progress Tracking**: Visual progress bars and completion percentages

### Advanced Authentication
- **Secure Sessions**: HTTP-only cookies with 24-hour expiration
- **Login Tracking**: Automatic last login timestamp updates
- **User Profiles**: View login history and session information
- **Route Protection**: Middleware-based authentication for all protected routes
- **Session Management**: Automatic cleanup and renewal

### Activity & Audit Trail
- **Comprehensive Logging**: All actions (create, update, status changes) are logged
- **Real-Time Activity Feed**: Recent activities displayed on dashboard
- **User Attribution**: Track who performed each action
- **Detailed Context**: Full information about what changed and when

### Currency & Localization
- **Indian Rupee Support**: Full INR formatting with proper number localization
- **Rate Calculations**: Project and task-specific hourly rates
- **Financial Tracking**: Automatic amount calculations and revenue reporting
- **Localized Formatting**: Indian number formatting (lakhs, crores)

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Deploy to Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS
- DigitalOcean
- Railway
- Render

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Application Architecture

### Frontend Architecture
- **Next.js App Router**: Modern React framework with server-side rendering
- **Component Structure**: Modular components with clear separation of concerns
- **State Management**: React hooks with optimistic updates
- **Authentication Context**: Global auth state management
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Backend Architecture
- **API Routes**: RESTful endpoints for all data operations
- **Middleware**: Route protection and session validation
- **Data Service Layer**: Abstracted Google Sheets operations
- **Error Handling**: Comprehensive error handling with user feedback
- **Activity Logging**: Automatic audit trail for all operations

### Data Flow
1. **User Actions** → Frontend Components
2. **API Calls** → Next.js API Routes
3. **Data Processing** → DataService Layer
4. **Google Sheets** → Real-time synchronization
5. **Activity Logging** → Audit trail creation
6. **UI Updates** → Optimistic updates with error handling

### Security Features
- **Session-based Authentication**: Secure HTTP-only cookies
- **Route Protection**: Middleware-based access control
- **Input Validation**: Client and server-side validation
- **Error Handling**: Secure error messages without data exposure
- **CSRF Protection**: Built-in Next.js CSRF protection

## Support

If you encounter any issues:
1. **"Permission denied" or "Failed to append data" errors**: 
   - If using API key: This is expected - API keys only allow read access. Upgrade to Service Account credentials for write operations.
   - If using Service Account: Ensure the service account email has been granted "Editor" access to your Google Sheet.
2. **"Sheet not found" errors**: Verify that your Google Sheet has worksheets named exactly "Projects", "Tasks", "TimeEntries", "Activities", and "Users" with the correct headers.
3. **"Invalid range" errors**: Check that your worksheet names match exactly and don't have extra spaces or special characters.
4. **Authentication errors**: 
   - For Service Account: Check that the email and private key are correctly formatted in your environment variables
   - For API Key: Verify the key is valid and the sheet is publicly accessible
5. **Private key format issues**: Ensure the private key includes literal `\n` characters in the environment variable