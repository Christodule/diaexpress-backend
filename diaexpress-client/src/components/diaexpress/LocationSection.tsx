import React from 'react';
import { motion } from 'framer-motion';
import styles from './DiaexpressLanding.module.css';

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.22 },
};

const hubs = [
  {
    title: 'Hubs européens',
    description:
      'Paris, Bruxelles et Barcelone avec consolidation quotidienne et départs express.',
    tag: 'Europe',
  },
  {
    title: 'Plateformes africaines',
    description:
      'Abidjan, Dakar et Cotonou pour une distribution last-mile rapide et maîtrisée.',
    tag: 'Afrique',
  },
  {
    title: 'Réseau global',
    description:
      'Partenaires certifiés en Amérique du Nord et Moyen-Orient pour vos flux internationaux.',
    tag: 'Worldwide',
  },
];

const LocationSection: React.FC = () => (
  <motion.section {...fadeInUp} className={`dx-section ${styles.sectionMuted}`}>
    <div className="dx-container">
      <div className={styles.sectionHeader}>
        <span className={styles.sectionEyebrow}>une présence internationale</span>
        <h2 className={styles.sectionTitle}>Un maillage pensé pour vos flux transcontinentaux</h2>
        <p className={styles.sectionSubtitle}>
          Nous opérons sur les corridors clés entre l’Europe et l’Afrique avec des
          équipes locales qui gèrent les formalités et assurent une expérience
          client transparente.
        </p>
      </div>
      <div className={`${styles.locationGrid} dx-grid`}>
        {hubs.map((hub) => (
          <article key={hub.title} className={`${styles.locationCard} dx-card`}>
            <span className={styles.locationTag}>{hub.tag}</span>
            <h3 className={styles.locationTitle}>{hub.title}</h3>
            <p className={styles.locationDescription}>{hub.description}</p>
          </article>
        ))}
      </div>
    </div>
  </motion.section>
);

export default LocationSection;
