'use client';

import * as React from 'react';
import { settingsService } from '@/services';
import { PaymentSettings } from '@/types/settings';
import { PageHeader } from '@/components/ui/page-header';
import { SettingsNavigation } from '@/components/domain/settings/settings-navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { Save, CreditCard, Building2, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PaymentSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState<PaymentSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    settingsService.getPaymentSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await settingsService.updatePaymentSettings(settings);
      toast({ title: 'Payment Settings Saved', description: 'Bank details and enabled methods updated.', variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Could not update payment settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) return <LoadingState message="Loading payment settings..." />;

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
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Payment Methods & Bank Details</CardTitle>
                </div>
                <CardDescription>Configure accepted payment options and bank account details for invoice footers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-xs">
                {/* Accepted Payment Methods Toggles */}
                <div className="space-y-3">
                  <span className="font-bold text-slate-800 block text-xs">Accepted Payment Methods</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'bankTransfer', label: 'Bank Transfer (NEFT/RTGS)' },
                      { key: 'upi', label: 'UPI / QR Code' },
                      { key: 'creditCard', label: 'Credit / Debit Card' },
                      { key: 'cash', label: 'Cash' },
                      { key: 'cheque', label: 'Cheque' },
                      { key: 'other', label: 'Other Methods' },
                    ].map((item) => (
                      <div key={item.key} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                        <span className="font-semibold text-slate-700">{item.label}</span>
                        <input
                          type="checkbox"
                          checked={(settings.methods as any)[item.key]}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              methods: { ...settings.methods, [item.key]: e.target.checked },
                            })
                          }
                          className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bank Account Details */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                    <span className="font-bold text-slate-800 text-xs">Primary Bank Account</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 mb-1 block">Account Name *</label>
                      <Input
                        value={settings.bankDetails.accountName}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            bankDetails: { ...settings.bankDetails, accountName: e.target.value },
                          })
                        }
                        required
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 mb-1 block">Bank Name *</label>
                      <Input
                        value={settings.bankDetails.bankName}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            bankDetails: { ...settings.bankDetails, bankName: e.target.value },
                          })
                        }
                        required
                        className="h-9 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 mb-1 block">Account Number *</label>
                      <Input
                        value={settings.bankDetails.accountNumber}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            bankDetails: { ...settings.bankDetails, accountNumber: e.target.value },
                          })
                        }
                        required
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 mb-1 block">IFSC Code *</label>
                      <Input
                        value={settings.bankDetails.ifscCode}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            bankDetails: { ...settings.bankDetails, ifscCode: e.target.value },
                          })
                        }
                        required
                        className="h-9 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* UPI Details */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4 text-indigo-600" />
                    <span className="font-bold text-slate-800 text-xs">UPI Virtual Payment Address</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">UPI ID / VPA</label>
                    <Input
                      value={settings.upiId}
                      onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                      placeholder="e.g. acmesoftware@hdfcbank"
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Payment Instructions for Invoices</label>
                    <Textarea
                      value={settings.paymentInstructions || ''}
                      onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
                      rows={2}
                      placeholder="e.g. Kindly mention invoice number in UTR/Remarks..."
                      className="text-xs"
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-xs">
                  <Save className="h-4 w-4 mr-1.5" /> Save Payment Settings
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
