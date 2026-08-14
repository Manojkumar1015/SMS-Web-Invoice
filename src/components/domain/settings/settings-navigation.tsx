'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Building2,
  Receipt,
  FilePlus,
  Percent,
  CreditCard,
  Tag,
  Palette,
  Users,
  Bell,
  ShieldCheck,
} from 'lucide-react';

interface SettingsNavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const navItems: SettingsNavItem[] = [
  { title: 'Business Profile', href: '/app/settings/business', icon: Building2 },
  { title: 'Invoice Settings', href: '/app/settings/invoice', icon: Receipt },
  { title: 'Quote Settings', href: '/app/settings/quotes', icon: FilePlus },
  { title: 'Taxes & GST', href: '/app/settings/taxes', icon: Percent },
  { title: 'Payment Methods', href: '/app/settings/payments', icon: CreditCard },
  { title: 'Expense Categories', href: '/app/settings/expenses', icon: Tag },
  { title: 'Templates', href: '/app/settings/templates', icon: Palette },
  { title: 'Users & Roles', href: '/app/settings/users', icon: Users },
  { title: 'Notifications', href: '/app/settings/notifications', icon: Bell },
  { title: 'Security', href: '/app/settings/security', icon: ShieldCheck },
];

export function SettingsNavigation() {
  const pathname = usePathname();

  return (
    <nav className="w-full lg:w-64 shrink-0 space-y-1">
      <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 gap-1 border-b lg:border-b-0 border-slate-200">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (pathname === '/app/settings' && item.href === '/app/settings/profile');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
