# Diaexpress Client – UI Harmonization Notes

## Pages harmonisées

Les pages publiques suivantes ont été alignées sur le thème du PublicDashboard :

- `/` (landing Diaexpress : `DiaexpressLanding` et toutes ses sections composantes)
- `/quote-request` (demande de devis et formulaires associés)
- `/track-shipment` (suivi public des expéditions)
- `/public-dashboard/reservation` (hérite déjà du thème partagé)

Les composants de la landing (`HeroSection`, `BannerSection`, `FeaturesSection`, `ServicesSection`, `LocationSection`, `WhyChooseUsSection`, `TransportOptionsSection`, `TestimonialsSection`, `ContactSection`, `Search`) utilisent désormais les utilitaires globaux et les animations Framer Motion pour des transitions douces.

## Ajouter une nouvelle page publique

1. **Importer le thème** : assurez-vous que `../src/styles/diaexpress-theme.css` est chargé (c’est déjà le cas dans `_app.js`).
2. **Structure de base** : enveloppez votre contenu principal dans une balise avec la classe `diaexpress-page`, et utilisez `dx-section` + `dx-container` pour chaque section principale.
3. **Mise en page** : composez vos listes en utilisant `dx-grid` (ex. `grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))`). Appliquez `dx-card` sur chaque carte ou panneau de contenu et ajoutez `dx-shadow-hover` pour une élévation au survol.
4. **Formulaires** : associez systématiquement `dx-label` et `dx-input` / `dx-select`. Pour les actions, choisissez `btn-dx-primary`, `btn-dx-secondary` ou `btn-dx-ghost`.
5. **Animations** : pour des apparitions fluides, importez `motion` (et éventuellement `AnimatePresence`) depuis `framer-motion` et appliquez le motif `initial={{ opacity: 0, y: 12 }}` / `animate={{ opacity: 1, y: 0 }}` / `exit={{ opacity: 0, y: -12 }}` avec `transition={{ duration: 0.22 }}` sur vos sections.
6. **Couleurs** : utilisez exclusivement les variables `--dx-*` (voir `diaexpress-theme.css`) pour fonds, textes et accents. Évitez tout code couleur en dur hors blanc pur.
7. **Accessibilité** : fournissez toujours des labels clairs, une hiérarchie de titres cohérente et un contraste suffisant. Les icônes décoratives doivent avoir `aria-hidden="true"` si elles ne portent pas d’information.

## Conventions UI clés

- **Arrière-plan** : gradient léger (`diaexpress-page`) et sections alternées (`sectionAlt`, `sectionMuted`).
- **Cartes** : `dx-card` (fond blanc, bordure subtile, ombre profonde). Les CTA sont des boutons pilules via `btn-dx-*`.
- **Typographie** : titres gras (`font-weight: 700`), textes secondaires en `var(--dx-text-muted)` et largeurs de paragraphe contenues (< 70 ch) pour lisibilité.
- **Grilles responsives** : utilisez `dx-grid` + `gap` et `minmax` pour éviter tout positionnement absolu.
- **Animations** : transitions Framer Motion sur chaque section ou bloc interactif pour donner du rythme sans perturber la logique métier.

En suivant ces règles, toute nouvelle page restera cohérente avec l’expérience du PublicDashboard et réutilisera la bibliothèque de styles partagée.
