import React from 'react';
import { motion } from 'framer-motion';
import styles from './DiaexpressLanding.module.css';

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.22 },
};

const BannerSection: React.FC = () => (
  <motion.section {...fadeInUp} className="dx-section">
    <div className="dx-container">
      <div className={`${styles.banner} dx-grid`}>
        <div className={`${styles.bannerCard} dx-card`}>
          <p className={styles.bannerHighlight}>+25 000</p>
          <p className={styles.bannerDescription}>
            Expéditions assurées chaque année pour des e-commerçants, PME et
            logisticiens internationaux.
          </p>
          <div className={`${styles.bannerRow} ${styles.bannerPillRow}`}>
            <span className="dx-pill">Tracking temps réel</span>
            <span className="dx-pill">Réseau multi-continents</span>
            <span className="dx-pill">Assistance 7j/7</span>
          </div>
        </div>
        <div className={`${styles.bannerCard} dx-card`}>
          <p className={styles.bannerHighlight}>98%</p>
          <p className={styles.bannerDescription}>
            Taux de satisfaction client grâce à notre visibilité sur les statuts,
            nos délais maîtrisés et nos équipes locales.
          </p>
          <div className={`${styles.bannerRow} ${styles.bannerPillRow}`}>
            <span className="dx-pill">Support multilingue</span>
            <span className="dx-pill">Contrats flexibles</span>
            <span className="dx-pill">Équipe dédiée</span>
          </div>
        </div>
        <div className={`${styles.bannerCard} dx-card`}>
          <p className={styles.bannerHighlight}>72h</p>
          <p className={styles.bannerDescription}>
            Pour relier Paris à Abidjan grâce à nos liaisons express aériennes
            et notre dédouanement accéléré.
          </p>
          <div className={`${styles.bannerRow} ${styles.bannerPillRow}`}>
            <span className="dx-pill">Dernier kilomètre optimisé</span>
            <span className="dx-pill">Suivi proactif</span>
            <span className="dx-pill">Hub certifié</span>
          </div>
        </div>
      </div>
    </div>
  </motion.section>
);

export default BannerSection;
