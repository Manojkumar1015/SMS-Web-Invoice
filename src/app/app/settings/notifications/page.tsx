'use client';

import * as React from 'react';
import { settingsService } from '@/services';
import { NotificationSettings } from '@/types/settings';
import { PageHeader } from '@/components/ui/page-header';
import { SettingsNavigation } from '@/components/domain/settings/settings-navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { LoadingState } from '@/components/ui/loading-state';
import { Save, Bell, Mail, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NotificationSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState<NotificationSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    settingsService.getNotificationSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await settingsService.updateNotificationSettings(settings);
      toast({ title: 'Notification Settings Saved', description: 'Preferences updated successfully.', variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Could not update notification settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) return <LoadingState message="Loading notification preferences..." />;

  const toggleEmail = (key: keyof NotificationSettings['emailNotifications']) => {
    if (!settings) return;
    setSettings({
      ...settings,
      emailNotifications: {
        ...settings.emailNotifications,
        [key]: !settings.emailNotifications[key],
      },
    });
  };

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
                  <Bell className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Notification Preferences</CardTitle>
                </div>
                <CardDescription>Choose when to receive automated email digests, browser alerts, and payment reminders.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-xs">
                {/* Email Notifications */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-indigo-600" />
                    <span className="font-bold text-slate-800 text-xs">Email Notifications</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { key: 'invoiceSent', label: 'Invoice Sent to Customer' },
                      { key: 'invoiceViewed', label: 'Invoice Viewed by Customer' },
                      { key: 'invoicePaid', label: 'Invoice Fully Paid' },
                      { key: 'invoiceOverdue', label: 'Invoice Overdue Alert' },
                      { key: 'paymentReceived', label: 'Payment Received Confirmation' },
                      { key: 'quoteAccepted', label: 'Quote Accepted by Customer' },
                      { key: 'quoteExpiring', label: 'Quote Expiring Reminder' },
                      { key: 'expenseAdded', label: 'New Expense Logged' },
                    ].map((item) => (
                      <div key={item.key} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                        <span className="font-semibold text-slate-700">{item.label}</span>
                        <input
                          type="checkbox"
                          checked={(settings.emailNotifications as any)[item.key]}
                          onChange={() => toggleEmail(item.key as any)}
                          className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Browser & Reminder Toggles */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    <span className="font-bold text-slate-800 text-xs">Browser Alerts & Payment Reminders</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">Desktop Browser Push Notifications</span>
                      <span className="text-[11px] text-slate-500">Receive instant popups when customers view invoices</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.browserNotifications}
                      onChange={(e) => setSettings({ ...settings, browserNotifications: e.target.checked })}
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">Automated Payment Reminders</span>
                      <span className="text-[11px] text-slate-500">Send automatic gentle payment reminder emails before due date</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.reminderPreferences.invoiceReminders}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          reminderPreferences: { ...settings.reminderPreferences, invoiceReminders: e.target.checked },
                        })
                      }
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-xs">
                  <Save className="h-4 w-4 mr-1.5" /> Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
