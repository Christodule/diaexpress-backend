# Comparaison de l'API logistique DiaExpress avec les APIs FedEx et CMA CGM

## Couverture fonctionnelle

L'API DiaExpress expose des capacités de création, consultation et estimation de devis, avec un calcul hybride mêlant tarification interne et intégration CMA CGM via `getInternalQuote` et `getCmaCgmQuote`. 【F:controllers/quoteController.js†L79-L158】【F:controllers/quoteController.js†L233-L302】【F:services/cmaCgmService.js†L1-L120】

Les APIs FedEx et CMA CGM offrent nativement un périmètre plus large :

* **FedEx** propose, au-delà du pricing, la création d'étiquettes, le suivi, la gestion des retours et des outils de douane. Les endpoints sont segmentés par produit (Shipping, Tracking, Address Validation) et chaque réponse contient des codes d'état normalisés permettant un traitement automatique des erreurs.
* **CMA CGM** fournit des API publiques pour la cotation, les bookings, le suivi des conteneurs et la documentation transport. Elles imposent un schéma d'authentification OAuth strict, des quotas par application et des structures de réponses riches (références d'offre, transit time, conditions). DiaExpress réutilise une partie de cette richesse lorsqu'elle est disponible. 【F:services/cmaCgmService.js†L41-L115】

## Authentification et sécurité

DiaExpress repose désormais sur un service d'authentification interne (`DIAEXPRESS_AUTH_TOKENS`/`DIAEXPRESS_AUTH_CLIENTS`) pour sécuriser ses routes de devis et restreindre l'accès aux administrateurs lorsque nécessaire. 【F:controllers/quoteController.js†L12-L158】【F:config/diaexpressAuth.js†L1-L64】 Les APIs FedEx et CMA CGM imposent quant à elles des authentifications OAuth client credentials ou API keys combinées à des niveaux d'autorisation par scope, ainsi que des signatures HMAC sur certaines opérations sensibles (shipments, cancelations). Cela leur permet de tracer finement l'usage partenaire et de révoquer des permissions par fonction.

## Expérience développeur

* **Gestion des environnements** : l'API DiaExpress lit ses paramètres CMA CGM depuis des variables d'environnement, mais conserve des valeurs par défaut sandbox et ne publie pas encore de fichiers d'exemple globaux. 【F:config/cmaCgm.js†L1-L30】 FedEx/CMA CGM fournissent des portails développeurs avec gestion d'applications, clés distinctes par environnement et dashboards de monitoring.
* **Normalisation des réponses** : DiaExpress agrège les devis issus de multiples sources mais ne renvoie pas encore d'identifiants communs, de codes d'erreur internes ni de pagination pour la consultation admin. 【F:controllers/quoteController.js†L200-L246】 Les APIs FedEx/CMA CGM appliquent des standards de codification (par ex. `severity`, `code`, `message`) facilitant l'automatisation.

## Améliorations proposées

1. **Étendre la normalisation multi-transporteurs** : exposer un schéma commun (`provider`, `quoteId`, `currency`, `serviceLevel`, `transitTime`) et ajouter des codes d'erreur structurés. Cela rapprocherait l'expérience de FedEx Rate API qui fournit des `serviceType` et `transitTime` systématiques. 【F:services/cmaCgmService.js†L53-L109】
2. **Renforcer l'authentification des intégrations partenaires** : compléter les Bearer tokens actuels par une rotation automatique et, si besoin, des signatures HMAC pour les appels machine-to-machine, à l'image des portails développeurs FedEx/CMA CGM. 【F:controllers/quoteController.js†L12-L158】
3. **Introduire des webhooks et la gestion asynchrone** : proposer des notifications (statut de devis, confirmation transporteur) pour se rapprocher des événements FedEx (status notifications) et CMA CGM (booking updates). Les contrôleurs pourraient publier des événements vers un bus interne lors des changements de statut. 【F:controllers/quoteController.js†L200-L246】
4. **Documenter et tester les cas limites** : ajouter une documentation officielle (OpenAPI/Swagger) et des tests couvrant l'ensemble des transporteurs pour offrir une DX comparable aux portails FedEx/CMA CGM.
5. **Supporter des opérations aval (booking, tracking)** : étendre l'API avec des endpoints de réservation et de suivi, alignés sur ceux disponibles chez FedEx (Shipment Create/Track) et CMA CGM (Booking, Tracking), afin de couvrir le cycle logistique complet.

