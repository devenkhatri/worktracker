"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  CheckCircle, 
  Clock, 
  IndianRupee, 
  TrendingUp, 
  Users,
  Calendar,
  Target
} from 'lucide-react';
import { DashboardStats } from '@/lib/types';

interface DashboardStatsProps {
  stats: DashboardStats;
}

export function DashboardStatsComponent({ stats }: DashboardStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const statCards = [
    {
      title: 'Total Projects',
      value: stats.totalProjects,
      icon: FolderOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Completed Projects',
      value: stats.completedProjects,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Completed Tasks',
      value: stats.completedTasks,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Hours Logged',
      value: formatHours(stats.totalHoursLogged),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: IndianRupee,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Avg Completion',
      value: formatPercentage(stats.avgProjectCompletion),
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.title === 'Active Projects' && stats.totalProjects > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                <Badge variant="secondary" className="text-xs">
                  {formatPercentage((stats.activeProjects / stats.totalProjects) * 100)} active
                </Badge>
              </div>
            )}
            {stat.title === 'Completed Tasks' && stats.totalTasks > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                <Badge variant="secondary" className="text-xs">
                  {formatPercentage((stats.completedTasks / stats.totalTasks) * 100)} complete
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}