'use client';

import * as React from 'react';
import { settingsService } from '@/services';
import { BusinessSettings, CurrencyCode } from '@/types/settings';
import { PageHeader } from '@/components/ui/page-header';
import { SettingsNavigation } from '@/components/domain/settings/settings-navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { LoadingState } from '@/components/ui/loading-state';
import { Save, Upload, Trash2, Building2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BusinessSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState<BusinessSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    settingsService
      .getBusinessSettings()
      .then((data) => {
        setSettings(data);
        if (data.logoUrl) {
          setLogoPreview(data.logoUrl);
        }
      })
      .catch((err) => {
        console.warn('Could not load business settings:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await settingsService.updateBusinessSettings(settings);
      setSettings(updated);
      if (updated.logoUrl) {
        setLogoPreview(updated.logoUrl);
      }
      toast({ title: 'Business Settings Saved', description: 'Organization profile updated successfully.', variant: 'success' });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('organization-updated'));
      }
    } catch {
      toast({ title: 'Error', description: 'Could not update business settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File Too Large', description: 'Please select an image smaller than 5MB.', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const dataUrl = reader.result;
          setLogoPreview(dataUrl);
          if (settings) {
            setSettings({ ...settings, logoUrl: dataUrl, logoName: file.name });
          }
          toast({ title: 'Logo Selected', description: 'Logo preview updated. Click Save Changes to save.', variant: 'info' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    if (settings) {
      setSettings({ ...settings, logoUrl: '', logoName: undefined });
    }
    toast({ title: 'Logo Removed', description: 'Reverted to company name header text. Click Save Changes to apply.', variant: 'info' });
  };

  if (loading || !settings) return <LoadingState message="Loading business profile..." />;

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
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Business Profile & Identity</CardTitle>
                </div>
                <CardDescription>Primary organization details displayed on generated invoices, quotes and emails.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-xs">
                {/* Logo Upload Section */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="font-bold text-slate-900 block">Company Brand Logo</span>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="h-16 w-48 rounded-xl border border-slate-300 bg-white flex items-center justify-center overflow-hidden p-2">
                      {logoPreview ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={logoPreview} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <div className="flex items-center space-x-2 text-indigo-600 font-bold text-sm">
                          <div className="h-8 w-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black">
                            SMS
                          </div>
                          <span>{settings.companyName}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 text-center sm:text-left">
                      <div className="flex items-center space-x-2">
                        <label className="cursor-pointer">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700">
                            <Upload className="h-3.5 w-3.5 mr-1" /> Upload Logo
                          </span>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        {logoPreview && (
                          <Button type="button" variant="outline" size="sm" onClick={handleRemoveLogo} className="text-red-600 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Recommended dimensions: 400x120px PNG or JPG. Max size 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Company Name & Legal Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Company / Trade Name *</label>
                    <Input
                      value={settings.companyName}
                      onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                      required
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Legal Registered Name *</label>
                    <Input
                      value={settings.legalName}
                      onChange={(e) => setSettings({ ...settings, legalName: e.target.value })}
                      required
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Contact Email, Phone, Website */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Billing Email *</label>
                    <Input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      required
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Phone Number *</label>
                    <Input
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      required
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Company Website</label>
                    <Input
                      value={settings.website || ''}
                      onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Identifiers: GSTIN & PAN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">GSTIN Number</label>
                    <Input
                      value={settings.gstin || ''}
                      onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      className="h-9 text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">PAN Number</label>
                    <Input
                      value={settings.pan || ''}
                      onChange={(e) => setSettings({ ...settings, pan: e.target.value })}
                      placeholder="e.g. AAAAA0000A"
                      className="h-9 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Registered Address */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-800 block text-xs">Registered Address</span>
                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Street Address *</label>
                    <Input
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      required
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 mb-1 block">City *</label>
                      <Input
                        value={settings.city}
                        onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                        required
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 mb-1 block">State *</label>
                      <Input
                        value={settings.state}
                        onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                        required
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 mb-1 block">Postal Code *</label>
                      <Input
                        value={settings.postalCode}
                        onChange={(e) => setSettings({ ...settings, postalCode: e.target.value })}
                        required
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 mb-1 block">Country *</label>
                      <Input
                        value={settings.country}
                        onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                        required
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Regional & Currency Formats */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-800 block text-xs">Regional & Currency Settings</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 mb-1 block">Default Currency *</label>
                      <Select
                        value={settings.currency}
                        onValueChange={(val) => setSettings({ ...settings, currency: val as CurrencyCode })}
                      >
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR (₹ - Indian Rupee)</SelectItem>
                          <SelectItem value="USD">USD ($ - US Dollar)</SelectItem>
                          <SelectItem value="EUR">EUR (€ - Euro)</SelectItem>
                          <SelectItem value="GBP">GBP (£ - British Pound)</SelectItem>
                          <SelectItem value="AED">AED (AED - UAE Dirham)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 mb-1 block">Timezone</label>
                      <Input
                        value={settings.timezone}
                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 mb-1 block">Date Format</label>
                      <Select
                        value={settings.dateFormat}
                        onValueChange={(val) => setSettings({ ...settings, dateFormat: val })}
                      >
                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (e.g. 11/02/2026)</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (e.g. 02/11/2026)</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-02-11)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Organization Payment & Banking Details */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 block text-xs">Payment & Banking Details</span>
                    <span className="text-[11px] text-slate-400">Displayed on official invoices and PDF downloads</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 mb-1 block">Bank Name</label>
                      <Input
                        placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                        value={settings.bankName || ''}
                        onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 mb-1 block">Account Holder Name</label>
                      <Input
                        placeholder="e.g. Acme Services Pvt Ltd"
                        value={settings.accountName || ''}
                        onChange={(e) => setSettings({ ...settings, accountName: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 mb-1 block">Account Number</label>
                      <Input
                        placeholder="e.g. 50200012345678"
                        value={settings.accountNumber || ''}
                        onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 mb-1 block">IFSC Code</label>
                      <Input
                        placeholder="e.g. HDFC0000123"
                        value={settings.ifscCode || ''}
                        onChange={(e) => setSettings({ ...settings, ifscCode: e.target.value.toUpperCase() })}
                        className="h-9 text-xs font-mono uppercase"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 mb-1 block">Branch Name & City</label>
                      <Input
                        placeholder="e.g. Connaught Place Branch, New Delhi"
                        value={settings.branch || ''}
                        onChange={(e) => setSettings({ ...settings, branch: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-xs">
                  <Save className="h-4 w-4 mr-1.5" /> Save Changes
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
