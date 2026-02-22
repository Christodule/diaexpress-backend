# API Contract Map — DiaExpress Admin v2

Base URLs utilisées :

- **Logistics API** : `NEXT_PUBLIC_API_BASE_URL` (fallback `NEXT_PUBLIC_ADMIN_API_BASE_URL`, `NEXT_PUBLIC_LOGISTICS_API_BASE_URL`)
- **DiaPay Admin API** : `NEXT_PUBLIC_DIAPAY_ADMIN_API_BASE_URL`

> Status: **OK** signifie que l’appel est aligné avec la route backend et le payload attendu.

## Quotes

| Feature / Page | Adminv2 Call | Backend Route (confirmée) | Auth (rôle) | Payload request/response | Status |
| --- | --- | --- | --- | --- | --- |
| Quotes list | `GET /api/quotes` | `/api/quotes` | Bearer (admin) | Response: `{ quotes?: Quote[] }` ou `Quote[]` | OK |
| Quote detail | `GET /api/quotes/:id` | `/api/quotes/:id` | Bearer (admin) | Response: `Quote` | OK |
| Quote meta | `GET /api/quotes/meta` | `/api/quotes/meta` | Public | Response: `{ origins, marketPoints? }` | OK |
| Estimate quote | `POST /api/quotes/estimate` | `/api/quotes/estimate` (alias `/estimateQuote`) | Public | Body: quote params; Response: `{ quotes? }` ou `{ estimate }` | OK |
| Create quote | `POST /api/quotes` | `/api/quotes` | Optional | Body: `CreateQuotePayload`; Response: `{ quote }` | OK |
| Confirm quote | `POST /api/quotes/:id/confirm` | `/api/quotes/:id/confirm` | Bearer (admin) | Body: `{ finalPrice?, currency? }` | OK |
| Reject quote | `POST /api/quotes/:id/reject` | `/api/quotes/:id/reject` | Bearer (admin) | Body: `{ reason? }` | OK |
| Update quote | `PATCH /api/quotes/:id` | `/api/quotes/:id` | Bearer (admin) | Body: `Partial<Quote>` | OK |
| Convert quote → shipment | `POST /api/shipments/from-quote` | `/api/shipments/from-quote` | Bearer (admin) | Body: `{ quoteId }` | OK |

## Shipments & Tracking

| Feature / Page | Adminv2 Call | Backend Route (confirmée) | Auth (rôle) | Payload request/response | Status |
| --- | --- | --- | --- | --- | --- |
| Shipments list | `GET /api/shipments?status&provider` | `/api/shipments` | Bearer (admin) | Response: `{ shipments: Shipment[] }` | OK |
| Shipment detail | `GET /api/shipments/:id` | `/api/shipments/:shipmentId` | Bearer (admin) | Response: `{ shipment }` | OK |
| Update shipment status | `PATCH /api/shipments/:id/status` | `/api/shipments/:shipmentId/status` | Bearer (admin) | Body: `{ status?, location?, note? }` | OK |
| Add shipment history | `POST /api/shipments/:id/history` | `/api/shipments/:shipmentId/history` | Bearer (admin) | Body: `{ status?, location?, note? }` | OK |
| Assign embarkment | `PATCH /api/shipments/:id/assign-embarkment` | `/api/shipments/:shipmentId/assign-embarkment` | Bearer (admin) | Body: `{ embarkmentId }` | OK |
| Tracking search | `GET /api/tracking/:trackingCode` | `/api/tracking/:trackingCode` | Optional | Response: `{ shipment?, status?, events? }` | OK |

## Pricing & Package Types

| Feature / Page | Adminv2 Call | Backend Route (confirmée) | Auth (rôle) | Payload request/response | Status |
| --- | --- | --- | --- | --- | --- |
| Pricing list | `GET /api/pricing` | `/api/pricing` | Bearer (admin) | Response: `Pricing[]` | OK |
| Pricing create | `POST /api/pricing` | `/api/pricing` | Bearer (admin) | Body: `Pricing` (transportPrices, lanes) | OK |
| Pricing update | `PUT /api/pricing/:id` | `/api/pricing/:id` | Bearer (admin) | Body: `Pricing` | OK |
| Pricing meta | `GET /api/pricing/meta` | `/api/pricing/meta` | Bearer (admin) | Response: `{ origins, destinations, lanes, packageTypes }` | OK |
| Package types list | `GET /api/package-types` | `/api/package-types` | Public | Response: `{ packageTypes }` | OK |
| Package types create | `POST /api/package-types` | `/api/package-types` | Bearer (admin) | Body: `{ name, description, allowedTransportTypes }` | OK |
| Package types update | `PUT /api/package-types/:id` | `/api/package-types/:id` | Bearer (admin) | Body: `{ name, description, allowedTransportTypes }` | OK |

## Expeditions / Transport Lines / Embarkments

