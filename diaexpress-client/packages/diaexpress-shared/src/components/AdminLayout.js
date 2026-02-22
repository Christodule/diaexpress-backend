"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ClientOnly from './system/ClientOnly';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊', description: 'Vue globale' },
  { href: '/admin/quotes', label: 'Devis', icon: '🧾', description: 'Demandes clients' },
  { href: '/admin/shipments', label: 'Expéditions', icon: '🚚', description: 'Suivi logistique' },
  { href: '/admin/pricing', label: 'Tarifs', icon: '💶', description: 'Grilles de prix' },
  { href: '/admin/payments', label: 'Paiements', icon: '💳', description: 'Flux diaPay' },
  { href: '/admin/jobs', label: 'Jobs', icon: '⏱️', description: 'Notifications & batchs' },
  { href: '/admin/api-keys', label: 'API keys', icon: '🔑', description: 'Intégrations diaPay' },
  { href: '/admin/users', label: 'Utilisateurs', icon: '👥', description: 'Profils & accès' },
  { href: '/admin/settings', label: 'Paramètres', icon: '⚙️', description: 'Préférences' },
];

const AdminLayout = ({
  children,
  user,
  onSignOut,
  SignInButtonComponent,
  UserButtonComponent,
  isAuthReady = false,
}) => {
  const pathname = usePathname();
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  const authSlotReady = isClientReady && isAuthReady;

  const currentNav = useMemo(() => {
    return (
      NAV_ITEMS.find((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`)) ||
      NAV_ITEMS[0]
    );
  }, [pathname]);

  const handleSignOut = () => {
    if (typeof onSignOut === 'function') {
      onSignOut();
    }
  };

  const renderAuthSection = () => {
    if (!authSlotReady) {
      return (
        <div
          className="dx-admin-user dx-admin-user--placeholder"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="dx-admin-avatar-skeleton" aria-hidden="true" />
          <div className="dx-admin-user__meta">
            <span className="dx-admin-line dx-admin-line--full" aria-hidden="true" />
            <span className="dx-admin-line dx-admin-line--short" aria-hidden="true" />
          </div>
          <span
            className="dx-admin-button dx-admin-button--ghost dx-admin-button--skeleton"
            aria-hidden="true"
          />
        </div>
      );
    }

    if (user) {
      const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress;
      const name = user.fullName || user.firstName || 'Administrateur';
      const role = user.role || user.publicMetadata?.role;

      return (
        <div className="dx-admin-user">
          {UserButtonComponent ? <UserButtonComponent /> : null}
          <div className="dx-admin-user__meta">
            <strong>{name}</strong>
            {email ? <span>{email}</span> : null}
            {role ? (
              <span className="dx-admin-pill" data-role={role}>
                {role}
              </span>
            ) : null}
          </div>
          <button type="button" className="dx-admin-button dx-admin-button--ghost" onClick={handleSignOut}>
            Se déconnecter
          </button>
        </div>
      );
    }

    if (!SignInButtonComponent) {
      return null;
    }

    return (
      <SignInButtonComponent mode="modal">
        <button type="button" className="dx-admin-button">
          Se connecter
        </button>
      </SignInButtonComponent>
    );
  };

  return (
    <div className="dx-admin-layout">
      <aside className="dx-admin-sidebar">
        <div>
          <h1 className="dx-admin-sidebar__title">DiaExpress</h1>
          <p className="dx-admin-tag">Pilotage logistique</p>
        </div>
        <nav className="dx-admin-sidebar__nav">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`dx-admin-sidebar__link${isActive ? ' dx-admin-sidebar__link--active' : ''}`}
              >
                <span aria-hidden>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="dx-admin-sidebar__footer">
          <strong>Support logistique</strong>
          <div>support@diaexpress.com</div>
          <div>+225 01 02 03 04 05</div>
        </div>
      </aside>
      <div className="dx-admin-content">
        <header className="dx-admin-topbar">
          <div className="dx-admin-topbar__left">
            <span aria-hidden>{currentNav.icon}</span>
            <h2 className="dx-admin-topbar__title">{currentNav.label}</h2>
            <span className="dx-admin-pill">{currentNav.description}</span>
          </div>
          <div className="dx-admin-topbar__auth" suppressHydrationWarning>
            <ClientOnly>{renderAuthSection()}</ClientOnly>
          </div>
        </header>
        <main className="dx-admin-main">
          <div className="dx-admin-shell">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
