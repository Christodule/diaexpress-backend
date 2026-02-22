# DiaExpress Admin v2

DiaExpress Admin v2 est une console Next.js 14 (App Router) qui fédère la supervision logistique et diaPay.

## Démarrage

```bash
cd apps/diaexpress-adminv2
npm install
npm run dev
```

## Variables d'environnement principales

| Variable | Description | Exemple |
| --- | --- | --- |
| `NEXT_PUBLIC_LOGISTICS_API_BASE_URL` | Backend logistique Express | `http://localhost:4000` |
| `NEXT_PUBLIC_DIAPAY_ADMIN_API_BASE_URL` | API diaPay Admin | `http://localhost:4001/v1/admin` |
| `NEXT_PUBLIC_ADMIN_BEARER_TOKEN` | Token admin (Bearer) à envoyer sur toutes les requêtes sécurisées | `super-secret-token` |

## Structure

- `app/admin` : routing admin (sidebar + header + pages).
- `components/` : UI partagée (layout, tables, formulaires, badges).
- `src/config` : configuration client/serveur (URL API, helpers HTTP).
- `src/services/api` : services typés (logistique + diaPay).
- `src/hooks` : hooks métier (`usePaginatedResource`, `useQuotes`, etc.).
- `tests/` : tests unitaires (Vitest + Testing Library).

### Cartographie pages → endpoints

- **Dashboard** `/admin` : agrégats logistiques (quotes, shipments) + paiements `GET /payments/summary` (diaPay Admin).
- **Devis** `/admin/quotes` :
  - Liste : `GET /api/quotes` (admin) ou `/api/admin/quotes` (legacy).
  - Estimation : `POST /api/quotes/estimate`.
  - Création : `POST /api/quotes`.
  - Actions : `POST /api/quotes/:id/confirm | reject | dispatch`, `PATCH /api/quotes/:id/status`, conversion via `POST /api/shipments/from-quote`.
  - Métadonnées : `GET /api/quotes/meta` (origins/destinations/packageTypes).
- **Expéditions** `/admin/expeditions` :
  - Lignes : `GET/POST/PUT/DELETE /api/expeditions/transport-lines` (+ `/meta`).
  - Expéditions : `GET/POST/PUT /api/expeditions`.
- **Pricing** `/admin/pricing` : `GET/POST/PUT/DELETE /api/pricing`, gabarits via `GET/POST/PUT/DELETE /api/package-types`.
- **Tracking** `/admin/tracking` : `GET /api/tracking/:code`.
- **Adresses** `/admin/addresses` : `GET/POST/PUT/DELETE /api/addresses`.
- **Paiements diaPay** `/admin/payments` : `GET /payments`, `GET /payments/:id`, `GET /payments/:id/events`, `GET /payments/summary` (base diaPay Admin).

### Entités logistiques structurantes

- **Countries & MarketPoints** : `GET/POST/PATCH/DELETE /api/admin/countries` et `/api/admin/market-points` (alimentent origins/destinations et pricing).
- **Embarkments** : `GET/POST/PATCH/DELETE /api/admin/embarkments` (fenêtres d'embarquement par ligne).

### Domaine "Fondations logistiques"

Cette itération ajoute les référentiels qui serviront de base aux futurs pricing et estimations :

- Countries → MarketPoint → Address
- MarketPoint → TransportLine → Embarkment

Les origines/destinations ne sont plus libres : les lignes d'expédition s'appuient sur des MarketPoints rattachés à un pays et les embarquements s'alignent sur ces lignes. Cette structure garantit la cohérence avant d'activer le pricing contextuel et l'usage dans les devis.

## Checklist UX

- Navigation fluide entre Dashboard, Devis, Shipments, Pricing, Users, Addresses, Payments, Jobs, API Keys et Tracking.
- Tables paginées + filtres sur chaque ressource.
- Loaders, états vides et erreurs surfacées par les composants UI.
- Pages détail (`/admin/quotes/[id]`, `/admin/shipments/[id]`, `/admin/payments/[id]`).
- Widgets cross-systèmes (agrégats logistiques + `GET /payments/summary`).

## Développement

- Utiliser `fetch` natif + helpers de `src/config/api.ts` pour toutes les requêtes.
- Gérer les erreurs via `ApiError` (message + status + payload).
- Typage strict à partir des modèles Mongoose existants (quotes, shipments, pricing, etc.).
- Ajouter vos composants UI dans `components/ui` pour garantir la cohérence visuelle.

## Tests

```bash
npm run lint
npm run test
```

Pour corriger les erreurs de cache/hot-reload sous Windows ou après une 500 liée à `.next/`, utiliser :

```bash
npm run dev:clean
```

Vitest est configuré pour fonctionner avec React Testing Library (`renderHook`) afin de tester les hooks de données.
