# DiaExpress Client (Next.js)

Portail client/public (quotes, tracking, paiements, dashboard).

## Setup local
```bash
cd apps/diaexpress-client
npm install
npm run dev
```

### Configuration
1. Copiez `.env.example` en `.env`.
2. Renseignez la base API (`NEXT_PUBLIC_DIAEXPRESS_API_BASE_URL`).
3. Configurez Clerk (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`) si l'auth est activée.

### Ports
- Développement : `http://localhost:3000` (Next.js par défaut)
- Production : `npm run build && npm start` (même port si `PORT` est défini)

## Auth client + stockage token

- **Clerk** : le client utilise Clerk pour la session et récupère un Bearer token via `useBackendAuth`.
- **Backend** : les appels API sont envoyés en `Authorization: Bearer <token>` lorsque l’utilisateur est signé.
- **Fallback** : en environnement dev sans Clerk, `useBackendAuth` peut activer un mode local.

## Pages + endpoints

- **Quotes** (wizard) : `POST /api/quotes`, `POST /api/quotes/estimate`, `GET /api/quotes/me`.
- **Tracking** : `GET /api/tracking/:code`.
- **Shipments** : `GET /api/shipments/me`.
- **Addresses** : `GET/POST/PATCH/DELETE /api/addresses`.
- **Payments** : `POST /api/payments/create`, `GET /api/payments/mine`.

## Roadmap “Client”

- **quote request UX** (smooth wizard)
- **tracking UI** (timeline)
- **documents upload for reservation**
- **payment UX diaPay** (redirects + status)

## Troubleshooting
- **API non joignable** : vérifiez `NEXT_PUBLIC_DIAEXPRESS_API_BASE_URL`.
- **Auth Clerk** : assurez-vous que `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` est défini.
- **Imports partagés** : le package est local dans `packages/diaexpress-shared`.

## Scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`

## How to split into separate repos
1. Copier le dossier `apps/diaexpress-client` dans un nouveau repo.
2. Conserver `packages/diaexpress-shared` (vendored) pour conserver les imports `@diaexpress/shared`.
3. Ajouter votre `.env` à partir de `.env.example`.
4. Mettre à jour la CI/CD pour utiliser ce dossier comme racine du projet.
