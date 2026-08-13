'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SettingsNavigation } from '@/components/domain/settings/settings-navigation';
import { LoadingState } from '@/components/ui/loading-state';
import { User, Mail, Phone, Lock, Save, Shield, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfileSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [email, setEmail] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState('');
  const [organizationName, setOrganizationName] = React.useState('');
  const [role, setRole] = React.useState('');

  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const loadProfile = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/profile', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load profile');
      const json = await res.json();
      if (json.success && json.data) {
        setEmail(json.data.email || '');
        setFullName(json.data.fullName || '');
        setPhone(json.data.phone || '');
        setAvatarUrl(json.data.avatarUrl || '');
        setOrganizationName(json.data.organizationName || '');
        setRole(json.data.role || 'Member');
      }
    } catch {
      toast({ title: 'Error', description: 'Could not load user profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      toast({ title: 'Validation Error', description: 'New password and confirmation do not match.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        fullName,
        phone,
        avatarUrl,
      };
      if (newPassword && newPassword.trim().length >= 6) {
        payload.newPassword = newPassword.trim();
      }

      const res = await fetch('/api/v1/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update profile');
      }

      toast({ title: 'Profile Updated', description: 'Your profile changes have been saved.', variant: 'success' });
      setNewPassword('');
      setConfirmPassword('');
      loadProfile();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Could not update profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading profile settings..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your personal profile, organization settings, preferences and security."
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <SettingsNavigation />

        <div className="flex-1 space-y-6 max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Details Card */}
            <Card className="border-slate-200">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Personal Profile</CardTitle>
                </div>
                <CardDescription>Update your personal account details and preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      Full Name
                    </label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Vikram Malhotra"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Input value={email} disabled className="bg-slate-50 text-slate-500 font-mono pr-8" />
                      <Mail className="h-4 w-4 text-slate-400 absolute right-2.5 top-2.5" />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">Email is managed by Supabase Authentication.</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                      <Phone className="h-4 w-4 text-slate-400 absolute right-2.5 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      Avatar Image URL
                    </label>
                    <Input
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                    <span className="font-semibold text-slate-700">Primary Organization:</span>
                    <strong className="text-slate-900">{organizationName}</strong>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                    <Shield className="h-3 w-3" />
                    <span>Role: {role}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card className="border-slate-200">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Change Password</CardTitle>
                </div>
                <CardDescription>Optionally update your authentication password.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      New Password
                    </label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      Confirm New Password
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                <Save className="h-4 w-4 mr-1.5" />
                {saving ? 'Saving Profile...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
