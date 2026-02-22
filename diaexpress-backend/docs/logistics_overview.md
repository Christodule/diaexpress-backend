# DiaExpress – Vue d'ensemble du backend logistique

Cette synthèse détaille le fonctionnement de l'API logistique DiaExpress, les dépendances entre modules et les points d'intégration clés.

## 1. Architecture générale

- **Serveur Express** : `server.js` instancie Express, charge le middleware d'authentification maison (`middleware/auth`) puis configure CORS/logs avant de brancher l'ensemble des routes (`/api/quotes`, `/api/payments`, `/api/shipments`, `/api/v1/admin`, etc.). 【F:server.js†L1-L51】【F:middleware/auth.js†L1-L79】
- **Configuration applicative** : `config/appConfig.js` centralise ports, origines CORS, logging et paramètres d'intégrations (diaPay, CMA CGM, FedEx, clés partenaires) à partir de l'environnement. 【F:config/appConfig.js†L1-L51】
- **Connexion MongoDB** : la base est initialisée via `config/db` (voir README pour la configuration). 【F:README.md†L11-L38】
- **Organisation** : routes dans `routes/`, contrôleurs dans `controllers/`, logique métier dans `services/`, schémas Mongo dans `models/`, conformément au README racine. 【F:README.md†L24-L41】

## 2. Authentification et autorisations

- **DiaExpress Auth** : `middleware/auth.js` résout un Bearer token issu de la configuration (`DIAEXPRESS_AUTH_TOKENS`/`DIAEXPRESS_AUTH_CLIENTS`), alimente `req.identity` et applique `requireAuth`, `requireRole` ou `requireUserOrIntegrationKey` pour accepter respectivement un utilisateur authentifié ou une clé partenaire (`x-api-key`). 【F:middleware/auth.js†L1-L79】【F:config/diaexpressAuth.js†L1-L64】
- **Scopes d'accès** : la plupart des routes publiques (ex. estimation de devis) sont ouvertes, alors que la consultation/gestion nécessite `requireAuth` voire `requireRole('admin')`. 【F:routes/quotes.js†L9-L37】【F:routes/reservations.js†L7-L16】

## 3. Gestion des devis (`Quote`)

- **Création et lecture** : `controllers/quoteController.js` gère la création après validation du token DiaExpress, les lectures filtrées (par utilisateur ou admin) et la suppression. 【F:controllers/quoteController.js†L1-L175】【F:controllers/quoteController.js†L200-L236】
- **Estimation** : `estimateQuote` orchestre un appel interne (`services/pricingService.getInternalQuote`) et un appel CMA CGM (`services/cmaCgmService.getCmaCgmQuote`) puis retourne le meilleur tarif disponible. 【F:controllers/quoteController.js†L237-L296】【F:services/pricingService.js†L1-L65】【F:services/cmaCgmService.js†L1-L96】
- **Statuts & paiements** : le statut d'un devis s'aligne sur celui du paiement (pending/confirmed/rejected) via `updateQuoteStatus` ou le workflow de paiement. 【F:controllers/quoteController.js†L209-L236】【F:models/Quote.js†L24-L88】

## 4. Intégration pricing & partenaires

