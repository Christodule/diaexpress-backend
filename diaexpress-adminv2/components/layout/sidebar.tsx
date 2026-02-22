'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './brand';
import type { NavGroup } from '@/app/admin/navigation';

export function Sidebar({
  groups,
  isOpen,
  onClose
}: {
  groups: NavGroup[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar__brand">
        <Logo />
        <div>
          <div className="sidebar__title">DiaExpress</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Admin v2</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {groups.map((group) => (
          <div className="nav-group" key={group.label}>
            <span className="nav-group__label">{group.label}</span>
            {group.links.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActive ? 'nav-link--active' : ''}`}
                  onClick={onClose}
                >
                  <Icon />
                  <span>{item.label}</span>
                  {item.badge ? <span className="chip">{item.badge}</span> : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        Console Calm Ops pour piloter la logistique, les paiements et les référentiels.
        <br />
        <strong>Lisible, stable, opérationnelle.</strong>
      </div>
    </aside>
  );
}
