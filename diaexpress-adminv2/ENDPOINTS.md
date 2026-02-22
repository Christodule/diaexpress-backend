# DiaExpress Admin v2 – Endpoints vérifiés

Cette liste recense les routes Express réellement exposées par le backend logistique (`${NEXT_PUBLIC_LOGISTICS_API_BASE_URL}`) afin d'aligner l'admin v2 sur les APIs existantes.

## Quotes

| Méthode | Path | Notes |
| --- | --- | --- |
| GET | `/api/quotes` | Liste complète (admin). Alias `/api/quotes/all`. |
| GET | `/api/quotes/me` | Devis du user authentifié. |
| GET | `/api/quotes/:id` | Détail d'un devis (admin ou propriétaire). |
| POST | `/api/quotes` | Création de devis (auth optionnelle via identité DiaExpress). |
| POST | `/api/quotes/estimate` | Estimation tarifaire (alias `/api/quotes/estimateQuote`). |
| GET | `/api/quotes/meta` | Métadonnées lanes/packageTypes pour le wizard. |
| POST | `/api/quotes/:quoteId/confirm` | Validation admin + prix final. |
| POST | `/api/quotes/:quoteId/reject` | Rejet admin. |
| POST | `/api/quotes/:quoteId/dispatch` | Marquer comme expédié + tracking. |
| PATCH | `/api/quotes/:id/status` | Mise à jour rapide du statut. |
| DELETE | `/api/quotes/:id` | Suppression admin. |
| POST | `/api/quotes/:id/pay` | Paiement côté client. |

Routes legacy admin : `/api/admin/quotes` (liste, update, approve/reject/dispatch/tracking).

## Shipments & tracking

| Méthode | Path | Notes |
| --- | --- | --- |
| POST | `/api/shipments/from-quote` | Création d'un shipment depuis un devis (alias `/create-from-quote`). |
| GET | `/api/shipments/me` | Expéditions du user courant. |
| GET | `/api/shipments` | Liste admin. |
| PATCH | `/api/shipments/:shipmentId/status` | Mise à jour de statut (admin). |
| POST | `/api/shipments/:shipmentId/history` | Ajout d'évènement (admin). |
| DELETE | `/api/shipments/:shipmentId` | Suppression (admin). |
| GET | `/api/tracking/:trackingCode` | Recherche publique par code de suivi. |

## Pricing & typologies

| Méthode | Path | Notes |
| --- | --- | --- |
| GET | `/api/pricing` | Liste paginée (admin). |
| GET | `/api/pricing/:id` | Détail d'une grille (admin). |
| POST | `/api/pricing` | Création (admin). |
| PUT | `/api/pricing/:id` | Mise à jour (admin). |
| DELETE | `/api/pricing/:id` | Suppression (admin). |
| GET | `/api/pricing/routes` | Couples origine/destination + transportType (public). |
| GET | `/api/pricing/locations` | Origines/destinations distinctes (public). |
| GET | `/api/package-types` | Liste des gabarits. |
| POST | `/api/package-types` | Création d'un gabarit (admin). |
| PUT | `/api/package-types/:id` | Mise à jour (admin). |
| DELETE | `/api/package-types/:id` | Suppression (admin). |

## Expéditions, lanes et embarquements

| Méthode | Path | Notes |
| --- | --- | --- |
| GET | `/api/expeditions/transport-lines` | Liste paginée des lignes (admin). |
| GET | `/api/expeditions/transport-lines/meta` | Origines → destinations actives (admin). |
| POST | `/api/expeditions/transport-lines` | Création de ligne (admin). |
| GET | `/api/expeditions/transport-lines/:id` | Détail ligne (admin). |
| PUT | `/api/expeditions/transport-lines/:id` | Mise à jour (admin). |
| DELETE | `/api/expeditions/transport-lines/:id` | Désactivation (admin). |
| GET | `/api/expeditions` | Liste paginée des expéditions (admin). |
| POST | `/api/expeditions` | Création d'expédition (admin). |
| GET | `/api/expeditions/:id` | Détail (admin). |
| PUT | `/api/expeditions/:id` | Mise à jour (admin). |

Routes logistique étendues (admin) :

- `/api/admin/countries` : CRUD pays opérés.
- `/api/admin/expedition-lines` : CRUD de lignes (structure historique).
- `/api/admin/embarkments` : CRUD des fenêtres d'embarquement liées aux lignes.

## Market points & adresses

| Méthode | Path | Notes |
| --- | --- | --- |
| GET | `/api/admin/market-points` | Liste des points marché (admin). |
| POST | `/api/admin/market-points` | Création (admin). |
| PATCH | `/api/admin/market-points/:id` | Mise à jour (admin). |
| DELETE | `/api/admin/market-points/:id` | Suppression (admin). |
| GET | `/api/addresses` | Carnet d'adresses (utilisateur connecté). |
| POST | `/api/addresses` | Création d'adresse (auth). |
| GET | `/api/addresses/:id` | Détail. |
| PUT | `/api/addresses/:id` | Mise à jour. |
| DELETE | `/api/addresses/:id` | Suppression. |

## Paiements diaPay (backend diaPay Admin)

| Méthode | Path | Notes |
| --- | --- | --- |
| GET | `/payments` | Liste paginée. |
| GET | `/payments/summary` | Agrégats globaux. |
| GET | `/payments/:id` | Détail paiement. |
| GET | `/payments/:id/events` | Timeline. |
| GET | `/notifications/jobs` | Jobs de notifications. |
| GET | `/notifications/jobs/:jobId` | Détail d'un job. |
| GET/POST/PATCH/DELETE | `/api-keys` & `/api-keys/:keyId` | Gestion des clés API diaPay. |
| GET/POST/PATCH/DELETE | `/users` & `/users/:userId` | Gestion des admins diaPay. |

Chaque service `src/services/api/*.ts` doit cibler ces chemins via `apiFetch` en injectant le header Bearer admin lorsque requis.
