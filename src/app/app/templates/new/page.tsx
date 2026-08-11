'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NewTemplatePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = React.useState('Custom Indigo Pro');
  const [themeColor, setThemeColor] = React.useState('#4f46e5');
  const [logoPosition, setLogoPosition] = React.useState<'left' | 'right' | 'center'>('left');
  const [showGstin, setShowGstin] = React.useState(true);
  const [showTerms, setShowTerms] = React.useState(true);
  const [footerText, setFooterText] = React.useState('Thank you for your business!');

  const handleSave = () => {
    toast({ title: 'Template Saved', description: `Template "${name}" saved.`, variant: 'success' });
    router.push('/app/templates');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Template Designer"
        subtitle="Configure branding colors, typography, and invoice layout elements."
        breadcrumbs={[
          { label: 'Templates', href: '/app/templates' },
          { label: 'New Template' },
        ]}
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/app/templates')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" /> Save Template
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Designer Form Controls */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Theme Properties</h3>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Template Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Primary Accent Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="h-9 w-12 rounded border border-border cursor-pointer bg-surface"
                  />
                  <Input value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="font-mono text-xs" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Logo Alignment</label>
                <Select value={logoPosition} onValueChange={(val) => setLogoPosition(val as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left Aligned</SelectItem>
                    <SelectItem value="center">Center Aligned</SelectItem>
                    <SelectItem value="right">Right Aligned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-semibold text-foreground block">Display Elements</label>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="showGstin" checked={showGstin} onChange={(e) => setShowGstin(e.target.checked)} className="h-4 w-4" />
                <label htmlFor="showGstin" className="text-xs">Include Company GSTIN & PAN</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="showTerms" checked={showTerms} onChange={(e) => setShowTerms(e.target.checked)} className="h-4 w-4" />
                <label htmlFor="showTerms" className="text-xs">Include Terms & Payment Notes</label>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Footer Text</label>
              <Textarea value={footerText} onChange={(e) => setFooterText(e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Live Preview Box */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Live Preview</h3>
            <div className="rounded-lg border border-border bg-white p-6 shadow-xs text-xs text-slate-900 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <div style={{ textAlign: logoPosition }}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-md font-bold text-white shadow-xs" style={{ backgroundColor: themeColor }}>
                    S
                  </div>
                  <h4 className="font-bold text-sm mt-1">Acme Software Pvt Ltd</h4>
                  {showGstin && <p className="text-[10px] text-slate-500 font-mono">GSTIN: 27AAAAA0000A1Z5</p>}
                </div>
                <div className="text-right">
                  <span className="font-bold text-base uppercase" style={{ color: themeColor }}>INVOICE</span>
                  <p className="font-mono text-[11px] font-semibold text-slate-600">INV-2026-001</p>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="font-semibold text-[10px] text-slate-500 uppercase">Billed To:</span>
                <p className="font-bold">Acme Solutions Pvt Ltd</p>
              </div>
              <div className="border border-slate-200 rounded p-2 text-center text-slate-400 text-[11px]">
                [Sample Line Items Grid Preview]
              </div>
              <div className="pt-2 border-t border-slate-200 text-right font-bold text-sm" style={{ color: themeColor }}>
                Total: ₹2,30,100.00
              </div>
              <p className="text-[10px] text-slate-500 text-center pt-2 border-t border-slate-100">{footerText}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
