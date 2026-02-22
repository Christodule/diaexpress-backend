import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="page-stack">
      <div className="panel">
        <h1 className="panel__title">Connexion admin</h1>
        <p className="panel__muted">Authentifiez-vous avec votre compte DiaExpress Admin.</p>
        <div style={{ marginTop: '1.5rem' }}>
          <SignIn routing="path" path="/sign-in" />
        </div>
      </div>
    </div>
  );
}
