// 📁 src/components/Header.js
import React from 'react';
import Link from 'next/link';

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/quote-request', label: 'Demander un devis' },
  { href: '/track-shipment', label: 'Suivre un colis' },
];

const roleIcons = {
  admin: '⚙️',
  client: '👤',
  delivery: '🚚',
};

const Header = ({
  user,
  onSignOut,
  SignInButtonComponent,
  UserButtonComponent,
  isAuthReady = false,
}) => {
  const [isClientReady, setIsClientReady] = React.useState(false);

  React.useEffect(() => {
    setIsClientReady(true);
  }, []);

  const adminAppUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL || process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL;
  const canRenderAuth = isClientReady && isAuthReady;
  const resolvedUser = canRenderAuth ? user : null;
  const role = resolvedUser?.publicMetadata?.role || resolvedUser?.role || null;
  const email =
    resolvedUser?.primaryEmailAddress?.emailAddress ||
    resolvedUser?.emailAddresses?.[0]?.emailAddress ||
    resolvedUser?.email ||
    null;
  const displayName = resolvedUser?.fullName || resolvedUser?.firstName || 'Utilisateur DiaExpress';

  const handleSignOut = () => {
    if (typeof onSignOut === 'function') {
      onSignOut();
    }
  };

  const renderSkeleton = () => (
    <div className="dx-header__skeleton" aria-label="Chargement de l'état de connexion">
      <span className="dx-header__skeleton-avatar" />
      <span className="dx-header__skeleton-bar" />
      <span className="dx-header__skeleton-bar" />
    </div>
  );

  const renderSignIn = () => {
    if (!SignInButtonComponent) {
      return null;
    }

    return (
      <SignInButtonComponent mode="modal">
        <button type="button" className="dx-button-inline">Se connecter</button>
      </SignInButtonComponent>
    );
  };

  const renderUser = () => (
    <>
      {UserButtonComponent ? <UserButtonComponent /> : null}
      <div className="dx-header__auth-meta">
        <strong>{displayName}</strong>
        {email ? <span>{email}</span> : null}
        {role ? (
          <span className="dx-pill" data-role={role}>
            <span aria-hidden>{roleIcons[role] || '✅'}</span>
            {role}
          </span>
        ) : null}
      </div>
      <button type="button" className="dx-button-inline dx-button-inline--ghost" onClick={handleSignOut}>
        Déconnexion
      </button>
    </>
  );

  const extraLinks = [];
  if (resolvedUser) {
    extraLinks.push({ href: '/profile/addresses', label: 'Mes adresses' });
  }
  if (resolvedUser && adminAppUrl && role === 'admin') {
    extraLinks.push({ href: adminAppUrl, label: 'Admin', external: /^https?:\/\//i.test(adminAppUrl) });
  }
  if (resolvedUser && role === 'delivery') {
    extraLinks.push({ href: '/delivery', label: 'Espace livreur' });
  }

  return (
    <header className="dx-header">
      <div className="dx-header__inner">
        <div className="dx-header__brand">
          <Link href="/" aria-label="Retour à l'accueil DiaExpress">
            <span className="dx-badge">DiaExpress</span>
          </Link>
        </div>
        <nav className="dx-header__nav" aria-label="Navigation principale">
          {[...NAV_LINKS, ...extraLinks].map((link) => {
            const isExternal = Boolean(link.external);
            return (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noreferrer' : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="dx-header__actions" suppressHydrationWarning>
          {!canRenderAuth ? renderSkeleton() : resolvedUser ? renderUser() : renderSignIn()}
        </div>
      </div>
    </header>
  );
};

export default Header;
