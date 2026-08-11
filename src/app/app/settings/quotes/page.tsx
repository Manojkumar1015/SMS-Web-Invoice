'use client';

import * as React from 'react';
import { settingsService } from '@/services';
import { QuoteSettings } from '@/types/settings';
import { PageHeader } from '@/components/ui/page-header';
import { SettingsNavigation } from '@/components/domain/settings/settings-navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { LoadingState } from '@/components/ui/loading-state';
import { Save, FilePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function QuoteSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState<QuoteSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    settingsService.getQuoteSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await settingsService.updateQuoteSettings(settings);
      toast({ title: 'Quote Settings Saved', description: 'Quote numbering and validity rules updated.', variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Could not update quote settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) return <LoadingState message="Loading quote settings..." />;

  const sampleQuoteNumber = `${settings.prefix}${String(settings.nextNumber).padStart(6, '0')}`;

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
                  <FilePlus className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Quote Numbering & Validity Defaults</CardTitle>
                </div>
                <CardDescription>Configure quotation numbering prefix, default validity period, and terms.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-xs">
                {/* Sample Quote Number Callout */}
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">Next Quote Sample</span>
                    <span className="text-xs text-slate-600">Assigned to your next quotation</span>
                  </div>
                  <span className="text-lg font-black text-purple-700 font-mono bg-white px-3 py-1 rounded-lg border border-purple-200 shadow-2xs">
                    {sampleQuoteNumber}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Quote Prefix *</label>
                    <Input
                      value={settings.prefix}
                      onChange={(e) => setSettings({ ...settings, prefix: e.target.value })}
                      required
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Next Quote Number *</label>
                    <Input
                      type="number"
                      min="1"
                      value={settings.nextNumber}
                      onChange={(e) => setSettings({ ...settings, nextNumber: Number(e.target.value) })}
                      required
                      className="h-9 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Default Validity (Days)</label>
                    <Input
                      type="number"
                      min="1"
                      value={settings.defaultValidityDays}
                      onChange={(e) => setSettings({ ...settings, defaultValidityDays: Number(e.target.value) })}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Default Quote Terms & Conditions</label>
                  <Textarea
                    value={settings.defaultTerms || ''}
                    onChange={(e) => setSettings({ ...settings, defaultTerms: e.target.value })}
                    rows={3}
                    placeholder="Quotations valid for 15 days..."
                    className="text-xs"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-xs">
                  <Save className="h-4 w-4 mr-1.5" /> Save Quote Settings
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
