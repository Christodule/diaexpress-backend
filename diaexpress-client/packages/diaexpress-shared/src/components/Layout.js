import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Dashboard</h2>
        <nav>
          <a href="/">Accueil</a>
          <a href="/admin">Admin</a>
          <a href="/quote">Demander un devis</a>
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
