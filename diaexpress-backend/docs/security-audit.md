# Security audit — Auth & RBAC

## 1) Mécanismes d'auth réellement utilisés

**Backend (Express)**
- **DiaExpress Auth interne (Bearer)** : les tokens sont chargés depuis `DIAEXPRESS_AUTH_TOKENS` et `DIAEXPRESS_AUTH_CLIENTS` (ou fixtures sandbox) puis résolus via `services/diaexpressAuthService`. Les routes lisent `Authorization: Bearer <token>`.【F:services/diaexpress-backend/config/diaexpressAuth.js†L1-L182】【F:services/diaexpress-backend/services/diaexpressAuthService.js†L1-L679】
- **Clerk JWT (Bearer)** : si aucun token interne n'est trouvé, un JWT Clerk est vérifié via `@clerk/backend` (issuer, audience, templates). Les rôles peuvent venir des claims/metadata. Les tokens restent des Bearer tokens côté API.【F:services/diaexpress-backend/services/diaexpressAuthService.js†L248-L451】
- **Clés d'intégration (x-api-key)** : certaines routes acceptent `x-api-key`/`x-partner-key` via `middleware/auth` pour les appels machine-to-machine.【F:services/diaexpress-backend/middleware/auth.js†L5-L183】

**Admin v2 (Next.js)**
- **Clerk (App Router)** : la route `/admin/*` exige une session Clerk + rôle admin (claims). Les utilisateurs non-auth sont redirigés vers `/sign-in` et les non-admin voient « Access denied ».【F:apps/diaexpress-adminv2/app/admin/layout.tsx†L1-L20】
- **Bearer token pour l'API** : les requêtes API injectent un token Clerk si disponible (fallback `NEXT_PUBLIC_ADMIN_BEARER_TOKEN`).【F:apps/diaexpress-adminv2/lib/api/auth.ts†L1-L60】【F:apps/diaexpress-adminv2/lib/api/client.ts†L56-L90】【F:apps/diaexpress-adminv2/src/config/api.ts†L40-L69】

## 2) Cartographie des rôles (source de vérité)

- **Source backend** : `User.role` (enum `client`, `admin`, `delivery`).【F:services/diaexpress-backend/models/User.js†L1-L52】
- **Source identité** : les rôles viennent du token Bearer (claims internes ou Clerk). `syncUserFromIdentity` normalise le rôle primaire et alimente `User.role` (ou admin via whitelist).【F:services/diaexpress-backend/services/userIdentityService.js†L50-L284】
- **Règles d'accès** : `requireAuth` vérifie `identity + user`, `requireRole('admin')` refuse 403 si rôle insuffisant, en incluant la logique « admin » prioritaire.【F:services/diaexpress-backend/middleware/auth.js†L35-L133】

## 3) Points d'entrée backend « protégés »

> Les routes admin utilisent `requireAuth` + `requireRole('admin')` sauf indication contraire.

- **Quotes admin** : `/api/quotes` (GET, PATCH, confirm/reject/dispatch, delete), `/api/admin/quotes/*` (legacy).【F:services/diaexpress-backend/routes/quotes.js†L10-L47】【F:services/diaexpress-backend/routes/adminQuotes.js†L1-L15】
- **Shipments** : `/api/shipments` (GET admin) + endpoints admin (status/history/assign/delete).【F:services/diaexpress-backend/routes/shipments.js†L11-L34】
- **Pricing** : `/api/pricing` (CRUD admin) + `/api/pricing/meta` admin.【F:services/diaexpress-backend/routes/pricing.js†L58-L87】
- **Expeditions** : `/api/expeditions/*` (admin) + `/api/admin/expedition-lines`, `/api/admin/embarkments`, `/api/admin/addresses` (admin).【F:services/diaexpress-backend/routes/expeditions.js†L44-L217】【F:services/diaexpress-backend/routes/logisticsAdmin.js†L1-L402】
- **Référentiels** : `/api/admin/market-points` (admin) et `/api/admin/countries` (admin).【F:services/diaexpress-backend/routes/marketPoints.js†L1-L9】【F:services/diaexpress-backend/routes/logisticsAdmin.js†L19-L90】
- **Admin v1 API** : `/api/v1/admin/*` (admin strict).【F:services/diaexpress-backend/routes/v1/admin.js†L1-L38】

## 4) Vérification admin v2

