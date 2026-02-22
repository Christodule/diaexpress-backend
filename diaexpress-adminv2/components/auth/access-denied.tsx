import Link from 'next/link';

export function AccessDenied() {
  return (
    <div className="page-stack">
      <div className="panel">
        <h1 className="panel__title">Access denied</h1>
        <p className="panel__muted">
          Votre compte est authentifié mais ne possède pas le rôle administrateur requis pour accéder à cette section.
        </p>
        <div className="panel__actions">
          <Link className="button button--secondary" href="/sign-in">
            Changer de compte
          </Link>
          <Link className="button button--ghost" href="/">
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
