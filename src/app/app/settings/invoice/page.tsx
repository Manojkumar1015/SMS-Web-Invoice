'use client';

import * as React from 'react';
import { settingsService, templateService } from '@/services';
import { InvoiceSettings } from '@/types/settings';
import { PageHeader } from '@/components/ui/page-header';
import { SettingsNavigation } from '@/components/domain/settings/settings-navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { LoadingState } from '@/components/ui/loading-state';
import { Save, Receipt, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function InvoiceSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    settingsService.getInvoiceSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await settingsService.updateInvoiceSettings(settings);
      toast({ title: 'Invoice Settings Saved', description: 'Invoice numbering and default rules updated.', variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Could not update invoice settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) return <LoadingState message="Loading invoice settings..." />;

  const sampleNumber = settings.numberFormat === 'INV-YYYY-000001'
    ? `${settings.prefix}2026-${String(settings.nextNumber).padStart(6, '0')}`
    : `${settings.prefix}${String(settings.nextNumber).padStart(6, '0')}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage business details, invoice numbering, tax configurations, and team roles."
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <SettingsNavigation />

        <div className="flex-1 space-y-6">
          <form onSubmit={handleSave}>
            <Card className="border-slate-200 shadow-xs">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Receipt className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Invoice Numbering & Defaults</CardTitle>
                </div>
                <CardDescription>Configure automatic invoice numbering format, default payment terms, and invoice template.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-xs">
                {/* Numbering Preview Callout */}
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">Next Invoice Sample</span>
                    <span className="text-xs text-slate-600">This number will be assigned to your next created invoice</span>
                  </div>
                  <span className="text-lg font-black text-indigo-700 font-mono bg-white px-3 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                    {sampleNumber}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Invoice Prefix *</label>
                    <Input
                      value={settings.prefix}
                      onChange={(e) => setSettings({ ...settings, prefix: e.target.value })}
                      required
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Numbering Format *</label>
                    <Select
                      value={settings.numberFormat}
                      onValueChange={(val) => setSettings({ ...settings, numberFormat: val as any })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INV-000001">INV-000001 (Sequential)</SelectItem>
                        <SelectItem value="INV-YYYY-000001">INV-YYYY-000001 (Yearly Prefix)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Next Invoice Number *</label>
                    <Input
                      type="number"
                      min="1"
                      value={settings.nextNumber}
                      onChange={(e) => setSettings({ ...settings, nextNumber: Number(e.target.value) })}
                      required
                      className="h-9 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Default Payment Terms</label>
                    <Input
                      value={settings.defaultPaymentTerms}
                      onChange={(e) => setSettings({ ...settings, defaultPaymentTerms: e.target.value })}
                      placeholder="e.g. Net 30 Days"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Default Due Days</label>
                    <Input
                      type="number"
                      min="0"
                      value={settings.defaultDueDays}
                      onChange={(e) => setSettings({ ...settings, defaultDueDays: Number(e.target.value) })}
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Default Template</label>
                    <Select
                      value={settings.defaultTemplateId}
                      onValueChange={(val) => setSettings({ ...settings, defaultTemplateId: val })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gst-standard">GST Standard Template</SelectItem>
                        <SelectItem value="classic">Classic Clean</SelectItem>
                        <SelectItem value="modern">Modern Indigo</SelectItem>
                        <SelectItem value="minimal">Minimal Slate</SelectItem>
                        <SelectItem value="professional">Professional Corporate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Default Notes & Terms Footer</label>
                  <Textarea
                    value={settings.notesFooter || ''}
                    onChange={(e) => setSettings({ ...settings, notesFooter: e.target.value })}
                    rows={3}
                    placeholder="Standard terms displayed at the bottom of all invoices..."
                    className="text-xs"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-xs">
                  <Save className="h-4 w-4 mr-1.5" /> Save Invoice Settings
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
