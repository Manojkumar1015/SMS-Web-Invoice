'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { templateService } from '@/services';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BASE_TEMPLATE_PRESETS = [
  {
    id: 'tmpl-modern',
    name: 'Modern Indigo GST',
    category: 'modern' as const,
    description: 'Clean modern theme with indigo accents, GST breakdown, and clear totals.',
    config: {
      id: 'tmpl-modern-cfg',
      name: 'Modern Indigo GST',
      description: 'Clean modern theme with indigo accents',
      layout: 'modern' as const,
      pageSize: 'A4' as const,
      margin: 'medium' as const,
      colors: { primary: '#4f46e5', secondary: '#6366f1', text: '#0f172a', background: '#ffffff', accent: '#e0e7ff', tableHeaderBg: '#EEF2FF' },
      typography: { fontFamily: 'Inter', fontSize: 'normal' as const },
      header: { showLogo: true, logoPosition: 'left' as const, logoWidth: 120, showCompanyName: true, showCompanyAddress: true, showGstin: true, showPan: true },
      customerDetails: { showCustomerGstin: true, showBillingAddress: true, showShippingAddress: true },
      itemsTable: { showHsnSac: true, showDiscount: true, showTaxRate: true, showTaxAmount: true, alternateRowBg: true },
      taxSection: { gstFormat: 'detailed' as const, showCgstSgst: true, showIgst: true },
      totals: { showSubtotal: true, showTotalTax: true, showGrandTotal: true, showAmountPaid: true, showBalanceDue: true, highlightBalance: true },
      paymentDetails: { showBankDetails: true, showUpiQr: true, showPaymentTerms: true },
      signature: { enableDigitalSignature: true, signatureText: 'Authorized Signatory' },
      footer: { showFooter: true, footerText: 'Computer generated invoice.', showPageNumbers: true },
      watermark: { enabled: false, text: 'ORIGINAL', opacity: 0.1 },
    },
  },
  {
    id: 'tmpl-corporate',
    name: 'Corporate Navy',
    category: 'corporate' as const,
    description: 'Professional navy layout suited for enterprise billing and corporate clients.',
    config: {
      id: 'tmpl-corporate-cfg',
      name: 'Corporate Navy',
      description: 'Professional navy layout',
      layout: 'corporate' as const,
      pageSize: 'A4' as const,
      margin: 'medium' as const,
      colors: { primary: '#0f172a', secondary: '#1e293b', text: '#0f172a', background: '#ffffff', accent: '#f1f5f9', tableHeaderBg: '#f1f5f9' },
      typography: { fontFamily: 'Roboto', fontSize: 'normal' as const },
      header: { showLogo: true, logoPosition: 'left' as const, logoWidth: 120, showCompanyName: true, showCompanyAddress: true, showGstin: true, showPan: true },
      customerDetails: { showCustomerGstin: true, showBillingAddress: true, showShippingAddress: true },
      itemsTable: { showHsnSac: true, showDiscount: true, showTaxRate: true, showTaxAmount: true, alternateRowBg: true },
      taxSection: { gstFormat: 'detailed' as const, showCgstSgst: true, showIgst: true },
      totals: { showSubtotal: true, showTotalTax: true, showGrandTotal: true, showAmountPaid: true, showBalanceDue: true, highlightBalance: true },
      paymentDetails: { showBankDetails: true, showUpiQr: true, showPaymentTerms: true },
      signature: { enableDigitalSignature: true, signatureText: 'Authorized Signatory' },
      footer: { showFooter: true, footerText: 'Official Corporate Invoice.', showPageNumbers: true },
      watermark: { enabled: false, text: 'ORIGINAL', opacity: 0.1 },
    },
  },
];

export default function NewTemplatePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = React.useState('My Custom Invoice Layout');
  const [description, setDescription] = React.useState('Customized invoice layout design for client billing.');
  const [selectedBaseId, setSelectedBaseId] = React.useState<string>('tmpl-modern');
  const [submitting, setSubmitting] = React.useState(false);

  const selectedBase = BASE_TEMPLATE_PRESETS.find((t) => t.id === selectedBaseId) || BASE_TEMPLATE_PRESETS[0];

  const handleContinue = async () => {
    if (!name.trim()) {
      toast({ title: 'Template Name Required', description: 'Please provide a template name.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const baseConfig = JSON.parse(JSON.stringify(selectedBase.config));
      baseConfig.name = name;
      baseConfig.description = description;

      const created = await templateService.createTemplate({
        name,
        description,
        category: selectedBase.category,
        isSystem: false,
        isDefault: false,
        config: baseConfig,
      });

      toast({
        title: 'Template Created',
        description: `Template "${created.name}" initialized. Redirecting to Template Studio...`,
        variant: 'success',
      });

      router.push(`/app/templates/${created.id}/edit`);
    } catch {
      toast({ title: 'Error', description: 'Could not create template.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Create Invoice Template"
        subtitle="Provide a template title and choose a base layout design to customize in Template Studio."
        breadcrumbs={[
          { label: 'Templates', href: '/app/templates' },
          { label: 'Create Template' },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push('/app/templates')}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Cancel
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Step 1: Metadata */}
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
              1. Template Title & Description
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Template Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Corporate GST Blue"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Description</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Standard layout for software consultancy invoices"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Base Selection */}
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
              2. Choose a Base Layout Design
            </h3>
            <p className="text-xs text-slate-500">
              Select an initial layout structure. You can customize colors, fonts, margins, headers, and column settings in the next step.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {BASE_TEMPLATE_PRESETS.map((base) => {
                const isSelected = base.id === selectedBaseId;
                const primaryColor = base.config.colors?.primary || '#4f46e5';

                return (
                  <div
                    key={base.id}
                    onClick={() => setSelectedBaseId(base.id)}
                    className={`rounded-xl border-2 p-3 cursor-pointer transition-all flex flex-col justify-between relative ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-600/30 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 rounded-full border shrink-0" style={{ backgroundColor: primaryColor }} />
                        <h4 className="text-xs font-bold text-slate-900 truncate">{base.name}</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2">{base.description}</p>
                    </div>

                    <div className="mt-3 h-20 rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-1 text-[8px]">
                      <div className="h-3 w-full rounded flex items-center justify-between px-1 text-white font-bold" style={{ backgroundColor: primaryColor }}>
                        <span>INVOICE</span>
                      </div>
                      <div className="h-4 bg-white rounded border border-slate-200 p-1" />
                      <div className="h-6 bg-white rounded border border-slate-200 p-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <Button
            size="lg"
            disabled={submitting}
            onClick={handleContinue}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
          >
            Continue to Template Studio <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
