import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from './card';
import { Input } from './input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T = any> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  emptyState?: React.ReactNode;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  showPagination?: boolean;
  rowProps?: (row: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
}

export function DataTable<T = any>({
  data,
  columns,
  onSort,
  sortKey,
  sortDirection,
  emptyState,
  className,
  searchable = false,
  searchPlaceholder = "Search...",
  pageSize = 10,
  showPagination = false,
  rowProps
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const getSortIcon = (field: string) => {
      if (sortKey !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-quaternary transition" />;
      return sortDirection === 'asc' 
        ? <ArrowUp className="h-3.5 w-3.5 text-brand stroke-[2.5px]" /> 
        : <ArrowDown className="h-3.5 w-3.5 text-brand stroke-[2.5px]" />;
  };

  const handleSort = (key: string, sortable?: boolean) => {
    if (sortable && onSort) {
      onSort(key);
    }
  };

  const filteredData = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    if (!searchable || !searchTerm) return safeData;
    return safeData.filter((row: any) => 
      columns.some(column => {
        const value = row[column.key];
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns, searchable]);

  const paginatedData = useMemo(() => {
    if (!showPagination) return filteredData;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-placeholder h-4 w-4 pointer-events-none" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  column.sortable ? 'cursor-pointer select-none hover:text-primary transition-colors' : '',
                  column.className || ''
                )}
                onClick={() => handleSort(column.key, column.sortable)}
              >
                <div className="flex items-center gap-1.5">
                  {column.header}
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.length > 0 ? (
            paginatedData.map((row, index) => (
              <TableRow 
                key={(row as any).id || index}
                {...(rowProps ? rowProps(row, index) : {})}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.render
                      ? column.render((row as any)[column.key], row, index)
                      : (row as any)[column.key] !== undefined && (row as any)[column.key] !== null
                        ? String((row as any)[column.key])
                        : '-'
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyState || (
                  <div className="flex flex-col items-center justify-center text-center py-6">
                    <p className="text-sm text-tertiary">
                      {searchTerm ? 'No results found.' : 'No records available.'}
                    </p>
                  </div>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-secondary pt-4">
          <div className="text-sm text-tertiary">
            Showing <span className="font-semibold text-primary">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-semibold text-primary">{Math.min(currentPage * pageSize, filteredData.length)}</span> of <span className="font-semibold text-primary">{filteredData.length}</span> results
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-primary bg-primary border border-secondary rounded-lg shadow-xs hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="h-4 w-4 text-quaternary" />
              Previous
            </button>
            <div className="hidden md:flex items-center gap-0.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                )
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span key={`ellipsis-${page}`} className="px-2 text-quaternary select-none">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(page)}
                      className={cn(
                        "w-9 h-9 flex items-center justify-center text-sm font-medium rounded-lg transition",
                        currentPage === page
                          ? "bg-secondary text-primary font-semibold border border-secondary"
                          : "text-quaternary hover:bg-secondary"
                      )}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))
              }
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-primary bg-primary border border-secondary rounded-lg shadow-xs hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
              <ChevronRight className="h-4 w-4 text-quaternary" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}