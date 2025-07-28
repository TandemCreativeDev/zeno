// @ts-nocheck

"use client";

export interface TableCellProps {
  value: string | number | Date | boolean | null | undefined;
  formatter?: "currency" | "date" | "datetime" | "boolean" | "text";
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function TableCell({
  value,
  formatter = "text",
  prefix = "",
  suffix = "",
  className = "",
}: TableCellProps) {
  // Handle null/undefined values
  if (value === null || value === undefined) {
    return <td className={className}>-</td>;
  }

  const renderValue = () => {
    switch (formatter) {
      case "currency": {
        const currencyValue =
          typeof value === "number" ? value.toLocaleString() : String(value);
        return `${prefix}${currencyValue}${suffix}`;
      }

      case "date":
        try {
          return value &&
            (typeof value === "string" ||
              typeof value === "number" ||
              value instanceof Date)
            ? new Date(value).toLocaleDateString()
            : "-";
        } catch {
          return String(value);
        }

      case "datetime":
        try {
          return value &&
            (typeof value === "string" ||
              typeof value === "number" ||
              value instanceof Date)
            ? new Date(value).toLocaleString()
            : "-";
        } catch {
          return String(value);
        }

      case "boolean":
        return (
          <div
            className={`badge badge-sm ${value ? "badge-success" : "badge-ghost"}`}
          >
            {value ? "Yes" : "No"}
          </div>
        );

      case "text":
      default:
        return `${prefix}${String(value)}${suffix}`;
    }
  };

  return <td className={className}>{renderValue()}</td>;
}
