"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ExpenseForm } from '@/components/expense-form';
import { ConfigVerification } from '@/components/config-verification';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Expense, Project, Client } from '@/lib/types';
import { Plus, Loader2, AlertCircle, Receipt } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [configValid, setConfigValid] = useState<boolean | null>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Expenses: Starting data fetch...');
        const [expensesResponse, projectsResponse, clientsResponse] = await Promise.all([
          fetch('/api/expenses'),
          fetch('/api/projects'),
          fetch('/api/clients')
        ]);

        console.log('Expenses: Response statuses:', {
          expenses: expensesResponse.status,
          projects: projectsResponse.status,
          clients: clientsResponse.status
        });

        if (!expensesResponse.ok || !projectsResponse.ok || !clientsResponse.ok) {
          const expensesError = !expensesResponse.ok ? await expensesResponse.text() : null;
          const projectsError = !projectsResponse.ok ? await projectsResponse.text() : null;
          const clientsError = !clientsResponse.ok ? await clientsResponse.text() : null;
          console.error('Expenses: API errors:', { expensesError, projectsError, clientsError });
          
          const errorText = expensesError || projectsError || clientsError || '';
          if (errorText.includes('configuration') || errorText.includes('environment')) {
            setConfigValid(false);
            setError('Configuration issue detected. Please verify your Google Sheets setup.');
          } else {
            throw new Error(`Failed to fetch data: ${errorText}`);
          }
          return;
        }

        const expensesData = await expensesResponse.json();
        const projectsData = await projectsResponse.json();
        const clientsData = await clientsResponse.json();

        console.log('Expenses: Data received:', {
          expensesCount: expensesData.length,
          projectsCount: projectsData.length,
          clientsCount: clientsData.length
        });

        setExpenses(expensesData);
        setProjects(projectsData);
        setClients(clientsData);
        setConfigValid(true);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setConfigValid(false);
        setError(err instanceof Error ? err.message : 'Failed to load expenses. Please check your Google Sheets configuration.');
      } finally {
        setLoading(false);
      }
    };

    console.log('Expenses: Starting fetch, configValid:', configValid);
    fetchData();
  }, []);

  const handleConfigurationChange = (isValid: boolean) => {
    console.log('Expenses: Configuration changed to:', isValid);
    setConfigValid(isValid);
    if (isValid) {
      setLoading(true);
      setError(null);
      window.location.reload(); // Simple refresh for now
    }
  };

  const handleCreateExpense = async (expenseData: Omit<Expense, 'id' | 'submittedDate'>) => {
    try {
      if (editingExpense) {
        console.log('Updating expense with data:', expenseData);
        // TODO: Implement expense update API
        setError('Expense editing not yet implemented');
        return;
      } else {
        console.log('Creating expense with data:', expenseData);
        const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(expenseData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Expense creation failed:', errorText);
          
          let errorMessage = 'Failed to create expense';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorText;
          } catch {
            errorMessage = errorText || 'Failed to create expense';
          }
          
          throw new Error(errorMessage);
        }

        const newExpense = await response.json();
        setExpenses(prev => [...prev, newExpense]);
      }
      
      setShowForm(false);
      setEditingExpense(null);
    } catch (err) {
      console.error('Error saving expense:', err);
      setError(editingExpense ? 'Failed to update expense. Please try again.' : 'Failed to create expense. Please try again.');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingExpense(null);
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.projectName : 'Unknown Project';
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.clientName : 'Unknown Client';
  };

  const columns = [
    { key: 'expenseDate', label: 'Date', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'description', label: 'Description', sortable: true },
    { 
      key: 'amount', 
      label: 'Amount', 
      sortable: true,
      render: (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
    },
    { 
      key: 'projectId', 
      label: 'Project', 
      sortable: true,
      render: (value: string) => getProjectName(value)
    },
    { 
      key: 'clientId', 
      label: 'Client', 
      sortable: true,
      render: (value: string) => getClientName(value)
    },
    { key: 'status', label: 'Status', sortable: true },
    { 
      key: 'billable', 
      label: 'Billable', 
      sortable: true,
      render: (value: boolean) => value ? 'Yes' : 'No'
    },
    { key: 'submittedBy', label: 'Submitted By', sortable: true },
  ];

  const renderExpandedRow = (expense: Expense) => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Expense Details</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Reimbursable:</span> {expense.reimbursable ? 'Yes' : 'No'}</p>
              <p><span className="font-medium">Submitted:</span> {expense.submittedDate}</p>
              {expense.approvedBy && (
                <>
                  <p><span className="font-medium">Approved By:</span> {expense.approvedBy}</p>
                  <p><span className="font-medium">Approved Date:</span> {expense.approvedDate}</p>
                </>
              )}
              {expense.receiptUrl && (
                <p>
                  <span className="font-medium">Receipt:</span>{' '}
                  <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View Receipt
                  </a>
                </p>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Notes</h4>
            <p className="text-sm text-muted-foreground break-words">
              {expense.notes || 'No notes available'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm sm:text-base">Loading expenses...</p>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none pb-4 mb-6 lg:pb-0 lg:mb-0 lg:static">
          <div className="pt-12 lg:pt-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {editingExpense ? 'Update expense information' : 'Record a new project expense'}
            </p>
          </div>
        </div>

        <ExpenseForm
          onSubmit={handleCreateExpense}
          onCancel={handleCancelEdit}
          projects={projects}
          clients={clients}
          initialData={editingExpense || undefined}
          isEditing={!!editingExpense}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none pb-4 mb-6 lg:pb-0 lg:mb-0 lg:static">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-12 lg:pt-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center space-x-2">
              <Receipt className="h-6 w-6 sm:h-8 sm:w-8" />
              <span>Expenses</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Track and manage project expenses
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {configValid === false && (
        <ConfigVerification onConfigurationValid={handleConfigurationChange} />
      )}

      {configValid === true && expenses.length === 0 && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">No Expenses Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              No expenses have been recorded yet.
            </p>
            <div className="mt-4">
              <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Expense
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        data={expenses}
        columns={columns}
        searchPlaceholder="Search expenses..."
        expandableRows
        renderExpandedRow={renderExpandedRow}
      />
    </div>
  );
}