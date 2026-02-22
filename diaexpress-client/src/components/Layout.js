import React from 'react';
import Link from 'next/link';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Dashboard</h2>
        <nav>
          <Link href="/">Accueil</Link>
          <Link href="/admin">Admin</Link>
          <Link href="/quote">Demander un devis</Link>
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
