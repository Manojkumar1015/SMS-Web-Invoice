'use client';

import * as React from 'react';
import { settingsService } from '@/services';
import { TeamUser, UserRole } from '@/types/settings';
import { PageHeader } from '@/components/ui/page-header';
import { SettingsNavigation } from '@/components/domain/settings/settings-navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { LoadingState } from '@/components/ui/loading-state';
import { Users, UserPlus, ShieldCheck, Mail, MoreHorizontal, Trash2, UserCheck, Lock } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown';
import { useToast } from '@/hooks/use-toast';

export default function UsersSettingsPage() {
  const { toast } = useToast();
  const [users, setUsers] = React.useState<TeamUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<UserRole>('Staff');
  const [submitting, setSubmitting] = React.useState(false);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    const data = await settingsService.getTeamUsers();
    setUsers(data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSubmitting(true);
    try {
      await settingsService.inviteUser({ email: inviteEmail, role: inviteRole });
      toast({
        title: 'Invitation Sent',
        description: `Invitation sent successfully to ${inviteEmail}.`,
        variant: 'success',
      });
      setInviteOpen(false);
      setInviteEmail('');
      fetchUsers();
    } catch {
      toast({ title: 'Error', description: 'Could not send invitation.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    try {
      await settingsService.updateUserRole(userId, newRole);
      toast({ title: 'Role Updated', description: 'User permissions updated.', variant: 'info' });
      fetchUsers();
    } catch {
      toast({ title: 'Error', description: 'Could not update role.', variant: 'destructive' });
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await settingsService.deleteUser(userId);
      toast({ title: 'User Removed', description: 'Team member removed from organization.', variant: 'info' });
      fetchUsers();
    } catch {
      toast({ title: 'Error', description: 'Could not remove user.', variant: 'destructive' });
    }
  };

  if (loading) return <LoadingState message="Loading team members..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage business details, invoice numbering, tax configurations, and team roles."
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <SettingsNavigation />

        <div className="flex-1 space-y-6">
          {/* Team Members List Card */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Team Users & Organization Membership</CardTitle>
                </div>
                <CardDescription>Invite team members and assign role-based access permissions.</CardDescription>
              </div>

              <Button size="sm" onClick={() => setInviteOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                <UserPlus className="h-4 w-4 mr-1.5" /> Invite User
              </Button>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3">Last Active</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2.5">
                            <div className="h-8 w-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {user.name.split(' ').map((n) => n[0]).join('')}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{user.name}</span>
                              <span className="text-slate-500 text-[11px]">{user.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
                            {user.role}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              user.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : user.status === 'Invited'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-slate-500 text-[11px] font-mono">{user.lastActive}</td>

                        <td className="px-4 py-3 text-right">
                          {user.role !== 'Owner' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'Admin')}>Make Admin</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'Accountant')}>Make Accountant</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'Staff')}>Make Staff</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'Viewer')}>Make Viewer</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleRemoveUser(user.id)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" /> Remove User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Role Permissions Matrix Card */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <CardTitle>Role Permissions Overview</CardTitle>
              </div>
              <CardDescription>Overview of built-in access controls per role assignment.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">Owner</span>
                  <p className="text-[11px] text-slate-500">Full administrative control, billing ownership, team management & security.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-indigo-700 block">Admin</span>
                  <p className="text-[11px] text-slate-500">Business settings, customer management, billing, and reporting access.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-emerald-700 block">Accountant</span>
                  <p className="text-[11px] text-slate-500">Full access to Invoices, Payments, Expenses, and Financial Reports.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700 block">Staff</span>
                  <p className="text-[11px] text-slate-500">Create & manage Customers, Items, Quotes, and Invoices.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-500 block">Viewer</span>
                  <p className="text-[11px] text-slate-500">Read-only dashboard, invoice, and quote inspection permissions.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invite User Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs pt-2">
            <div>
              <label className="font-bold text-slate-700 mb-1 block">Work Email Address *</label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder="colleague@company.com"
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 mb-1 block">Role *</label>
              <Select value={inviteRole} onValueChange={(val) => setInviteRole(val as UserRole)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Accountant">Accountant</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2 flex justify-end space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
