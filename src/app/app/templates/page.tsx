'use client';

import * as React from 'react';
import { templateService } from '@/services';
import { InvoiceTemplate } from '@/types/template';
import { PageHeader } from '@/components/ui/page-header';
import { TemplatePreviewCard } from '@/components/domain/template/template-preview-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DocumentRenderer } from '@/components/domain/document/document-renderer';
import { LoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/hooks/use-toast';

const SAMPLE_PREVIEW_INVOICE: any = {
  id: 'preview-inv-001',
  invoiceNumber: 'INV-000002',
  customerId: 'cust-preview',
  customerName: 'Scott, Melba R.',
  customerEmail: 'scott.melba@example.com',
  customerPhone: '+1 (555) 234-5678',
  billingAddress: {
    street: '2476 Blackwell Street',
    city: 'Fairbanks',
    state: 'Colorado',
    postalCode: '99701',
    country: 'U.S.A',
  },
  shippingAddress: {
    street: '2476 Blackwell Street',
    city: 'Fairbanks',
    state: 'Colorado',
    postalCode: '99701',
    country: 'U.S.A',
  },
  sameAsBillingAddress: true,
  date: '2026-08-05',
  dueDate: '2026-08-05',
  paymentTerms: 'Due on Receipt',
  items: [
    {
      id: 'item-1',
      name: 'Pepe Jeans',
      description: 'Tapered fit Mid rise - Blue',
      quantity: 1,
      unit: 'Square feet',
      unitPrice: 24.99,
      rate: 24.99,
      discount: 0,
      taxRate: 5,
      amount: 24.99,
      total: 24.99,
    },
    {
      id: 'item-2',
      name: 'Boys Shirt',
      description: 'Size - 36, Mosaic design',
      quantity: 1,
      unit: 'Piece',
      unitPrice: 16.99,
      rate: 16.99,
      discount: 0,
      taxRate: 5,
      amount: 16.99,
      total: 16.99,
    },
    {
      id: 'item-3',
      name: 'Men Shirt',
      description: 'Size - 36, Mosaic design',
      quantity: 1,
      unit: 'Piece',
      unitPrice: 19.99,
      rate: 19.99,
      discount: 0,
      taxRate: 5,
      amount: 19.99,
      total: 19.99,
    },
  ],
  subtotal: 61.97,
  discount: 0,
  discountTotal: 0,
  tax: 3.09,
  taxTotal: 3.09,
  total: 65.06,
  amountPaid: 0,
  amountDue: 65.06,
  status: 'sent',
  notes: 'Thanks for your business.',
  terms: 'Full payment is due upon receipt of this invoice. Late payments may incur additional charges or interest as per the applicable laws.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function TemplatesPage() {
  const { toast } = useToast();

  const [templates, setTemplates] = React.useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [previewTemplate, setPreviewTemplate] = React.useState<InvoiceTemplate | null>(null);

  const fetchTemplates = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await templateService.getTemplates();
      setTemplates(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSetDefault = async (id: string) => {
    try {
      const updated = await templateService.setDefaultTemplate(id);
      toast({
        title: 'Template Selected',
        description: `"${updated.name}" is now the active invoice template for Preview & PDF downloads.`,
        variant: 'success',
      });
      fetchTemplates();
    } catch {
      toast({ title: 'Error', description: 'Could not select template.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice Templates"
        subtitle="Select your preferred built-in invoice design theme. The selected template controls both the invoice preview and downloadable PDF documents."
      />

      {/* Grid of 4 System Templates */}
      {loading ? (
        <LoadingState message="Loading invoice templates..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {templates.map((tmpl) => (
            <TemplatePreviewCard
              key={tmpl.id}
              template={tmpl}
              onSetDefault={handleSetDefault}
              onPreview={(t) => setPreviewTemplate(t)}
            />
          ))}
        </div>
      )}

      {/* Full Preview Modal */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center justify-between">
                <span>{previewTemplate.name} — Full Layout Preview</span>
              </DialogTitle>
            </DialogHeader>

            <div className="bg-slate-100 p-6 rounded-xl border border-slate-200">
              <DocumentRenderer
                documentType="Invoice"
                documentData={SAMPLE_PREVIEW_INVOICE}
                templateConfig={previewTemplate.config}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
