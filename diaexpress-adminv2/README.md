# DiaExpress Admin v2

Console Next.js 14 (App Router) pour l'administration logistique et diaPay. L'interface admin v2 est accessible sous le segment `/admin` et utilise une sidebar commune + un header par page.

## Setup local

```bash
cd apps/diaexpress-adminv2
npm install
npm run dev
```

Si Next.js remonte des erreurs de routes en doublon ou des artefacts de cache, lancez :

```bash
npm run dev:clean
```

### Configuration
1. Copiez `.env.example` en `.env` et complétez les valeurs.
2. Démarrez l’app avec `npm run dev`.

### Ports
- Développement : `http://localhost:3000` (Next.js par défaut)
- Production : `npm run build && npm start` (même port si `PORT` est défini)

### Troubleshooting
- **401** : token expiré → reconnectez-vous (redirect automatique `/sign-in`).
- **403** : accès refusé → vérifiez le rôle admin (Clerk) ou le token Bearer.
- **API non joignable** : vérifiez `NEXT_PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_DIAPAY_ADMIN_API_BASE_URL` + CORS backend.
- **Erreurs de build** : supprimez `.next` avec `npm run dev:clean`.
- **Auth Clerk** : assurez-vous que les clés Clerk sont correctement définies dans `.env`.

## Auth admin (routes protégées)

- **/admin/*** exige une session Clerk. Si l’utilisateur n’est pas authentifié, redirection `/sign-in`.
- **Rôle admin** : le rôle est déduit des claims Clerk (`role`/`roles`) et doit inclure `admin`.
- **Non-admin** : affichage “Access denied”.
- **API** : un helper central (`lib/api/auth.ts`) injecte le Bearer token (Clerk ou fallback `NEXT_PUBLIC_ADMIN_BEARER_TOKEN`) et redirige sur 401/403.

## Pages disponibles + endpoints utilisés par page

> Détail complet : `docs/api-contract.md`.

### `/admin` (dashboard)
- `GET /api/quotes`
- `GET /api/shipments`
- `GET /payments/summary` (diaPay admin via `NEXT_PUBLIC_DIAPAY_ADMIN_API_BASE_URL`)

### `/admin/quotes`
- `GET /api/quotes`
- `GET /api/quotes/meta`
- `POST /api/quotes/estimate`
- `POST /api/quotes`
- `POST /api/quotes/:id/confirm`
- `POST /api/quotes/:id/reject`
- `PATCH /api/quotes/:id`
- `POST /api/shipments/from-quote`

### `/admin/shipments`
- `GET /api/shipments`
- `GET /api/shipments/:id`
- `PATCH /api/shipments/:id/status`
- `POST /api/shipments/:id/history`
- `PATCH /api/shipments/:id/assign-embarkment`

### `/admin/expeditions`
- `GET/POST/PUT/DELETE /api/expeditions/transport-lines`
- `GET/POST/PATCH/DELETE /api/admin/embarkments`
- `GET /api/admin/market-points`
- `GET /api/admin/countries`

### `/admin/pricing`
- `GET /api/pricing`
- `POST /api/pricing`
- `GET /api/package-types`

### Référentiels (users, addresses, market-points, countries)
- `GET /api/admin/users`
- `GET/POST/PATCH/DELETE /api/admin/addresses`
- `GET/POST/PATCH/DELETE /api/admin/market-points`
- `GET/POST/PATCH/DELETE /api/admin/countries`

### DiaPay admin
- `GET /payments`
- `GET /payments/:id`
- `GET /payments/:id/events`
- `GET /notifications/jobs`
- `GET /api-keys`
- `GET /users`

### API Health (dev-only)
- `/admin/api-health` → ping `/api/health` puis fallback `/api/v1/public/services`

## UX patterns

- **Tables** : listes paginées avec filtres et lignes actionnables.
- **Drawers** : détails + actions (quotes, shipments).
- **Badges** : statuts normalisés (quote, payment, shipment).
- **Toasts** : feedback success/error centralisé.

## Configuration API

Un client HTTP unique est disponible via `lib/api/client.ts` (base URL, JSON, erreurs, header `Authorization`).

| Variable | Rôle | Exemple |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Base API logistique principale | `http://localhost:4000` |
| `NEXT_PUBLIC_ADMIN_API_BASE_URL` | Alias admin (si utilisé) | `http://localhost:4000` |
| `NEXT_PUBLIC_LOGISTICS_API_BASE_URL` | Fallback logistique (legacy) | `http://localhost:4000` |
| `NEXT_PUBLIC_DIAPAY_ADMIN_API_BASE_URL` | Base diaPay Admin | `http://localhost:4001/v1/admin` |
| `NEXT_PUBLIC_ADMIN_BEARER_TOKEN` | Token admin fallback (dev) | `super-secret-token` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Publishable key Clerk | `pk_test_...` |
| `NEXT_PUBLIC_CLERK_JWT_TEMPLATE` | Template JWT Clerk (si requis) | `admin` |

## Roadmap “API reliability”

- **It1** : client API unique + mapping endpoints validés
- **It2** : retries contrôlés + cache léger (SWR/React Query)
- **It3** : observabilité (logs corrélés, traces, alertes)
- **It4** : stratégie de backoff + rate limiting côté client

## How to split into separate repos
1. Copier le dossier `apps/diaexpress-adminv2` dans un nouveau repo.
2. Conserver `package.json`, `package-lock.json`, `next.config.mjs`, `tsconfig.json` et `.eslintrc.json`.
3. Ajouter `.env` sur la nouvelle machine à partir de `.env.example`.
4. Mettre à jour votre CI/CD pour utiliser ce dossier comme racine du projet.
