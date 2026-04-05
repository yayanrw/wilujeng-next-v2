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

  const IconComponent =
    (
      Icons as unknown as Record<
        string,
        (p: { className?: string }) => ReactNode
      >
    )[storeIconName] ?? Icons.Store;

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Mobile sidebar overlay backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-zinc-950/50 backdrop-blur-sm transition-opacity lg:hidden",
          !sidebarCollapsed ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => toggleSidebar()}
      />

      <div
        className={cn(
          'flex min-h-dvh transition-[padding] duration-300 ease-in-out',
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]',
        )}
      >
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-[72px]" : "translate-x-0 w-[260px]"
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between px-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                <IconComponent className="h-5 w-5" />
              </div>
              <div 
                className={cn(
                  "flex min-w-0 flex-col transition-opacity duration-200",
                  sidebarCollapsed ? "lg:opacity-0 lg:hidden" : "opacity-100"
                )}
              >
                <div className="truncate text-sm font-semibold">
                  {storeName}
                </div>
                <div className="truncate text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                  {role}
                </div>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {navItems
              .filter((i) => (i.adminOnly ? role === 'admin' : true))
              .map((i) => {
                const active = pathname === i.href;
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    className={cn(
                      'flex items-center rounded-lg transition-colors relative group',
                      sidebarCollapsed ? 'lg:justify-center lg:px-0 lg:py-3 px-3 py-2' : 'px-3 py-2 gap-3',
                      active
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50',
                    )}
                    title={sidebarCollapsed ? i.label : undefined}
                    onClick={() => {
                      // Auto-close sidebar on mobile after clicking a link
                      if (window.innerWidth < 1024 && !sidebarCollapsed) {
                        toggleSidebar();
                      }
                    }}
                  >
                    <div className={cn("shrink-0", active ? "" : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-50")}>
                      {i.icon}
                    </div>
                    <span 
                      className={cn(
                        "text-sm font-medium whitespace-nowrap transition-all duration-200",
                        sidebarCollapsed ? "lg:hidden block" : "block"
                      )}
                    >
                      {i.label}
                    </span>
                  </Link>
                );
              })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white/80 backdrop-blur-md px-4 dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                aria-label="Toggle sidebar"
              >
                <Icons.Menu className="h-4 w-4" />
              </button>
              
              <div className="hidden sm:block min-w-0">
                <div className="truncate text-sm font-medium">{userName}</div>
                <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  Signed in
                </div>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-red-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-red-400"
              onClick={() =>
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => window.location.assign('/login'),
                  },
                })
              }
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </div>
  );
}
