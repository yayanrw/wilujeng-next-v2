'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import * as Icons from 'lucide-react';
import {
  BarChart3,
  Box,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react';

import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/uiStore';

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  { href: '/pos', label: 'POS', icon: <ShoppingCart className="h-4 w-4" /> },
  { href: '/products', label: 'Products', icon: <Box className="h-4 w-4" /> },
  { href: '/stock', label: 'Stock', icon: <Package className="h-4 w-4" /> },
  {
    href: '/customers',
    label: 'Customers',
    icon: <Users className="h-4 w-4" />,
  },
  {
    href: '/reports',
    label: 'Reports',
    icon: <BarChart3 className="h-4 w-4" />,
    adminOnly: true,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: <Settings className="h-4 w-4" />,
    adminOnly: true,
  },
];

export function AppShell({
  children,
  storeName,
  storeIconName,
  userName,
  role,
}: {
  children: ReactNode;
  storeName: string;
  storeIconName: string;
  userName: string;
  role: 'admin' | 'cashier';
}) {
  const pathname = usePathname();
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  const Icon =
    (
      Icons as unknown as Record<
        string,
        (p: { className?: string }) => ReactNode
      >
    )[storeIconName] ?? Icons.Store;

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div
        className={cn(
          'grid min-h-dvh',
          sidebarCollapsed ? 'grid-cols-[72px_1fr]' : 'grid-cols-[260px_1fr]',
        )}
      >
        <aside className="border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-16 items-center gap-2 px-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              <Icon className="h-5 w-5" />
            </div>
            {!sidebarCollapsed ? (
              <div className="flex min-w-0 flex-col">
                <div className="truncate text-sm font-semibold">
                  {storeName}
                </div>
                <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {role}
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={toggleSidebar}
              className={cn(
                'ml-auto rounded-md border border-zinc-200 bg-white p-2 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
                sidebarCollapsed ? 'mx-auto' : '',
              )}
              aria-label="Toggle sidebar"
            >
              <Package className="h-4 w-4" />
            </button>
          </div>
          <nav className="px-2 pb-4">
            {navItems
              .filter((i) => (i.adminOnly ? role === 'admin' : true))
              .map((i) => {
                const active = pathname === i.href;
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    className={cn(
                      'mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
                    )}
                  >
                    {i.icon}
                    {!sidebarCollapsed ? <span>{i.label}</span> : null}
                  </Link>
                );
              })}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{userName}</div>
              <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                Signed in
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              onClick={() =>
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => window.location.assign('/login'),
                  },
                })
              }
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </header>
          <main className="flex min-w-0 flex-1 flex-col p-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
