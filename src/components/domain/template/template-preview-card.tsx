'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { InvoiceTemplate } from '@/types/template';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown';
import { Check, Edit, Copy, Trash2, Eye, MoreHorizontal, Sparkles } from 'lucide-react';
import { DateDisplay } from '@/components/ui/date-display';

interface TemplatePreviewCardProps {
  template: InvoiceTemplate;
  onSetDefault: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview: (template: InvoiceTemplate) => void;
}

export function TemplatePreviewCard({
  template,
  onSetDefault,
  onDuplicate,
  onDelete,
  onPreview,
}: TemplatePreviewCardProps) {
  const router = useRouter();
  const cfg = template.config;

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
        template.isDefault ? 'ring-2 ring-indigo-600 shadow-md' : 'border-slate-200'
      }`}
    >
      {template.isDefault && (
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-[10px] font-extrabold px-3 py-1 text-center uppercase tracking-widest flex items-center justify-center space-x-1">
          <Sparkles className="h-3 w-3 mr-1" />
          <span>Active Default Invoice Theme</span>
        </div>
      )}

      <div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-sm font-bold text-slate-900">{template.name}</CardTitle>
                <Badge variant={template.isSystem ? 'slate' : 'info'} className="text-[9px] uppercase font-mono px-1.5 py-0">
                  {template.isSystem ? 'System' : 'Custom'}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1 line-clamp-2">
                {template.description}
              </CardDescription>
            </div>

            {/* Color Accent Indicator */}
            <div
              className="h-5 w-5 rounded-full border-2 border-white shadow-xs shrink-0"
              style={{ backgroundColor: cfg.colors?.primary || '#4f46e5' }}
              title={`Primary Color: ${cfg.colors?.primary}`}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Realistic High-Fidelity Invoice Thumbnail */}
          <div
            className="h-44 w-full rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2 text-[9px] overflow-hidden relative cursor-pointer group shadow-2xs hover:border-indigo-300 transition-colors"
            onClick={() => onPreview(template)}
          >
            {/* Header Mini Preview */}
            <div
              className="h-8 w-full rounded-md flex items-center justify-between px-2 text-white font-bold"
              style={{ backgroundColor: cfg.colors?.primary || '#4f46e5' }}
            >
              <div className="flex items-center space-x-1">
                <div className="h-3 w-3 rounded bg-white/20 text-[7px] flex items-center justify-center">S</div>
                <span className="truncate max-w-[80px]">{cfg.branding?.companyName || 'SMS Billing'}</span>
              </div>
              <span className="font-mono text-[8px]">INV-2026-001</span>
            </div>

            {/* Customer Box Mini */}
            <div className="p-1.5 rounded border border-slate-200 bg-white space-y-0.5">
              <div className="h-1.5 bg-slate-200 rounded w-1/3" />
              <div className="h-1.5 bg-slate-100 rounded w-1/2" />
            </div>

            {/* Line Table Mini */}
            <div className="rounded border border-slate-200 bg-white overflow-hidden">
              <div
                className="p-1 font-bold flex justify-between text-[8px]"
                style={{ backgroundColor: cfg.colors?.tableHeaderBg || '#f8fafc', color: cfg.colors?.tableHeaderText || '#1e293b' }}
              >
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div className="p-1 flex justify-between border-t border-slate-100 text-[8px] text-slate-600">
                <span>Enterprise Cloud Retainer</span>
                <span className="font-mono font-bold">₹1,50,000</span>
              </div>
            </div>

            {/* Total Callout Mini */}
            <div className="flex justify-end pt-1 border-t border-slate-200 text-right">
              <span className="font-extrabold text-[9px]" style={{ color: cfg.colors?.primary || '#4f46e5' }}>
                Total: ₹1,77,000.00
              </span>
            </div>

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-indigo-900 bg-white/60">
              <Eye className="h-4 w-4 mr-1" /> Quick Preview
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Font: <strong className="text-slate-700">{cfg.typography?.fontFamily || 'Inter'}</strong></span>
            <span>Modified: <DateDisplay date={template.updatedAt} /></span>
          </div>
        </CardContent>
      </div>

      <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-3 bg-slate-50/50">
        {template.isDefault ? (
          <span className="text-xs font-bold text-indigo-600 flex items-center">
            <Check className="h-4 w-4 mr-1" /> Default Theme
          </span>
        ) : (
          <Button variant="outline" size="sm" onClick={() => onSetDefault(template.id)} className="text-xs h-7">
            Set as Default
          </Button>
        )}

        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/app/templates/${template.id}/edit`)}
            className="text-xs h-7 bg-white font-semibold text-slate-700"
          >
            <Edit className="h-3 w-3 mr-1" /> Customize
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onPreview(template)}>
                <Eye className="h-4 w-4 mr-2 text-slate-600" /> Preview Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/app/templates/${template.id}/edit`)}>
                <Edit className="h-4 w-4 mr-2 text-slate-600" /> Edit Layout
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(template.id)}>
                <Copy className="h-4 w-4 mr-2 text-slate-600" /> Duplicate
              </DropdownMenuItem>
              {!template.isSystem && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(template.id)} className="text-red-600 focus:text-red-700">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Template
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  );
}
