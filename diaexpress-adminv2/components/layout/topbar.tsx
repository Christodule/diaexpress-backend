'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Menu, Search, Sparkles } from 'lucide-react';
import { navGroups } from '@/app/admin/navigation';

export function Topbar({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
  const pathname = usePathname();
  const navLinks = navGroups.flatMap((group) => group.links);
  const active = navLinks.find((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`));
  const activeLabel = active?.label ?? title;

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="icon-button" aria-label="Ouvrir le menu" onClick={onMenuClick}>
          <Menu size={18} />
        </button>
        <div>
          <div className="breadcrumbs">
            <span>Admin</span>
            {activeLabel ? <span>/ {activeLabel}</span> : null}
          </div>
          <div className="topbar__title">{activeLabel}</div>
          <div className="topbar__subtitle">Pilotage centralisé & opérations apaisées</div>
        </div>
      </div>

      <div className="topbar__actions">
        <Link className="button button--secondary" href="/admin/quotes?create=1">
          Nouveau devis
        </Link>
        <Link className="button button--ghost" href="/admin/expeditions#embarkment-form">
          Nouvel embarquement
        </Link>
        <button className="icon-button" aria-label="Recherche globale">
          <Search size={18} />
        </button>
        <button className="icon-button" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button className="icon-button" aria-label="Mises à jour">
          <Sparkles size={18} />
        </button>
      </div>
    </header>
  );
}
