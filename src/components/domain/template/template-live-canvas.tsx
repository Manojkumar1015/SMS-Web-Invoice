'use client';

import * as React from 'react';
import { TemplateConfiguration } from '@/types/template';
import { Invoice } from '@/types/invoice';
import { DocumentRenderer } from '@/components/domain/document/document-renderer';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Monitor, Smartphone } from 'lucide-react';

const DEFAULT_PREVIEW_INVOICE: Invoice = {
  id: 'preview-inv-001',
  invoiceNumber: 'INV-2026-001',
  customerId: 'cust-preview',
  customerName: 'Commercial Client Account',
  customerEmail: 'billing@clientcompany.com',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  items: [
    {
      id: 'item-1',
      name: 'Software Consultancy Services',
      description: 'Monthly architecture design and technical support',
      quantity: 1,
      unit: 'month',
      rate: 50000,
      unitPrice: 50000,
      discount: 0,
      taxRate: 18,
      amount: 59000,
    },
  ],
  subtotal: 50000,
  discount: 0,
  discountTotal: 0,
  tax: 9000,
  taxTotal: 9000,
  total: 59000,
  amountPaid: 0,
  amountDue: 59000,
  status: 'sent',
  notes: 'Thank you for your business.',
  terms: 'Payment due within 30 days of invoice date.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface TemplateLiveCanvasProps {
  config: TemplateConfiguration;
  sampleInvoice?: Invoice;
}

export function TemplateLiveCanvas({ config, sampleInvoice }: TemplateLiveCanvasProps) {
  const sampleData = sampleInvoice || DEFAULT_PREVIEW_INVOICE;
  const [zoom, setZoom] = React.useState(100);
  const [viewMode, setViewMode] = React.useState<'desktop' | 'mobile'>('desktop');

  const zoomIn = () => setZoom((prev) => Math.min(150, prev + 10));
  const zoomOut = () => setZoom((prev) => Math.max(50, prev - 10));
  const resetZoom = () => setZoom(100);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-200/80 overflow-hidden relative">
      {/* Zoom & View Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/90 backdrop-blur border-b border-slate-300 z-20 text-xs shadow-2xs">
        <div className="flex items-center space-x-2 text-slate-600 font-medium">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Live Preview:</span>
          <span className="font-bold text-slate-900">{config.name}</span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Mobile vs Desktop Toggle */}
          <div className="flex items-center space-x-1 border border-slate-300 rounded-lg p-0.5 bg-slate-100">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1 rounded text-xs flex items-center gap-1 font-semibold ${
                viewMode === 'desktop' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" /> Desktop
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1 rounded text-xs flex items-center gap-1 font-semibold ${
                viewMode === 'mobile' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" /> Mobile
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 border border-slate-300 rounded-lg p-0.5 bg-slate-100">
            <Button variant="ghost" size="icon" onClick={zoomOut} className="h-7 w-7 text-slate-600">
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="font-mono text-xs font-bold text-slate-800 w-10 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" onClick={zoomIn} className="h-7 w-7 text-slate-600">
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={resetZoom} title="Reset Zoom (100%)" className="h-7 w-7 text-slate-600">
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas Printable Paper Container */}
      <div className="flex-1 overflow-auto p-6 sm:p-12 flex justify-center items-start">
        <div
          className="transition-all duration-200 origin-top"
          style={{
            transform: `scale(${zoom / 100})`,
            width: viewMode === 'mobile' ? '375px' : '100%',
            maxWidth: viewMode === 'mobile' ? '375px' : '900px',
          }}
        >
          <DocumentRenderer
            documentType="Invoice"
            documentData={sampleData}
            templateConfig={config}
            sampleMode={true}
          />
        </div>
      </div>
    </div>
  );
}