- **Protection serveur** : `app/admin/layout.tsx` impose session Clerk + rôle admin; sinon redirect `/sign-in` ou Access denied.【F:apps/diaexpress-adminv2/app/admin/layout.tsx†L1-L20】
- **Protection client** : les fetchs admin déclenchent une redirection `/sign-in` (401) ou `/access-denied` (403).【F:apps/diaexpress-adminv2/lib/api/auth.ts†L41-L60】
- **Hydration** : pas d'utilisation de `SignInButton` dans un composant serveur; l'écran sign-in est isolé et basé sur le composant Clerk `SignIn`.【F:apps/diaexpress-adminv2/app/sign-in/[[...sign-in]]/page.tsx†L1-L15】

## 5) Endpoint map (audit réel)

| Endpoint | Méthode | Auth requise | Rôle | UI consommatrice | Notes |
| --- | --- | --- | --- | --- | --- |
| `/api/quotes` | GET | Oui | admin | Admin v2 (Dashboard/Quotes) | Listing complet admin. |
| `/api/quotes` | POST | Optionnelle | client/service | Client + Admin v2 | Création devis (auth optionnelle). |
| `/api/quotes/:id` | GET | Oui | admin ou owner | Admin v2 | Détail devis. |
| `/api/quotes/:id/confirm` | POST | Oui | admin | Admin v2 | Validation admin. |
| `/api/quotes/:id/reject` | POST | Oui | admin | Admin v2 | Rejet admin. |
| `/api/quotes/:id/dispatch` | POST | Oui | admin | Admin v2 | Dispatch admin. |
| `/api/shipments` | GET | Oui | admin | Admin v2 | Liste shipments. |
| `/api/shipments/:id/status` | PATCH | Oui | admin | Admin v2 | Mise à jour statut. |
| `/api/shipments/:id/history` | POST | Oui | admin | Admin v2 | Ajout historique. |
| `/api/shipments/:id/assign-embarkment` | PATCH | Oui | admin | Admin v2 | Assignation embarquement. |
| `/api/pricing` | GET | Oui | admin | Admin v2 | Listing pricing. |
| `/api/pricing` | POST | Oui | admin | Admin v2 | Création pricing. |
| `/api/pricing/meta` | GET | Oui | admin | Admin v2 | Métadonnées pricing. |
| `/api/package-types` | GET | Oui | admin | Admin v2 | Gabarits colis. |
| `/api/package-types` | POST | Oui | admin | Admin v2 | CRUD package types. |
| `/api/expeditions/transport-lines` | GET | Oui | admin | Admin v2 | Lignes transport. |
| `/api/admin/embarkments` | GET | Oui | admin | Admin v2 | Embarquements. |
| `/api/admin/market-points` | GET | Oui | admin | Admin v2 | Référentiel hubs. |
| `/api/admin/countries` | GET | Oui | admin | Admin v2 | Référentiel pays. |
| `/api/addresses` | GET | Oui | auth | Client + Admin v2 | Adresses utilisateur. |
| `/api/payments/create` | POST | Oui | client | Client | Init paiement. |
| `/api/payments/mine` | GET | Oui | client | Client | Historique paiement. |
| `/api/v1/admin/payments` | GET | Oui | admin | Admin v2 | Paiements diaPay. |
| `/api/v1/admin/api-keys` | GET | Oui | admin | Admin v2 | Clés API diaPay. |
| `/api/v1/admin/users` | GET | Oui | admin | Admin v2 | Admin users diaPay. |

## 6) Failles potentielles / risques

1. **Uploads publics** : `/api/uploads` n'impose pas d'authentification, ce qui permet d'uploader des fichiers sans contrôle. À décider si ce flux est volontairement public ou à restreindre (admin ou utilisateur auth).【F:services/diaexpress-backend/routes/uploads.js†L1-L7】
2. **JWT Clerk sans rôle** : si le template JWT n'expose pas de rôle/metadata, l'admin v2 refusera l'accès. Vérifier le template Clerk côté dashboard (claims `role` ou `roles`).【F:apps/diaexpress-adminv2/lib/auth/roles.ts†L1-L43】
3. **Dépendance au token côté admin** : un fallback `NEXT_PUBLIC_ADMIN_BEARER_TOKEN` reste possible; s'assurer qu'il n'est pas publié en production ou remplacer par token Clerk. (OK en local/dev).【F:apps/diaexpress-adminv2/lib/api/auth.ts†L1-L60】

## 7) Recommandations minimales

- Protéger `/api/uploads` si ce flux est destiné aux admins uniquement.
- Vérifier le template Clerk JWT pour inclure `role`/`roles` (public ou session claims).
- Aligner le fallback token admin sur un environnement de dev uniquement.

