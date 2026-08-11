'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mockTemplates } from '@/data/mockTemplates';
import { InvoiceTemplate } from '@/types/template';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Plus, Layers, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [templates, setTemplates] = React.useState<InvoiceTemplate[]>(mockTemplates);

  const handleSetDefault = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => ({
        ...t,
        isDefault: t.id === id,
      }))
    );
    toast({ title: 'Template Updated', description: 'Default invoice template saved.', variant: 'success' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice Templates & PDF Designer"
        subtitle="Choose or customize visual themes for printed and emailed invoice documents."
        actions={
          <Button size="sm" onClick={() => router.push('/app/templates/new')}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create Template
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((tmpl) => (
          <Card key={tmpl.id} className={`relative overflow-hidden transition-all ${tmpl.isDefault ? 'ring-2 ring-indigo-600 shadow-md' : ''}`}>
            {tmpl.isDefault && (
              <div className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 text-center uppercase tracking-wider">
                Default Active Theme
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">{tmpl.name}</CardTitle>
                <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: tmpl.themeColor }} />
              </div>
              <CardDescription>{tmpl.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Preview Thumbnail Box */}
              <div className="h-44 w-full rounded-md border border-border bg-slate-50 p-3 space-y-2 text-[9px] shadow-2xs">
                <div className="h-6 w-full rounded flex items-center justify-between px-2 text-white font-bold" style={{ backgroundColor: tmpl.themeColor }}>
                  <span>INVOICE</span>
                  <span>INV-2026-001</span>
                </div>
                <div className="h-10 bg-white rounded border border-slate-200 p-2 space-y-1">
                  <div className="h-2 bg-slate-200 rounded w-1/2" />
                  <div className="h-2 bg-slate-100 rounded w-1/3" />
                </div>
                <div className="h-14 bg-white rounded border border-slate-200 p-2 space-y-1">
                  <div className="h-2 bg-slate-200 rounded w-full" />
                  <div className="h-2 bg-slate-100 rounded w-3/4" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t border-border pt-3">
              {tmpl.isDefault ? (
                <span className="text-xs font-semibold text-indigo-600 flex items-center">
                  <Check className="h-4 w-4 mr-1" /> Active Template
                </span>
              ) : (
                <Button variant="outline" size="sm" onClick={() => handleSetDefault(tmpl.id)} className="text-xs">
                  Set as Default
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => router.push('/app/templates/new')} className="text-xs">
                Customize
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
