"use client";

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, SortAsc, SortDesc, ChevronDown, ChevronRight } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  searchPlaceholder?: string;
  onRowClick?: (row: any) => void;
  expandableRows?: boolean;
  renderExpandedRow?: (row: any) => React.ReactNode;
}

export function DataTable({
  data,
  columns,
  searchPlaceholder = "Search...",
  onRowClick,
  expandableRows = false,
  renderExpandedRow,
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const filteredData = data.filter(row =>
    Object.values(row).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const toggleRowExpansion = (rowId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      'Completed': 'default',
      'In Progress': 'secondary',
      'Not Started': 'outline',
      'On Hold': 'destructive',
      'To Do': 'outline',
      'Review': 'secondary',
      'High': 'destructive',
      'Medium': 'secondary',
      'Low': 'outline',
    };
    
    return (
      <Badge variant={variants[status] || 'default'}>
        {status}
      </Badge>
    );
  };

  const renderMobileCard = (row: any, index: number) => {
    const isExpanded = expandedRows.has(row.id);
    
    return (
      <Card key={row.id || index} className="mb-3">
        <CardContent className="p-4">
          <div 
            className="cursor-pointer"
            onClick={() => {
              if (expandableRows) {
                toggleRowExpansion(row.id);
              }
              onRowClick?.(row);
            }}
          >
            {/* Main content - show first 3-4 most important columns */}
            <div className="space-y-2">
              {columns.slice(0, 4).map((column) => {
                if (column.key === 'actions') return null;
                
                return (
                  <div key={column.key} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      {column.label}:
                    </span>
                    <div className="text-sm font-medium">
                      {column.render ? (
                        column.render(row[column.key], row)
                      ) : column.key.toLowerCase().includes('status') || 
                           column.key.toLowerCase().includes('priority') ? (
                        getStatusBadge(row[column.key])
                      ) : (
                        <span className="text-right">{row[column.key]}</span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Actions row */}
              {columns.find(col => col.key === 'actions') && (
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium text-muted-foreground">Actions:</span>
                  <div>
                    {columns.find(col => col.key === 'actions')?.render?.(null, row)}
                  </div>
                </div>
              )}
              
              {/* Expand/Collapse indicator */}
              {expandableRows && (
                <div className="flex justify-center pt-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Expanded content */}
          {expandableRows && isExpanded && renderExpandedRow && (
            <div className="mt-4 pt-4 border-t">
              {renderExpandedRow(row)}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Mobile Card Layout */}
      <div className="block lg:hidden">
        <div className="space-y-3">
          {sortedData.map((row, index) => renderMobileCard(row, index))}
        </div>
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className="font-medium whitespace-nowrap">
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        onClick={() => handleSort(column.key)}
                        className="h-auto p-0 hover:bg-transparent"
                      >
                        {column.label}
                        {sortColumn === column.key && (
                          sortDirection === 'asc' ? 
                            <SortAsc className="ml-2 h-4 w-4" /> : 
                            <SortDesc className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      column.label
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row, index) => (
                <>
                  <TableRow
                    key={row.id || index}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      expandableRows && expandedRows.has(row.id) ? 'bg-muted/30' : ''
                    }`}
                    onClick={() => {
                      if (expandableRows) {
                        toggleRowExpansion(row.id);
                      }
                      onRowClick?.(row);
                    }}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key} className="whitespace-nowrap">
                        {column.render ? (
                          column.render(row[column.key], row)
                        ) : column.key.toLowerCase().includes('status') || 
                             column.key.toLowerCase().includes('priority') ? (
                          getStatusBadge(row[column.key])
                        ) : (
                          row[column.key]
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandableRows && expandedRows.has(row.id) && renderExpandedRow && (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="p-0">
                        <div className="p-4 bg-muted/20 border-t">
                          {renderExpandedRow(row)}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}