import React from 'react';
import { motion } from 'framer-motion';
import styles from './DiaexpressLanding.module.css';

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.22 },
};

const options = [
  {
    title: 'Express aérien',
    description:
      'Idéal pour vos colis urgents jusqu’à 500kg avec livraison en 24-72h selon la destination.',
    tag: 'Rapidité',
  },
  {
    title: 'Groupage maritime',
    description:
      'Solution économique pour consolider vos palettes et réduire les coûts logistiques.',
    tag: 'Optimisation',
  },
  {
    title: 'Fret routier & distribution',
    description:
      'Réseau de transporteurs pour assurer le premier et dernier kilomètre en toute fiabilité.',
    tag: 'Flexibilité',
  },
];

const TransportOptionsSection: React.FC = () => (
  <motion.section {...fadeInUp} className={`dx-section ${styles.sectionMuted}`}>
    <div className="dx-container">
      <div className={styles.sectionHeader}>
        <span className={styles.sectionEyebrow}>transport multimodal</span>
        <h2 className={styles.sectionTitle}>Choisissez le mode qui correspond à vos enjeux</h2>
        <p className={styles.sectionSubtitle}>
          Nos experts vous accompagnent pour sélectionner le mode le plus pertinent selon
          vos délais, volumes et budget tout en sécurisant vos marchandises.
        </p>
      </div>
      <div className={`${styles.transportCards} dx-grid`}>
        {options.map((option) => (
          <article key={option.title} className={`${styles.transportCard} dx-card`}>
            <div className={styles.transportCardContent}>
              <span className={styles.transportTag}>{option.tag}</span>
              <h3 className={styles.transportTitle}>{option.title}</h3>
              <p className={styles.transportDescription}>{option.description}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  </motion.section>
);

export default TransportOptionsSection;
