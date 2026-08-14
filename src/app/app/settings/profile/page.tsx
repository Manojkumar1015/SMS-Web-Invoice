'use client';

import * as React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import { User, Mail, Phone, Lock, Save, Shield, Building2, Upload, Trash2, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfileSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState('');
  const [organizationName, setOrganizationName] = React.useState('');
  const [role, setRole] = React.useState('');

  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);

  const loadProfile = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/profile', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load profile');
      const json = await res.json();
      console.log('[DEBUG loadProfile] Response JSON:', json);
      if (json.success && json.data) {
        setUsername(json.data.username || json.data.fullName || '');
        setEmail(json.data.email || '');
        setFullName(json.data.fullName || '');
        // Phone must strictly load from json.data.phone and NEVER fallback to email
        setPhone(json.data.phone || '');
        setAvatarUrl(json.data.avatarUrl || '');
        setOrganizationName(json.data.organizationName || '');
        setRole(json.data.role || 'Member');
      }
    } catch (err) {
      console.error('[DEBUG loadProfile error]:', err);
      toast({ title: 'Error', description: 'Could not load user profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Invalid Image Format', description: 'Please upload a JPG, PNG, or WebP image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File Size Exceeds 5MB Limit', description: 'Please select an image smaller than 5MB.', variant: 'destructive' });
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to upload profile picture');
      }

      if (json.data?.avatarUrl) {
        setAvatarUrl(json.data.avatarUrl);
        toast({ title: 'Profile Picture Uploaded', description: 'Click Save Profile Changes to persist changes.', variant: 'info' });
      }
    } catch (err: any) {
      console.error('[handleAvatarUpload error]:', err);
      toast({ title: 'Upload Failed', description: err.message || 'Could not upload profile picture', variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    toast({ title: 'Profile Picture Removed', description: 'Reverted to default initials avatar. Click Save Profile Changes to apply.', variant: 'info' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isPasswordChangeRequested = Boolean(
      newPassword &&
      confirmPassword &&
      newPassword.trim().length > 0 &&
      confirmPassword.trim().length > 0
    );

    if (isPasswordChangeRequested) {
      if (newPassword !== confirmPassword) {
        toast({ title: 'Validation Error', description: 'New password and confirmation do not match.', variant: 'destructive' });
        return;
      }
      if (newPassword.trim().length < 6) {
        toast({ title: 'Validation Error', description: 'New password must be at least 6 characters.', variant: 'destructive' });
        return;
      }
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl,
      };

      if (isPasswordChangeRequested) {
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

      if (json.data) {
        setFullName(json.data.fullName || '');
        setPhone(json.data.phone || '');
        setAvatarUrl(json.data.avatarUrl || '');
      }

      toast({ title: 'Profile Updated', description: 'Your personal profile changes have been saved successfully.', variant: 'success' });
      setNewPassword('');
      setConfirmPassword('');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('profile-updated'));
      }
    } catch (error: any) {
      console.error('[handleSubmit error]:', error);
      toast({ title: 'Error Updating Profile', description: error.message || 'Could not update profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading profile settings..." />;
  }

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : username
    ? username.slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal profile, contact information, avatar picture, and password."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Details Card */}
            <Card className="border-slate-200">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Personal Profile</CardTitle>
                </div>
                <CardDescription>Update your personal account details and profile picture.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture Upload Section */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Profile Picture</span>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="h-20 w-20 rounded-full border-2 border-indigo-600/30 bg-indigo-600 text-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                      {avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={avatarUrl} alt="Profile Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold">{initials}</span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start space-x-2">
                        <label className="cursor-pointer">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-2xs">
                            <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload Picture
                          </span>
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
                        </label>
                        {avatarUrl && (
                          <Button type="button" variant="outline" size="sm" onClick={handleRemoveAvatar} className="text-red-600 hover:bg-red-50 text-xs">
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Supports JPG, PNG or WebP. Maximum file size 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      Username
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold font-mono">@</span>
                      <Input
                        value={username}
                        disabled
                        autoComplete="username"
                        className="pl-7 font-mono font-bold bg-slate-50 text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      Full Name
                    </label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name"
                      placeholder="e.g. Vikram Malhotra"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Input value={email} disabled autoComplete="email" className="bg-slate-50 text-slate-500 font-mono pr-8" />
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
                        autoComplete="tel"
                        placeholder="+91 98765 43210"
                      />
                      <Phone className="h-4 w-4 text-slate-400 absolute right-2.5 top-2.5" />
                    </div>
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
                      autoComplete="new-password"
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
                      autoComplete="new-password"
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
  );
}
