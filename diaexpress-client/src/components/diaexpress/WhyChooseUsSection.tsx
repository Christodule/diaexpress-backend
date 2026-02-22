import React from 'react';
import { motion } from 'framer-motion';
import styles from './DiaexpressLanding.module.css';

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.22 },
};

const reasons = [
  {
    title: 'Visibilité intégrale',
    description:
      'Nos outils donnent accès aux événements clés, notifications proactives et preuves de livraison.',
  },
  {
    title: 'Experts métiers',
    description:
      'Des équipes spécialisées par filière (retail, santé, industrie) pour accompagner chaque étape.',
  },
  {
    title: 'Approche responsable',
    description:
      'Optimisation des flux, mutualisation des tournées et reporting CO₂ disponibles sur demande.',
  },
];

const bullets = [
  'Pilotage centralisé multi-sites',
  'SLA contractuels et suivi par nos équipes',
  'Intégration API & webhooks pour vos systèmes',
  'Assurance cargo incluse au besoin',
  'Support client 7j/7 en français et en anglais',
  'Tableaux de bord personnalisés',
];

const WhyChooseUsSection: React.FC = () => (
  <motion.section {...fadeInUp} className="dx-section">
    <div className="dx-container">
      <div className={styles.sectionHeader}>
        <span className={styles.sectionEyebrow}>pourquoi choisir diaexpress</span>
        <h2 className={styles.sectionTitle}>Une équipe engagée sur vos performances logistiques</h2>
        <p className={styles.sectionSubtitle}>
          Nous combinons expertise terrain, outils digitaux et accompagnement
          humain pour sécuriser vos opérations internationales.
        </p>
      </div>
      <div className={`${styles.servicesGrid} dx-grid`}>
        {reasons.map((reason) => (
          <article key={reason.title} className={`${styles.serviceCard} dx-card`}>
            <h3 className={styles.serviceTitle}>{reason.title}</h3>
            <p className={styles.serviceDescription}>{reason.description}</p>
          </article>
        ))}
      </div>
      <div className={`${styles.benefitsList} dx-grid`}>
        {bullets.map((bullet) => (
          <div key={bullet} className={styles.benefitItem}>
            <span className={styles.benefitIcon}>✓</span>
            <span>{bullet}</span>
          </div>
        ))}
      </div>
    </div>
  </motion.section>
);

export default WhyChooseUsSection;
