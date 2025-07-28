// @ts-nocheck

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
  columns = 2,
  className = "",
}: FieldsetProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
  };

  return (
    <fieldset className={`space-y-4 ${className}`}>
      <legend className="text-lg font-semibold text-base-content mb-4 px-2">
        {legend}
      </legend>
      <div className={`grid ${gridCols[columns]} gap-4`}>{children}</div>
    </fieldset>
  );
}
