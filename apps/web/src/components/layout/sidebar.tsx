'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, PlusCircle, Users, Swords, Share2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/audits/new', label: 'New Audit', icon: PlusCircle },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/competitor', label: 'Competitor', icon: Swords },
  { href: '/social', label: 'Social', icon: Share2 },
  { href: '/google-business', label: 'Google Business', icon: MapPin },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">
          A
        </div>
        <span className="text-lg font-bold text-slate-900">ABAP</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <p className="text-xs text-slate-400">AI Business Audit Platform</p>
        <p className="text-xs text-slate-400 mt-1">v0.1.0 — MVP</p>
      </div>
    </aside>
  );
}
