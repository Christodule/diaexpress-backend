"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/admin/quotes', label: 'Devis', icon: '🧾' },
  { href: '/admin/shipments', label: 'Expéditions', icon: '📦' },
];

const AdminHeader = ({ user, onSignOut, SignInButtonComponent, UserButtonComponent }) => {
  const pathname = usePathname();

  const handleSignOut = () => {
    if (typeof onSignOut === 'function') {
      onSignOut();
    }
  };

  return (
    <header className="dx-admin-topbar">
      <nav className="dx-admin-topbar__nav">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={isActive ? 'dx-admin-topbar__link active' : 'dx-admin-topbar__link'}
            >
              <span aria-hidden>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="dx-admin-user" suppressHydrationWarning>
        {user ? (
          <>
            {UserButtonComponent ? <UserButtonComponent /> : null}
            <div className="dx-admin-user__meta">
              <strong>{user.fullName || user.firstName || 'Administrateur'}</strong>
              <span>{user.primaryEmailAddress?.emailAddress || 'Utilisateur connecté'}</span>
            </div>
            <button type="button" className="dx-admin-button dx-admin-button--ghost" onClick={handleSignOut}>
              Déconnexion
            </button>
          </>
        ) : SignInButtonComponent ? (
          <SignInButtonComponent mode="modal">
            <button type="button" className="dx-admin-button">
              Connexion
            </button>
          </SignInButtonComponent>
        ) : null}
      </div>
    </header>
  );
};

export default AdminHeader;
