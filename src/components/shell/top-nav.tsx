'use client';

import * as React from 'react';
import {
  Search,
  Plus,
  Bell,
  HelpCircle,
  Building2,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Menu,
  Sparkles,
  FilePlus,
  UserPlus,
  PackagePlus,
  CreditCard,
  Receipt,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown';
import { Button } from '@/components/ui/button';

interface TopNavProps {
  onOpenSearch: () => void;
  onOpenQuickCreate: () => void;
  onMobileMenuToggle: () => void;
  onQuickActionSelect: (type: 'invoice' | 'quote' | 'customer' | 'item' | 'payment' | 'expense') => void;
}

export function TopNav({
  onOpenSearch,
  onOpenQuickCreate,
  onMobileMenuToggle,
  onQuickActionSelect,
}: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-surface px-4 shadow-2xs">
      {/* Left section: Mobile menu & Org Selector */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          aria-label="Toggle Mobile Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Org Selector Placeholder */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs font-semibold hover:bg-surface-hover">
              <Building2 className="h-3.5 w-3.5 mr-2 text-accent" />
              <span className="max-w-[150px] sm:max-w-[200px] truncate">Acme Software Pvt Ltd</span>
              <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Select Organization</DropdownMenuLabel>
            <DropdownMenuItem className="bg-surface-hover font-medium">
              <Building2 className="h-4 w-4 mr-2 text-accent" />
              Acme Software Pvt Ltd (Primary)
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              Acme Global Logistics LLC
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-accent font-medium">
              <Plus className="h-4 w-4 mr-2" />
              Add New Organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Center section: Global Search Command Palette Bar */}
      <div className="flex-1 max-w-md mx-4 hidden sm:block">
        <button
          onClick={onOpenSearch}
          className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 text-xs text-muted-foreground transition-all hover:border-slate-300 hover:bg-surface shadow-2xs"
        >
          <div className="flex items-center space-x-2">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span>Search customers, invoices, quotes, items...</span>
          </div>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-surface px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right section: Actions & Profile */}
      <div className="flex items-center space-x-1.5">
        {/* Search button mobile icon */}
        <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8" onClick={onOpenSearch}>
          <Search className="h-4 w-4" />
        </Button>

        {/* Quick Create Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="accent" size="sm" className="h-8 text-xs font-semibold px-3">
              <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Create</span>
              <ChevronDown className="ml-1 h-3 w-3 opacity-80" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Quick Create</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onQuickActionSelect('invoice')}>
              <Receipt className="h-4 w-4 mr-2 text-blue-600" />
              New Invoice
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onQuickActionSelect('quote')}>
              <FilePlus className="h-4 w-4 mr-2 text-indigo-600" />
              New Quote
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onQuickActionSelect('customer')}>
              <UserPlus className="h-4 w-4 mr-2 text-emerald-600" />
              New Customer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onQuickActionSelect('item')}>
              <PackagePlus className="h-4 w-4 mr-2 text-amber-600" />
              New Item
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onQuickActionSelect('payment')}>
              <CreditCard className="h-4 w-4 mr-2 text-purple-600" />
              Record Payment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onQuickActionSelect('expense')}>
              <Plus className="h-4 w-4 mr-2 text-red-600" />
              Add Expense
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications Popover */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative text-slate-600 hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between p-3 border-b border-border bg-surface-hover/50">
              <span className="text-xs font-semibold">Notifications</span>
              <span className="text-[10px] text-accent font-medium cursor-pointer">Mark all as read</span>
            </div>
            <div className="divide-y divide-border max-h-64 overflow-y-auto">
              <div className="p-3 text-xs hover:bg-surface-hover/50 cursor-pointer">
                <p className="font-semibold text-foreground">Invoice INV-2026-001 Paid</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">Acme Solutions cleared ₹2,30,100 via NEFT.</p>
                <span className="text-[10px] text-slate-400 mt-1 block">10 mins ago</span>
              </div>
              <div className="p-3 text-xs hover:bg-surface-hover/50 cursor-pointer">
                <p className="font-semibold text-foreground">Invoice INV-2026-002 Overdue</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">Apex Cloud infrastructure invoice is overdue by 12 days.</p>
                <span className="text-[10px] text-slate-400 mt-1 block">2 hours ago</span>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help & Support Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-foreground">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Help & Support</DropdownMenuLabel>
            <DropdownMenuItem>Documentation & Guides</DropdownMenuItem>
            <DropdownMenuItem>API References</DropdownMenuItem>
            <DropdownMenuItem>Keyboard Shortcuts</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-accent">Contact Support Desk</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 px-1.5 flex items-center space-x-2 hover:bg-surface-hover">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                AD
              </div>
              <span className="hidden md:inline text-xs font-medium text-foreground">Vikram M.</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-2 border-b border-border">
              <p className="text-xs font-semibold">Vikram Malhotra</p>
              <p className="text-[11px] text-muted-foreground">vikram@acmesolutions.com</p>
            </div>
            <DropdownMenuItem>
              <User className="h-4 w-4 mr-2" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                const { signOutAction } = await import('@/app/(auth)/actions');
                await signOutAction();
              }}
              className="text-red-600 font-medium cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
