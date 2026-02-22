# DiaExpress Backend (Express + Mongo)

## Setup local

### Prérequis
- Node.js 18+
- MongoDB accessible (local ou distant)

### Installation
```bash
npm install
```

### Variables d’environnement
Copiez `.env.example` en `.env` et complétez les valeurs.

| Variable | Description | Défaut |
| --- | --- | --- |
| `PORT` | Port HTTP du serveur | `5000` |
| `MONGODB_URI` | URI MongoDB | — |
| `CORS_ORIGINS` | Origines CORS séparées par des virgules | — |
| `REQUEST_LOGGING` | Active les logs de requêtes | `true` |
| `ENABLE_QUOTE_ESTIMATION_PROBE` | Active le probe d’estimation | `false` |
| `DIAPAY_BASE_URL` | Base URL diaPay | — |
| `DIAPAY_WEBHOOK_SECRET` | Secret webhook diaPay | — |
| `DIAPAY_API_URL` | URL API diaPay | — |
| `DIAPAY_API_TIMEOUT` | Timeout API diaPay (ms) | — |
| `DIAPAY_API_KEY` | API key diaPay | — |
| `DIAPAY_BEARER_TOKEN` | Bearer token diaPay | — |
| `CLERK_SECRET_KEY` | Secret Clerk | — |
| `CLERK_JWT_ISSUER` | Issuer JWT Clerk | — |
| `CLERK_JWT_AUDIENCE` | Audience JWT Clerk | — |
| `CLERK_JWT_TEMPLATE` | Template JWT Clerk | — |
| `DIAEXPRESS_AUTH_MODE` | Mode auth interne | — |
| `DIAEXPRESS_AUTH_TOKENS` | Tokens internes | — |
| `DIAEXPRESS_AUTH_CLIENTS` | Clients OAuth internes | — |
| `ADMIN_DEFAULT_EMAIL` | Email admin seed | — |
| `ADMIN_DEFAULT_PASSWORD` | Password admin seed | — |
| `ADMIN_WHITELIST` | Emails admin whitelistes | — |
| `EMAIL_USER` | SMTP user | — |
| `EMAIL_PASS` | SMTP pass | — |
| `CMACGM_MODE` | Mode CMA CGM | — |
| `FEDEX_MODE` | Mode FedEx | — |
| `INTEGRATION_API_KEYS` | API keys d’intégrations | — |

### Lancer le serveur
```bash
npm run dev
```
Le serveur démarre par défaut sur le port **5000**.

### Seed admin
```bash
npm run seed:admin
```
Le seed est idempotent et crée/met à jour un compte admin basé sur `ADMIN_DEFAULT_EMAIL`.

## Auth & rôles

- **DiaExpress Auth** : tokens internes via `DIAEXPRESS_AUTH_TOKENS` / `DIAEXPRESS_AUTH_CLIENTS` (Bearer). Les routes utilisent `requireAuth` et `requireRole`.
- **Clerk JWT** : si aucun token interne, un JWT Clerk est vérifié et ses roles/metadata alimentent l’identité.
- **Source de vérité rôle** : `User.role` (`client`, `admin`, `delivery`), mis à jour via `syncUserFromIdentity`.

Pour le détail complet, voir `docs/security-audit.md`.

## Endpoints

- **Résumé** : routes publiques (estimation devis, tracking), routes utilisateur (quotes/shipments/addresses), routes admin (pricing, expeditions, admin quotes, users).
- **Documentation** : `docs/security-audit.md` contient la table “Endpoint / Méthode / Auth / Rôle / UI / Notes”.

## Troubleshooting

- **MONGODB_URI undefined** : vérifiez votre `.env`; le serveur refuse de démarrer si la variable est absente.
- **E11000 duplicate key** : vérifiez que l’email ou le clerkUserId n’existe pas déjà; exécutez le seed admin de façon idempotente.
- **Indexes** : `email` est unique, `clerkUserId`/`externalId` sont `sparse`.
- **Auth Clerk** : assurez-vous que les clés/issuers Clerk sont cohérents côté frontend.

## Scripts utiles
- `npm run dev` : démarre le serveur en mode développement
- `npm run start` : démarre le serveur
- `npm run test` : lance les tests Node
- `npm run lint` : placeholder lint (à configurer)

## Roadmap “Backend”

- **It1** : hardening auth/rbac + audit logs
- **It2** : quote lifecycle strict + transitions
- **It3** : pricing breakdown + explainability
- **It4** : embarkments/schedules + capacity/reservations
- **It5** : observability (pino, metrics, retries)

## How to split into separate repos
1. Copier le dossier `services/diaexpress-backend` dans un nouveau repo.
2. Conserver `package.json`, `package-lock.json`, `server.js` et les dossiers internes.
3. Configurer vos variables `.env` sur la nouvelle machine.
4. Mettre à jour votre CI/CD pour cibler ce dossier comme racine du projet.
