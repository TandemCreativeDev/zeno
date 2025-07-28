"use client";

import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  breadcrumbs,
  className = "",
}: PageHeaderProps) {
  return (
    <header className={`space-y-4 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <div className="breadcrumbs text-sm">
            <ul>
              {breadcrumbs.map((breadcrumb, index) => (
                <li key={breadcrumb.label || breadcrumb.href || index}>
|                  {breadcrumb.href ? (
                    <a href={breadcrumb.href} className="link link-hover">
                      {breadcrumb.label}
                    </a>
                  ) : (
                    <span className="text-base-content">
                      {breadcrumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-base-content">{title}</h1>
          {description && (
            <p className="text-base-content/70 text-lg max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {children && <div className="flex-shrink-0">{children}</div>}
      </div>
    </header>
  );
}
