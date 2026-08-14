'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Package,
  FileText,
  Receipt,
  CreditCard,
  PieChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
  PlusCircle,
  FileCheck2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserProfileData } from '@/app/app/layout';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { title: 'Home', href: '/app/home', icon: Home },
  { title: 'Customers', href: '/app/customers', icon: Users },
  { title: 'Items', href: '/app/items', icon: Package },
  { title: 'Quotes', href: '/app/quotes', icon: FileCheck2 },
  { title: 'Invoices', href: '/app/invoices', icon: Receipt },
  { title: 'Payments Received', href: '/app/payments', icon: CreditCard },
  { title: 'Expenses', href: '/app/expenses', icon: FileText },
  { title: 'Reports', href: '/app/reports', icon: PieChart },
];

const configNavItems: NavItem[] = [
  { title: 'Invoice Templates', href: '/app/templates', icon: Layers },
  { title: 'Business Settings', href: '/app/settings/business', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onOpenQuickCreate?: () => void;
  profile?: UserProfileData | null;
  loadingProfile?: boolean;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose,
  onOpenQuickCreate,
  profile,
  loadingProfile = false,
}: SidebarProps) {
  const pathname = usePathname();

  const initials = profile?.fullName
    ? profile.fullName
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : profile?.email
    ? profile.email.slice(0, 2).toUpperCase()
    : 'U';

  const displayName = profile?.fullName || profile?.email?.split('@')[0] || 'User Profile';
  const email = profile?.email || '';

  const renderNavItem = (item: NavItem) => {
    const isActive =
      item.href === '/app/settings/business' || item.href === '/app/settings'
        ? pathname.startsWith('/app/settings') && pathname !== '/app/settings/profile'
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;

    const content = (
      <Link
        href={item.href}
        onClick={onMobileClose}
        className={cn(
          'flex items-center rounded-lg px-3 py-2 text-xs font-medium transition-colors group relative',
          isActive
            ? 'bg-accent text-accent-foreground font-semibold shadow-xs'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white',
          collapsed && 'justify-center px-2'
        )}
      >
        <Icon className={cn('h-4 w-4 shrink-0', collapsed ? 'mr-0' : 'mr-3')} />
        {!collapsed && <span>{item.title}</span>}
        {!collapsed && item.badge && (
          <span className="ml-auto rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-200">
            {item.badge}
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="bg-slate-900 border-slate-700 text-white font-sans text-xs">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <React.Fragment key={item.href}>{content}</React.Fragment>;
  };

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-slate-800 bg-slate-900 text-white transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-60',
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-slate-800">
          <Link href="/app/home" className="flex items-center space-x-2.5 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 font-bold text-white shadow-sm shrink-0">
              S
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-white leading-none">
                  SMS Billing
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                  Enterprise SaaS
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={onToggleCollapse}
            className="hidden md:flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Quick Action Button */}
        {!collapsed && onOpenQuickCreate && (
          <div className="p-3">
            <button
              onClick={onOpenQuickCreate}
              className="flex w-full items-center justify-center space-x-2 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Quick Create</span>
            </button>
          </div>
        )}

        {/* Nav Items Scroll Container */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Main
              </div>
            )}
            {mainNavItems.map(renderNavItem)}
          </div>

          {/* Configuration Navigation */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Configuration
              </div>
            )}
            {configNavItems.map(renderNavItem)}
          </div>
        </div>

        {/* User Footer Summary */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white shrink-0 overflow-hidden">
              {profile?.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={profile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                {loadingProfile ? (
                  <div className="h-3.5 w-24 bg-slate-800 animate-pulse rounded my-1" />
                ) : (
                  <>
                    <span className="text-xs font-semibold text-slate-200 truncate">{profile?.username ? `@${profile.username}` : displayName}</span>
                    <span className="text-[10px] text-slate-400 truncate">{email}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
