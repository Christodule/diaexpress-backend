# DiaExpress admin remaster – cartographie initiale

## Backend logistique : routes et endpoints existants
- **Quotes** (`routes/quotes.js`)
  - `POST /api/quotes` (création publique/auth optionnelle) ; `POST /api/quotes/estimateQuote` et alias `/estimate` pour l'estimation ; `GET /api/quotes` ou `/all` réservé admin ; `GET /api/quotes/meta` méta ; `GET /api/quotes/me` pour l'utilisateur connecté ; `GET /api/quotes/:id` détail ; actions admin `confirm/reject/dispatch`, mise à jour `PATCH /:id/status` et `PATCH /:id`, suppression et paiement `POST /:id/pay`.【F:routes/quotes.js†L2-L49】
- **Shipments** (`routes/shipments.js`)
  - Création depuis un devis `POST /api/shipments/from-quote` (+ alias `/create-from-quote`), récupération `GET /api/shipments/me` pour l'utilisateur, listing admin `GET /api/shipments`, mise à jour du statut, ajout d'historique et suppression administrateur.【F:routes/shipments.js†L2-L30】
- **Pricing** (`routes/pricing.js`)
  - Routes publiques pour les corridors `/routes`, locations et entrepôts ; CRUD complet admin `/api/pricing` avec lecture par ID et suppression ; récupération des routes publiques `/public/routes`.【F:routes/pricing.js†L16-L87】
- **Package types** (`routes/packageType.js`)
  - Liste publique `/api/package-types`, CRUD sécurisé pour l'admin (create/update/delete).【F:routes/packageType.js†L1-L15】
- **Adresses** (`routes/addresses.js`)
  - CRUD authentifié `/api/addresses` pour gérer les adresses liées aux utilisateurs (list, create, getOne, update, delete).【F:routes/addresses.js†L1-L15】
- **Public catalog / FX** (`routes/v1/public.js`)
  - Expose `/api/v1/public/services` (catalogue construit depuis `PackageType`/`Pricing`) et `/api/v1/public/rates` via `publicFxService` pour les taux de change et libellés transport/conditions.【F:routes/v1/public.js†L1-L200】
- **Paiements** (`routes/payments.js`)
  - Création d’un paiement diaPay `POST /api/payments/create`, synchronisation statut et mapping quote/paiement (service `paymentWorkflowService`), plus webhook callbacks (cf. README).【F:routes/payments.js†L1-L200】【F:README.md†L71-L115】

## Interfaces Next.js actuelles
- **Admin (Pages Router)** : pages minces enveloppant les vues partagées.
  - `/` (`pages/index.js`) rend `AdminPage` via `AdminAccess` (guard).【F:apps/diaexpress-admin/pages/index.js†L1-L10】
  - `/quotes`, `/shipments`, `/pricing`, `/users` etc. réutilisent les écrans du kit partagé (`@diaexpress/shared/pages/*`).【F:apps/diaexpress-admin/pages/quotes.js†L1-L10】【F:apps/diaexpress-admin/pages/shipments.js†L1-L10】【F:apps/diaexpress-admin/pages/pricing.js†L1-L10】
- **Client app** : non encore explorée en détail dans ce scan, mais palette/UX à aligner (cf. kit partagé).【F:README.md†L32-L48】

## Kit partagé `@diaexpress/shared`
- Composants et pages réutilisables dans `packages/diaexpress-shared/src/pages`, incluant déjà `AdminPage`, `AdminQuotes`, `AdminShipments`, `AdminPricing`, `AdminPackageType`, `AdminSchedules`, etc., basés sur des hooks d’auth admin et des appels API logistiques/diaPay.
  - Exemple : `AdminPage` agrège quotes, shipments et pricing pour le dashboard de base via `fetchAdminQuotes/Shipments/Pricing` et `fetchCurrentUser`.【F:packages/diaexpress-shared/src/pages/AdminPage.js†L1-L90】
  - `AdminShipments` propose filtres (status, destination, provider, transport), pagination locale et actions (mise à jour statut, suppression) en s’appuyant sur `api/logistics`.【F:packages/diaexpress-shared/src/pages/AdminShipments.js†L1-L83】

## Gaps identifiés pour la refonte demandée
- L’admin repose encore sur le Pages Router et se limite aux écrans partagés existants : absence d’App Router, de layout global (sidebar/header), et d’écrans dédiés pour CMA CGM, jobs diaPay, API keys, webhooks, health, FX, catalogues publics détaillés, détails quote/shipment, et pages de suivi/paiements diaPay enrichies.
- Les endpoints décrits dans le README (diaPay `/v1/admin/*`, callbacks, CMA CGM) ne sont pas exposés dans l’UI actuelle ; la navigation n’est pas structurée en sections LOGISTIQUE/PAIEMENTS/OBSERVABILITÉ/CONFIGURATION comme demandé.
- Les styles admin se limitent à `src/styles/admin.css` et aux composants partagés : pas encore d’alignement explicite avec la palette/tokens de l’app client pour la cohérence DiaExpress.

## Pistes de couverture future
- Migrer l’admin vers l’App Router avec layout, sidebar et header globaux, tout en réutilisant `@diaexpress/shared` pour accélérer les pages logistiques existantes.
- Brancher des data providers uniformes (backend logistique + diaPay `/v1/admin` + CMA CGM + endpoints publics) avec filtres/pagination alignés sur les paramètres API.
- Ajouter les pages manquantes : détails quote/shipment, pricing avancé (dimensionRanges), package types CRUD, CMA CGM sandbox/schedules/tracking, catalogues publics & FX, paiements diaPay (list + détail), jobs de notifications, API keys, utilisateurs diaPay/DiaExpress, adresses, webhooks, health/env-check.
