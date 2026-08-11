'use client';

import * as React from 'react';
import { Breadcrumb, BreadcrumbItem } from './breadcrumb';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 pb-4 border-b border-border mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-1">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center space-x-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
