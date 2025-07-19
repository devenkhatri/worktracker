"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Project, Task, TimeEntry, Invoice, Expense } from '@/lib/types';
import { 
  User, 
  FolderOpen, 
  CheckSquare, 
  Clock, 
  FileText, 
  Receipt,
  Eye,
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ClientPortalPage() {
  const [clientId, setClientId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clientData, setClientData] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId.trim()) {
      setError('Please enter your Client ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For demo purposes, we'll use a simple client ID validation
      // In production, you'd have proper authentication with tokens
      await fetchClientData(clientId);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Client portal login error:', err);
      setError('Invalid Client ID or access denied. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientData = async (clientId: string) => {
    try {
      // Fetch all data related to the client
      const [projectsRes, tasksRes, timeEntriesRes, invoicesRes, expensesRes, clientsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tasks'),
        fetch('/api/time-entries'),
        fetch('/api/invoices'),
        fetch('/api/expenses'),
        fetch('/api/clients')
      ]);

      if (!projectsRes.ok || !tasksRes.ok || !timeEntriesRes.ok || !invoicesRes.ok || !expensesRes.ok || !clientsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [allProjects, allTasks, allTimeEntries, allInvoices, allExpenses, allClients] = await Promise.all([
        projectsRes.json(),
        tasksRes.json(),
        timeEntriesRes.json(),
        invoicesRes.json(),
        expensesRes.json(),
        clientsRes.json()
      ]);

      // Find client data
      const client = allClients.find((c: any) => c.id === clientId);
      if (!client) {
        throw new Error('Client not found');
      }

      // Filter data for this client
      const clientProjects = allProjects.filter((p: Project) => p.clientName === client.clientName);
      const projectIds = clientProjects.map((p: Project) => p.id);
      
      const clientTasks = allTasks.filter((t: Task) => projectIds.includes(t.projectId));
      const taskIds = clientTasks.map((t: Task) => t.id);
      
      const clientTimeEntries = allTimeEntries.filter((te: TimeEntry) => projectIds.includes(te.projectId));
      const clientInvoices = allInvoices.filter((inv: Invoice) => inv.clientId === clientId);
      const clientExpenses = allExpenses.filter((exp: Expense) => exp.clientId === clientId && exp.billable);

      setClientData(client);
      setProjects(clientProjects);
      setTasks(clientTasks);
      setTimeEntries(clientTimeEntries);
      setInvoices(clientInvoices);
      setExpenses(clientExpenses);

    } catch (error) {
      console.error('Error fetching client data:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setClientId('');
    setAccessToken('');
    setClientData(null);
    setProjects([]);
    setTasks([]);
    setTimeEntries([]);
    setInvoices([]);
    setExpenses([]);
    setError(null);
  };

  // Column definitions for tables
  const projectColumns = [
    { key: 'projectName', label: 'Project Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'startDate', label: 'Start Date', sortable: true },
    { key: 'endDate', label: 'End Date', sortable: true },
    { 
      key: 'totalActualHours', 
      label: 'Hours Logged', 
      sortable: true,
      render: (value: number) => `${value}h`
    },
    { 
      key: 'totalAmount', 
      label: 'Total Value', 
      sortable: true,
      render: (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
    },
  ];

  const taskColumns = [
    { key: 'taskName', label: 'Task', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'priority', label: 'Priority', sortable: true },
    { key: 'assignedTo', label: 'Assigned To', sortable: true },
    { key: 'dueDate', label: 'Due Date', sortable: true },
    { 
      key: 'actualHours', 
      label: 'Hours', 
      sortable: true,
      render: (value: number) => `${value}h`
    },
  ];

  const invoiceColumns = [
    { key: 'invoiceNumber', label: 'Invoice #', sortable: true },
    { key: 'issueDate', label: 'Issue Date', sortable: true },
    { key: 'dueDate', label: 'Due Date', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { 
      key: 'totalAmount', 
      label: 'Total Amount', 
      sortable: true,
      render: (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
    },
    { 
      key: 'balanceAmount', 
      label: 'Balance', 
      sortable: true,
      render: (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
    },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Client Portal Access
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your Client ID to view your project progress
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div>
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter your Client ID (e.g., CLIENT-2024-123456-789)"
                required
                className="mt-1"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accessing Portal...
                </>
              ) : (
                'Access Portal'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Don't have your Client ID? Contact your project manager.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Client Portal</h1>
              <p className="text-sm text-gray-600">Welcome, {clientData?.clientName}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.filter(p => p.status === 'In Progress').length}</div>
              <p className="text-xs text-muted-foreground">
                {projects.length} total projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter(t => t.status !== 'Completed').length}</div>
              <p className="text-xs text-muted-foreground">
                {tasks.filter(t => t.status === 'Completed').length} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {timeEntries.reduce((sum, entry) => sum + entry.duration, 0).toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground">
                {timeEntries.length} time entries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {invoices.filter(inv => inv.balanceAmount > 0).length} unpaid invoices
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FolderOpen className="h-5 w-5 mr-2" />
              Your Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={projects}
              columns={projectColumns}
              searchPlaceholder="Search projects..."
            />
          </CardContent>
        </Card>

        {/* Tasks Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckSquare className="h-5 w-5 mr-2" />
              Current Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={tasks}
              columns={taskColumns}
              searchPlaceholder="Search tasks..."
            />
          </CardContent>
        </Card>

        {/* Invoices Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Your Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={invoices}
              columns={invoiceColumns}
              searchPlaceholder="Search invoices..."
            />
          </CardContent>
        </Card>

        {/* Billable Expenses Section */}
        {expenses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                Billable Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-gray-600">{expense.category} • {expense.expenseDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{expense.amount.toFixed(2)}</p>
                      <Badge variant={expense.status === 'Approved' ? 'default' : 'secondary'}>
                        {expense.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}