- **Pricing interne** : `services/pricingService.js` calcule un tarif selon des règles (package prédéfini, transport aérien par poids/dimensions, maritime par volume) puis renvoie le provider `internal`. 【F:services/pricingService.js†L1-L68】
- **CMA CGM** : `services/cmaCgmService.js` normalise la requête, gère un mode sandbox avec fixtures, implémente OAuth client credentials et nettoie la réponse (prix, devise, temps de transit, ID d'offre). 【F:services/cmaCgmService.js†L1-L167】
- **FedEx** : `services/fedexService.js` applique la même approche (OAuth, fixtures sandbox) pour la réservation et le tracking. 【F:services/fedexService.js†L1-L129】
- **Configuration** : `config/cmaCgm.js` et `config/fedex.js` (non listé ici) exposent URLs, timeouts, fixtures et bascule sandbox automatique si les credentials manquent. 【F:config/cmaCgm.js†L1-L47】

## 5. Réservations, expéditions et suivi

- **Réservations** : le contrôleur `reservationController` valide l'existence d'un tarif et attache les documents, avec séparation client/admin via les routes. 【F:controllers/reservationController†L1-L66】【F:routes/reservations.js†L7-L16】
- **Bookings transporteurs** : `controllers/bookingController.js` appelle `services/carrierIntegrationService.createCarrierBooking`, qui délègue à CMA CGM/FedEx ou génère un booking interne puis synchronise `Shipment` et `Quote`. 【F:controllers/bookingController.js†L1-L116】【F:services/carrierIntegrationService.js†L1-L102】
- **Expéditions** : `controllers/shipmentController.js` expose la création depuis un devis, la récupération (client/admin) et le suivi public via le tracking code. 【F:controllers/shipmentController.js†L1-L104】
- **Tracking** : `controllers/trackingController.js` interroge les transporteurs via `getCarrierTracking`, enregistre les événements et met à jour le statut livraison du devis. 【F:controllers/trackingController.js†L1-L104】【F:services/carrierIntegrationService.js†L103-L160】
- **Horaires** : `controllers/scheduleController.js` et `routes/Schedules.js` offrent la CRUD basique sur les departures/arrivals. 【F:controllers/scheduleController.js†L1-L26】

## 6. Paiements diaPay & crypto

- **Création** : `routes/payments.js` crée un paiement à partir d'un devis, assemble les métadonnées et appelle `services/diapayClient.createDiaExpressPayment`. Il stocke la réponse dans Mongo (`Payment`) et synchronise le statut avec le devis. 【F:routes/payments.js†L1-L154】【F:services/diapayClient.js†L1-L119】【F:models/Payment.js†L1-L61】
- **Workflows** : `services/paymentWorkflowService.js` centralise la mise à jour des statuts (success/failed/pending), récupère l'état diaPay, met à jour le devis et conserve l'historique `legacy`. 【F:services/paymentWorkflowService.js†L1-L155】【F:services/paymentWorkflowService.js†L200-L261】
- **Webhooks** : `/api/payments/callbacks/diapay` (dans `routes/payments.js`) traite les événements diaPay, déclenche les notifications utilisateur et appelle les helpers `confirmPaymentByRemoteId`, `failPaymentByRemoteId`, `syncPaymentStatusByRemoteId`. 【F:routes/payments.js†L155-L248】
- **Crypto custody** : une intégration `cryptoCustodyService` (non détaillée ici) est utilisée lorsque le provider vaut `crypto`, en complément des champs `onChain` du modèle `Payment`. 【F:routes/payments.js†L83-L142】【F:models/Payment.js†L23-L54】

## 7. Gestion des adresses & utilisateurs

- **Adresses** : `controllers/addressController.js` nettoie les payloads, valide les types, fusionne les entrepôts issus de `Pricing` et propose CRUD pour les utilisateurs authentifiés. 【F:controllers/addressController.js†L1-L109】
- **Utilisateurs & auth** : `routes/auth.js`/`controllers/authController.js` (non détaillés ici) pilotent l'inscription et la connexion, tandis que `routes/user.js` permet à l'admin de gérer les comptes.

## 8. Documentation existante

- Le README racine couvre les prérequis (MongoDB, DiaExpress Auth, diaPay), l'installation, les flux critiques (paiements diaPay, quotes, webhooks), l'observabilité et l'intégration CMA CGM sandbox. 【F:README.md†L1-L164】
- `docs/logistics_api_comparison.md` compare l'API DiaExpress à FedEx/CMA CGM et propose des améliorations (normalisation, authentification, webhooks, documentation). 【F:docs/logistics_api_comparison.md†L1-L49】

## 9. Checklist de prise en main

1. Configurer l'environnement (`.env`) selon le README : MongoDB, DiaExpress Auth, diaPay, CMA CGM/FedEx.
2. D démarrer l'API (`npm start`) et exécuter les clients Next.js (admin/marchand) si besoin.
3. Tester les flux critiques : `POST /api/quotes/estimate`, `POST /api/payments/create`, `POST /api/payments/callbacks/diapay`, `POST /api/bookings`.
4. Mapper les statuts devis ↔ paiements ↔ expéditions pour assurer la cohérence front/back.

Cette vue d'ensemble sert de support d'onboarding pour comprendre les responsabilités de chaque module backend.
