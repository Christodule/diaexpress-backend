'use client';

import { useMemo, useState } from 'react';
import { navGroups } from '@/app/admin/navigation';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { ToastProvider } from '@/components/ui/toast';

export function AppShell({ title = 'DiaExpress Admin', children }: { title?: string; children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const nav = useMemo(
    () => navGroups.filter((group) => !(group.devOnly && process.env.NODE_ENV === 'production')),
    []
  );

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar
          groups={nav}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <div>
          <Topbar title={title} onMenuClick={() => setIsSidebarOpen((open) => !open)} />
          <main className="main">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
