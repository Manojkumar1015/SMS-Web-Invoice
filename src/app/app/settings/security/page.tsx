'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { SettingsNavigation } from '@/components/domain/settings/settings-navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Lock, Smartphone, KeyRound, Monitor, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SecuritySettingsPage() {
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [twoFactor, setTwoFactor] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'Password Mismatch', description: 'New password and confirmation do not match.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    setTimeout(() => {
      toast({ title: 'Password Updated', description: 'Your password has been changed successfully.', variant: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaving(false);
    }, 500);
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
          {/* Password Update Card */}
          <form onSubmit={handlePasswordSubmit}>
            <Card className="border-slate-200 shadow-xs">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <KeyRound className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Account Password & Authentication</CardTitle>
                </div>
                <CardDescription>Update account credentials and multi-factor security rules.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Current Password</label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">New Password</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Confirm New Password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* 2FA Toggle */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between pt-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 block text-xs">Two-Factor Authentication (2FA)</span>
                    <span className="text-[11px] text-slate-500">Require TOTP authenticator code on login</span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={twoFactor}
                      onChange={(e) => {
                        setTwoFactor(e.target.checked);
                        toast({ title: '2FA Updated', description: e.target.checked ? '2FA enabled.' : '2FA disabled.', variant: 'info' });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end border-t border-slate-100 pt-4">
                <Button type="submit" size="sm" disabled={saving || !newPassword} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-xs">
                  Update Password
                </Button>
              </CardFooter>
            </Card>
          </form>

          {/* Active Sessions Card */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Monitor className="h-5 w-5 text-indigo-600" />
                <CardTitle>Active Login Sessions</CardTitle>
              </div>
              <CardDescription>Devices currently authenticated to your organization account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Monitor className="h-5 w-5 text-emerald-600" />
                  <div>
                    <span className="font-bold text-slate-900 block">Chrome on Windows (Current Device)</span>
                    <span className="text-slate-500 text-[11px]">Mumbai, India • IP: 103.22.140.12</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Now
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
