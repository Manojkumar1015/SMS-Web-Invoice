'use client';

import * as React from 'react';
import { settingsService } from '@/services';
import { TaxSettings, TaxType, TaxRegistrationStatus } from '@/types/settings';
import { PageHeader } from '@/components/ui/page-header';
import { SettingsNavigation } from '@/components/domain/settings/settings-navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { LoadingState } from '@/components/ui/loading-state';
import { Save, Percent, ShieldAlert, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TaxSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState<TaxSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    settingsService.getTaxSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await settingsService.updateTaxSettings(settings);
      toast({ title: 'Tax Settings Saved', description: 'GST rates and tax rules updated.', variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Could not update tax settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) return <LoadingState message="Loading tax settings..." />;

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
                  <Percent className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Tax & GST Configuration</CardTitle>
                </div>
                <CardDescription>Configure place of supply tax rules, GST rates, and registration type.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-xs">
                {/* Configuration Notice Callout */}
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-2.5">
                  <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Configuration UI Only:</strong> These settings configure tax default rates on invoices. No government APIs or official tax filing portals are contacted.
                  </span>
                </div>

                {/* Enable Tax Toggle */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block text-xs">Enable Tax Calculation</span>
                    <span className="text-[11px] text-slate-500">Calculate tax rates automatically on invoice line items</span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enableTax}
                      onChange={(e) => setSettings({ ...settings, enableTax: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Default Tax Type *</label>
                    <Select
                      value={settings.defaultTaxType}
                      onValueChange={(val) => setSettings({ ...settings, defaultTaxType: val as TaxType })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GST">GST (Auto Intra/Inter state)</SelectItem>
                        <SelectItem value="CGST_SGST">CGST + SGST (Intra-state)</SelectItem>
                        <SelectItem value="IGST">IGST (Inter-state)</SelectItem>
                        <SelectItem value="NO_TAX">No Tax (Exempt)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Default GST Rate (%) *</label>
                    <Select
                      value={String(settings.defaultGstRate)}
                      onValueChange={(val) => setSettings({ ...settings, defaultGstRate: Number(val) })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0% (Nil Rated)</SelectItem>
                        <SelectItem value="5">5% (Essential Goods)</SelectItem>
                        <SelectItem value="12">12% (Standard Low)</SelectItem>
                        <SelectItem value="18">18% (Services & Standard)</SelectItem>
                        <SelectItem value="28">28% (Luxury / Higher)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Registration Status *</label>
                    <Select
                      value={settings.taxRegistrationStatus}
                      onValueChange={(val) => setSettings({ ...settings, taxRegistrationStatus: val as TaxRegistrationStatus })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Registered">Registered Regular GST</SelectItem>
                        <SelectItem value="Composition">Composition Scheme</SelectItem>
                        <SelectItem value="Unregistered">Unregistered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Home Business State *</label>
                    <Input
                      value={settings.businessState}
                      onChange={(e) => setSettings({ ...settings, businessState: e.target.value })}
                      placeholder="e.g. Maharashtra (27)"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Registered GSTIN Number</label>
                    <Input
                      value={settings.gstin || ''}
                      onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      className="h-9 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-xs">
                  <Save className="h-4 w-4 mr-1.5" /> Save Tax Settings
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
