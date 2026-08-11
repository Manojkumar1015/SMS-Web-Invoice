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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = React.useState(false);

  // Quick Action Triggered Modals
  const [customerFormOpen, setCustomerFormOpen] = React.useState(false);
  const [itemFormOpen, setItemFormOpen] = React.useState(false);
  const [expenseFormOpen, setExpenseFormOpen] = React.useState(false);

  const { toasts, toast, dismiss } = useToast();

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
