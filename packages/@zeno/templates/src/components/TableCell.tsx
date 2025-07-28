"use client";

export interface TableCellProps {
  value: string | number | Date | boolean | null | undefined;
  formatter?: "currency" | "date" | "datetime" | "boolean" | "text";
  prefix?: string;
  suffix?: string;
}

export function TableCell({
  value,
  formatter = "text",
  prefix = "",
  suffix = "",
}: TableCellProps) {
  const formatValue = (val: typeof value): string => {
    if (val === null || val === undefined) {
      return "-";
    }

    switch (formatter) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(Number(val));

      case "date":
        return new Date(val as string | number | Date).toLocaleDateString();

      case "datetime":
        return new Date(val as string | number | Date).toLocaleString();

      case "boolean":
        return val ? "Yes" : "No";
      default:
        return String(val);
    }
  };

  const formattedValue = formatValue(value);

  return (
    <td>
      {prefix}
      {formattedValue}
      {suffix}
    </td>
  );
}
