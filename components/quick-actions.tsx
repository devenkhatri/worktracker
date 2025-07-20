"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FolderPlus, 
  CheckSquare, 
  Clock, 
  Users, 
  FileText, 
  Receipt, 
  CreditCard, 
  BarChart3, 
  Download, 
  Settings,
  Kanban,
  Timer,
  Plus,
  Loader2
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  category: 'core' | 'management' | 'financial' | 'analytics' | 'tools';
  color: string;
  bgColor: string;
}

const quickActions: QuickAction[] = [
  // Core Actions
  {
    id: 'create-project',
    title: 'Create Project',
    description: 'Start tracking a new project',
    icon: FolderPlus,
    href: '/projects',
    category: 'core',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100'
  },
  {
    id: 'add-task',
    title: 'Add Task',
    description: 'Create a new task for existing projects',
    icon: CheckSquare,
    href: '/tasks',
    category: 'core',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100'
  },
  {
    id: 'log-time',
    title: 'Log Time',
    description: 'Track time spent on tasks',
    icon: Clock,
    href: '/time-tracking',
    category: 'core',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100'
  },
  {
    id: 'start-timer',
    title: 'Start Timer',
    description: 'Begin real-time time tracking',
    icon: Timer,
    href: '/time-tracking',
    category: 'core',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100'
  },
  
  // Management Actions
  {
    id: 'manage-clients',
    title: 'Manage Clients',
    description: 'Add or update client information',
    icon: Users,
    href: '/clients',
    category: 'management',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100'
  },
  {
    id: 'kanban-board',
    title: 'Kanban Board',
    description: 'Visual task management board',
    icon: Kanban,
    href: '/kanban',
    category: 'management',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 hover:bg-teal-100'
  },
  
  // Financial Actions
  {
    id: 'create-invoice',
    title: 'Create Invoice',
    description: 'Generate invoice for completed work',
    icon: FileText,
    href: '/invoices',
    category: 'financial',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100'
  },
  {
    id: 'add-expense',
    title: 'Add Expense',
    description: 'Record project-related expenses',
    icon: Receipt,
    href: '/expenses',
    category: 'financial',
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100'
  },
  {
    id: 'record-payment',
    title: 'Record Payment',
    description: 'Track payments received from clients',
    icon: CreditCard,
    href: '/payments',
    category: 'financial',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100'
  },
  
  // Analytics & Tools
  {
    id: 'view-reports',
    title: 'View Reports',
    description: 'Analytics and performance insights',
    icon: BarChart3,
    href: '/reports',
    category: 'analytics',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 hover:bg-cyan-100'
  },
  {
    id: 'export-data',
    title: 'Export Data',
    description: 'Export data to various formats',
    icon: Download,
    href: '/export',
    category: 'tools',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 hover:bg-gray-100'
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure application settings',
    icon: Settings,
    href: '/config',
    category: 'tools',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 hover:bg-slate-100'
  }
];

const categories = [
  { id: 'core', name: 'Core Actions', description: 'Essential project management tasks' },
  { id: 'management', name: 'Management', description: 'Team and client management' },
  { id: 'financial', name: 'Financial', description: 'Billing and expense tracking' },
  { id: 'analytics', name: 'Analytics', description: 'Reports and insights' },
  { id: 'tools', name: 'Tools', description: 'Utilities and configuration' }
];

export function QuickActions() {
  const router = useRouter();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleActionClick = async (action: QuickAction) => {
    setLoadingStates(prev => ({ ...prev, [action.id]: true }));
    
    // Simulate a small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Navigate to the page
    router.push(action.href);
    
    // Reset loading state after navigation
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [action.id]: false }));
    }, 1000);
  };

  const filteredActions = selectedCategory === 'all' 
    ? quickActions 
    : quickActions.filter(action => action.category === selectedCategory);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Quick Actions</span>
          <div className="flex space-x-1">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="text-xs"
            >
              All
            </Button>
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="text-xs"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredActions.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              onClick={() => handleActionClick(action)}
              disabled={loadingStates[action.id]}
              className={`w-full justify-start p-3 h-auto border rounded-lg transition-all duration-200 ${action.bgColor}`}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className={`p-2 rounded-full ${action.bgColor.replace('hover:', '')}`}>
                  {loadingStates[action.id] ? (
                    <Loader2 className={`h-4 w-4 animate-spin ${action.color}`} />
                  ) : (
                    <action.icon className={`h-4 w-4 ${action.color}`} />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-muted-foreground">{action.description}</div>
                </div>
                {loadingStates[action.id] && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </Button>
          ))}
        </div>
        
        {selectedCategory !== 'all' && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {categories.find(c => c.id === selectedCategory)?.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 