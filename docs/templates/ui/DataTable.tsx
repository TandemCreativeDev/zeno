// @ts-nocheck

"use client";

import { useState, useMemo } from "react";
import { TableCell } from "./TableCell";

export interface ColumnDef<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  formatter?: "currency" | "date" | "datetime" | "boolean" | "text";
  prefix?: string;
  suffix?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchFields?: (keyof T)[];
  sortField?: keyof T;
  sortOrder?: "asc" | "desc";
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  loading?: boolean;
  className?: string;
  title?: string;
}

export function DataTable<
  T extends Record<string, string | number | Date | boolean | null | undefined>
>({
  data,
  columns,
  searchFields = [],
  sortField,
  sortOrder: initialSortOrder = "asc",
  onEdit,
  onDelete,
  onView,
  loading = false,
  className = "",
  title,
}: DataTableProps<T>) {
  const [currentSortField, setCurrentSortField] = useState<keyof T | undefined>(
    sortField
  );
  const [currentSortOrder, setCurrentSortOrder] = useState<"asc" | "desc">(
    initialSortOrder
  );
  const [searchTerm, setSearchTerm] = useState("");

  const handleSort = (field: keyof T) => {
    if (field === currentSortField) {
      setCurrentSortOrder(currentSortOrder === "asc" ? "desc" : "asc");
    } else {
      setCurrentSortField(field);
      setCurrentSortOrder("asc");
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm && searchFields.length > 0) {
      filtered = data.filter((item) =>
        searchFields.some((field) =>
          String(item[field] || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      );
    } else if (searchTerm) {
      // Search all fields if no specific search fields provided
      filtered = data.filter((item) =>
        Object.values(item).some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (currentSortField) {
      return filtered.sort((a, b) => {
        const aValue = a[currentSortField];
        const bValue = b[currentSortField];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;

        return currentSortOrder === "desc" ? comparison * -1 : comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, searchFields, currentSortField, currentSortOrder]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="mt-4">Loading data...</p>
      </div>
    );
  }

  return (
    <section
      className={`space-y-6 ${className}`}
      aria-labelledby={title ? "list-heading" : undefined}
    >
      <div className="prose flex justify-between items-center gap-4">
        {title && <h1 id="list-heading">{title}</h1>}
        <span className="badge badge-neutral">
          {filteredAndSortedData.length} item
          {filteredAndSortedData.length !== 1 ? "s" : ""}
        </span>
        {(searchFields.length > 0 || !searchFields.length) && (
          <input
            type="text"
            placeholder="Search..."
            className="input input-bordered w-full max-w-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra bg-base-100 shadow-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)}>
                  {column.sortable !== false ? (
                    <button
                      className="btn btn-ghost btn-sm justify-start"
                      onClick={() => handleSort(column.key)}
                    >
                      {column.label}
                      {currentSortField === column.key && (
                        <span className="ml-1">
                          {currentSortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              {(onView || onEdit || onDelete) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.map((item, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <TableCell
                    key={String(column.key)}
                    value={item[column.key]}
                    formatter={column.formatter}
                    prefix={column.prefix}
                    suffix={column.suffix}
                  />
                ))}
                {(onView || onEdit || onDelete) && (
                  <td>
                    <div className="flex gap-2">
                      {onView && (
                        <button
                          onClick={() => onView(item)}
                          className="btn btn-ghost btn-xs"
                          title="View details"
                        >
                          View
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="btn btn-primary btn-xs"
                          title="Edit item"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="btn btn-error btn-xs"
                          title="Delete item"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedData.length === 0 && (
          <div className="alert">
            <span>No data found.</span>
          </div>
        )}
      </div>
    </section>
  );
}
