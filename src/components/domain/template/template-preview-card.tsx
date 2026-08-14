'use client';

import * as React from 'react';
import { InvoiceTemplate } from '@/types/template';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Eye } from 'lucide-react';

interface TemplatePreviewCardProps {
  template: InvoiceTemplate;
  onSetDefault: (id: string) => void;
  onPreview: (template: InvoiceTemplate) => void;
}

export function TemplatePreviewCard({
  template,
  onSetDefault,
  onPreview,
}: TemplatePreviewCardProps) {
  const cfg = template.config;
  const primaryColor = cfg.colors?.primary || '#159447';
  const tableHeaderBg = cfg.colors?.tableHeaderBg || '#E8F5EE';

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
        template.isDefault ? 'ring-2 ring-indigo-600 shadow-md border-indigo-200' : 'border-slate-200'
      }`}
    >
      {template.isDefault && (
        <div
          className="text-white text-[10px] font-extrabold px-3 py-1 text-center uppercase tracking-widest flex items-center justify-center space-x-1"
          style={{ backgroundColor: primaryColor }}
        >
          <Check className="h-3 w-3 mr-1" />
          <span>Active Selected Template</span>
        </div>
      )}

      <div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-base font-bold text-slate-900">{template.name}</CardTitle>
                <Badge variant="slate" className="text-[9px] uppercase font-mono px-1.5 py-0">
                  System
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1 line-clamp-2">
                {template.description}
              </CardDescription>
            </div>

            <div
              className="h-5 w-5 rounded-full border-2 border-white shadow-xs shrink-0"
              style={{ backgroundColor: primaryColor }}
              title={`Primary Color: ${primaryColor}`}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Realistic High-Fidelity Zoho Mini Invoice Thumbnail */}
          <div
            className="h-52 w-full rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-[9px] overflow-hidden relative cursor-pointer group shadow-2xs hover:border-slate-400 transition-colors"
            onClick={() => onPreview(template)}
          >
            {/* Top Logo & Business Info */}
            <div className="flex justify-between items-start pb-1">
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center text-white font-black text-[10px]"
                style={{ backgroundColor: primaryColor }}
              >
                Z
              </div>
              <div className="text-right text-[8px] text-slate-600 space-y-0.5">
                <div className="font-bold text-slate-900">Zylker Thread & Weave</div>
                <div>14B, Northern Street</div>
                <div>New York 10001</div>
              </div>
            </div>

            {/* Centered INVOICE Header with Line Dividers */}
            <div className="flex items-center space-x-2 my-1">
              <div className="flex-1 h-[1px] bg-slate-200" />
              <span className="font-extrabold text-[10px] tracking-widest text-slate-800 uppercase">INVOICE</span>
              <div className="flex-1 h-[1px] bg-slate-200" />
            </div>

            {/* Bill To & Invoice # */}
            <div className="flex justify-between items-start text-[8px]">
              <div>
                <div className="text-slate-400 font-bold uppercase text-[7px]">Bill To</div>
                <div className="font-bold text-slate-900">Scott, Melba R.</div>
                <div className="text-slate-500">2476 Blackwell Street</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 font-bold uppercase text-[7px]">Invoice#</div>
                <div className="font-black text-slate-900 text-[9px]">INV-000002</div>
              </div>
            </div>

            {/* 3-Column Info Table Header */}
            <div className="rounded overflow-hidden text-white flex text-[7.5px] font-bold" style={{ backgroundColor: primaryColor }}>
              <div className="flex-1 p-1">Invoice Date</div>
              <div className="flex-1 p-1">Terms</div>
              <div className="flex-1 p-1">Due Date</div>
            </div>
            <div className="flex text-[7.5px] p-1 border-b border-slate-100 text-slate-700 font-mono">
              <div className="flex-1">05 Aug 2024</div>
              <div className="flex-1">Due on Receipt</div>
              <div className="flex-1">05 Aug 2024</div>
            </div>

            {/* Item Table Header */}
            <div className="rounded-sm overflow-hidden text-white flex text-[7.5px] font-bold" style={{ backgroundColor: primaryColor }}>
              <div className="w-4 p-1 text-center">#</div>
              <div className="flex-1 p-1">Item & Description</div>
              <div className="w-8 p-1 text-right">Qty</div>
              <div className="w-10 p-1 text-right">Rate</div>
              <div className="w-12 p-1 text-right">Amount</div>
            </div>
            <div className="flex text-[7.5px] p-1 border-b border-slate-100 text-slate-600">
              <div className="w-4 text-center">1</div>
              <div className="flex-1 font-semibold text-slate-800">Pepe Jeans - Blue</div>
              <div className="w-8 text-right font-mono">1.00</div>
              <div className="w-10 text-right font-mono">24.99</div>
              <div className="w-12 text-right font-mono font-bold text-slate-900">24.99</div>
            </div>

            {/* Totals Box */}
            <div className="flex justify-end pt-1">
              <div className="w-28 p-1 rounded text-[7.5px] space-y-0.5" style={{ backgroundColor: tableHeaderBg }}>
                <div className="flex justify-between text-slate-600">
                  <span>Sub Total</span>
                  <span className="font-mono">24.99</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-0.5">
                  <span>Balance Due</span>
                  <span className="font-mono" style={{ color: primaryColor }}>$24.99</span>
                </div>
              </div>
            </div>

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-slate-900 bg-white/70">
              <Eye className="h-4 w-4 mr-1" /> Quick Preview
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-3 bg-slate-50/50">
        <Button
          variant={template.isDefault ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => onPreview(template)}
          className="text-xs h-8"
        >
          <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview Layout
        </Button>

        {template.isDefault ? (
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg text-white flex items-center shadow-xs" style={{ backgroundColor: primaryColor }}>
            <Check className="h-3.5 w-3.5 mr-1" /> Selected
          </span>
        ) : (
          <Button
            size="sm"
            onClick={() => onSetDefault(template.id)}
            className="text-xs h-8 text-white font-bold transition-all shadow-xs"
            style={{ backgroundColor: primaryColor }}
          >
            Select Template
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
