"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/admin/expeditions/lines', label: 'Lignes de transport' },
  { href: '/admin/expeditions/shipments', label: 'Expéditions / Embarquements' },
  { href: '/admin/expeditions/upcoming', label: 'Expéditions à venir' },
  { href: '/admin/expeditions/history', label: 'Historique' },
];

export default function ExpeditionsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="page-stack">
      <div className="tabs">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} className={`tab ${pathname.startsWith(tab.href) ? 'tab--active' : ''}`}>
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
