'use client';

import * as React from 'react';
import { Sidebar } from '@/components/shell/sidebar';
import { TopNav } from '@/components/shell/top-nav';
import { GlobalSearchModal } from '@/components/shell/global-search-modal';
import { QuickCreateModal } from '@/components/shell/quick-create-modal';
import { CustomerFormDialog } from '@/components/domain/customer/customer-form-dialog';
import { ItemFormDialog } from '@/components/domain/item/item-form-dialog';
import { ExpenseFormDialog } from '@/components/domain/expense/expense-form-dialog';
import { ToastContainer } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface UserProfileData {
  username?: string;
  fullName: string;
  email: string;
  organizationName: string;
  avatarUrl?: string;
  role?: string;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = React.useState(false);

  // Profile Context State
  const [profile, setProfile] = React.useState<UserProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);

  // Quick Action Triggered Modals
  const [customerFormOpen, setCustomerFormOpen] = React.useState(false);
  const [itemFormOpen, setItemFormOpen] = React.useState(false);
  const [expenseFormOpen, setExpenseFormOpen] = React.useState(false);

  const { toasts, toast, dismiss } = useToast();

  const loadProfileData = React.useCallback(() => {
    fetch('/api/v1/profile', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setProfile({
            username: json.data.username || json.data.fullName || '',
            fullName: json.data.fullName || '',
            email: json.data.email || '',
            organizationName: json.data.organizationName || 'My Organization',
            avatarUrl: json.data.avatarUrl || '',
            role: json.data.role || 'Owner',
          });
        }
      })
      .catch((err) => console.warn('Failed to load user profile in layout:', err))
      .finally(() => setLoadingProfile(false));
  }, []);

  React.useEffect(() => {
    loadProfileData();

    const handleUpdate = () => loadProfileData();
    window.addEventListener('profile-updated', handleUpdate);
    window.addEventListener('organization-updated', handleUpdate);

    return () => {
      window.removeEventListener('profile-updated', handleUpdate);
      window.removeEventListener('organization-updated', handleUpdate);
    };
  }, [loadProfileData]);

  const handleQuickActionSelect = (type: 'invoice' | 'quote' | 'customer' | 'item' | 'payment' | 'expense') => {
    if (type === 'customer') setCustomerFormOpen(true);
    if (type === 'item') setItemFormOpen(true);
    if (type === 'expense') setExpenseFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onOpenQuickCreate={() => setQuickCreateOpen(true)}
        profile={profile}
        loadingProfile={loadingProfile}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex flex-col flex-1 transition-all duration-300 ease-in-out',
          collapsed ? 'md:pl-16' : 'md:pl-60'
        )}
      >
        {/* Top Navigation Bar */}
        <TopNav
          onOpenSearch={() => setSearchOpen(true)}
          onOpenQuickCreate={() => setQuickCreateOpen(true)}
          onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
          onQuickActionSelect={handleQuickActionSelect}
          profile={profile}
          loadingProfile={loadingProfile}
        />

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Command Palette Search Modal */}
      <GlobalSearchModal open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Quick Create Modal */}
      <QuickCreateModal
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        onSelectAction={handleQuickActionSelect}
      />

      {/* Global Form Trigger Drawers */}
      <CustomerFormDialog
        open={customerFormOpen}
        onOpenChange={setCustomerFormOpen}
        onSuccess={(c) => toast({ title: 'Customer Created', description: `${c.displayName} added to records.`, variant: 'success' })}
      />

      <ItemFormDialog
        open={itemFormOpen}
        onOpenChange={setItemFormOpen}
        onSuccess={(i) => toast({ title: 'Item Created', description: `${i.name} saved to catalog.`, variant: 'success' })}
      />

      <ExpenseFormDialog
        open={expenseFormOpen}
        onOpenChange={setExpenseFormOpen}
        onSuccess={() => toast({ title: 'Expense Logged', description: 'Business expense recorded.', variant: 'success' })}
      />

      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
