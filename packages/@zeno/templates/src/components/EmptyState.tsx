"use client";

import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  const defaultIcon = (
    <svg
      className="w-12 h-12 text-base-content/30"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-label="Empty state icon"
      role="img"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );

  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center ${className}`}
    >
      <div className="mb-4">{icon || defaultIcon}</div>
      <h3 className="text-lg font-semibold text-base-content mb-2">{title}</h3>
      {description && (
        <p className="text-base-content/70 mb-6 max-w-md">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