| Feature / Page | Adminv2 Call | Backend Route (confirmée) | Auth (rôle) | Payload request/response | Status |
| --- | --- | --- | --- | --- | --- |
| Transport lines list | `GET /api/expeditions/transport-lines` | `/api/expeditions/transport-lines` | Bearer (admin) | Response: `{ items, total, page, pageSize }` | OK |
| Transport lines meta | `GET /api/expeditions/transport-lines/meta` | `/api/expeditions/transport-lines/meta` | Bearer (admin) | Response: `{ origins }` | OK |
| Transport line detail | `GET /api/expeditions/transport-lines/:id` | `/api/expeditions/transport-lines/:id` | Bearer (admin) | Response: `TransportLine` | OK |
| Transport line create | `POST /api/expeditions/transport-lines` | `/api/expeditions/transport-lines` | Bearer (admin) | Body: `TransportLine` | OK |
| Transport line update | `PUT /api/expeditions/transport-lines/:id` | `/api/expeditions/transport-lines/:id` | Bearer (admin) | Body: `TransportLine` | OK |
| Transport line delete | `DELETE /api/expeditions/transport-lines/:id` | `/api/expeditions/transport-lines/:id` | Bearer (admin) | Soft delete | OK |
| Expeditions list | `GET /api/expeditions` | `/api/expeditions` | Bearer (admin) | Response: `{ items, total, page, pageSize }` | OK |
| Expedition detail | `GET /api/expeditions/:id` | `/api/expeditions/:id` | Bearer (admin) | Response: `Expedition` | OK |
| Expedition create | `POST /api/expeditions` | `/api/expeditions` | Bearer (admin) | Body: `Expedition` | OK |
| Expedition update | `PUT /api/expeditions/:id` | `/api/expeditions/:id` | Bearer (admin) | Body: `Expedition` | OK |
| Embarkments list | `GET /api/admin/embarkments` | `/api/admin/embarkments` | Bearer (admin) | Response: `{ items, total, page, pageSize }` | OK |
| Embarkments CRUD | `POST/PATCH/DELETE /api/admin/embarkments/:id` | `/api/admin/embarkments/:id` | Bearer (admin) | Body: `Embarkment` | OK |

## Market Points / Countries / Admin Addresses

| Feature / Page | Adminv2 Call | Backend Route (confirmée) | Auth (rôle) | Payload request/response | Status |
| --- | --- | --- | --- | --- | --- |
| Countries list | `GET /api/admin/countries` | `/api/admin/countries` | Bearer (admin) | Response: `{ items, total, page, pageSize }` | OK |
| Countries CRUD | `POST/PATCH/DELETE /api/admin/countries/:id` | `/api/admin/countries/:id` | Bearer (admin) | Body: `Country` | OK |
| Market points list | `GET /api/admin/market-points` | `/api/admin/market-points` | Bearer (admin) | Response: `{ items, total, page, pageSize }` | OK |
| Market points CRUD | `POST/PATCH/DELETE /api/admin/market-points/:id` | `/api/admin/market-points/:id` | Bearer (admin) | Body: `MarketPoint` | OK |
| Admin addresses list | `GET /api/admin/addresses` | `/api/admin/addresses` | Bearer (admin) | Response: `{ items, total, page, pageSize }` | OK |
| Admin addresses CRUD | `POST/PATCH/DELETE /api/admin/addresses/:id` | `/api/admin/addresses/:id` | Bearer (admin) | Body: `AdminAddress` | OK |

## Users (admin)

| Feature / Page | Adminv2 Call | Backend Route (confirmée) | Auth (rôle) | Payload request/response | Status |
| --- | --- | --- | --- | --- | --- |
| Admin users list | `GET /api/admin/users` | `/api/admin/users` (legacy `/api/v1/admin/users`) | Bearer (admin) | Response: `{ data, pagination }` | OK |
| Admin user update | `PATCH /api/admin/users/:id` | `/api/admin/users/:userId` | Bearer (admin) | Body: `{ role?, username? }` | OK |

## DiaPay Admin (base `NEXT_PUBLIC_DIAPAY_ADMIN_API_BASE_URL`)

| Feature / Page | Adminv2 Call | Backend Route (confirmée) | Auth (rôle) | Payload request/response | Status |
| --- | --- | --- | --- | --- | --- |
| Payments list | `GET /payments` | `/api/v1/admin/payments` | Bearer (admin) | Response: `{ items, total, page, pageSize }` | OK |
| Payment detail | `GET /payments/:id` | `/api/v1/admin/payments/:paymentId` | Bearer (admin) | Response: `Payment` | OK |
| Payment events | `GET /payments/:id/events` | `/api/v1/admin/payments/:paymentId/events` | Bearer (admin) | Response: `{ events }` | OK |
| Summary | `GET /payments/summary` | `/api/v1/admin/payments/summary` | Bearer (admin) | Response: `PaymentSummary` | OK |
| Notification jobs | `GET /notifications/jobs` | `/api/v1/admin/notifications/jobs` | Bearer (admin) | Response: `{ jobs }` | OK |
| Api keys | `GET/POST/PATCH/DELETE /api-keys` | `/api/v1/admin/api-keys` | Bearer (admin) | Response: `{ keys }` | OK |
| Admin users | `GET /users` | `/api/v1/admin/users` | Bearer (admin) | Response: `{ users }` | OK |

## API Health (dev-only)

| Feature / Page | Adminv2 Call | Backend Route (confirmée) | Auth (rôle) | Payload request/response | Status |
| --- | --- | --- | --- | --- | --- |
| Health check | `GET /api/health` → fallback `GET /api/v1/public/services` | `/api/v1/public/services` | Public | Response: `{ services }` | OK |
