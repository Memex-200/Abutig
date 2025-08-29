import React from "react";
import { cn } from "../../utils/cn";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (column: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
  selectedRow?: T;
}

function Table<T extends Record<string, any>>({
  data,
  columns,
  sortColumn,
  sortDirection,
  onSort,
  loading = false,
  emptyMessage = "لا توجد بيانات",
  className,
  onRowClick,
  selectedRow,
}: TableProps<T>) {
  const handleSort = (column: Column<T>) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-200 h-8 rounded mb-2"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-12 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider",
                  column.sortable && "cursor-pointer hover:bg-gray-100",
                  column.width
                )}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center justify-end space-x-1 space-x-reverse">
                  <span>{column.header}</span>
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={index}
                className={cn(
                  "hover:bg-gray-50 transition-colors duration-150",
                  onRowClick && "cursor-pointer",
                  selectedRow === row && "bg-blue-50 border-r-4 border-blue-500"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export { Table };
