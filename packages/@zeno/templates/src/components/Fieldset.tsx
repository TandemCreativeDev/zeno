"use client";

import type { ReactNode } from "react";

export interface FieldsetProps {
  legend: string;
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function Fieldset({
  legend,
  children,
  columns = 1,
  className = "",
}: FieldsetProps) {
  const getGridClass = () => {
    switch (columns) {
      case 2:
        return "grid-cols-1 md:grid-cols-2";
      case 3:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      default:
        return "grid-cols-1";
    }
  };

  return (
    <fieldset className={`space-y-4 ${className}`}>
      <legend className="text-lg font-semibold text-base-content">
        {legend}
      </legend>
      <div className={`grid gap-4 ${getGridClass()}`}>{children}</div>
    </fieldset>
  );
}
