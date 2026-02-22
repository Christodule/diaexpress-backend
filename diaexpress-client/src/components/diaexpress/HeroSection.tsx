import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Search from './Search';
import ArrowRight from './ArrowRight';
import styles from './DiaexpressLanding.module.css';

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.22 },
};

const HeroSection: React.FC = () => (
  <motion.section {...fadeInUp} className={`dx-section ${styles.heroSection}`}>
    <div className="dx-container">
      <div className={styles.heroInner}>
        <div className={styles.heroContent}>
          <span className={styles.heroTagline}>logistique &amp; messagerie premium</span>
          <h1 className={styles.heroTitle}>
            Des livraisons rapides, fiables et suivies de bout en bout
          </h1>
          <p className={styles.heroSubtitle}>
            Diaexpress simplifie le transport de vos colis, du devis à la livraison.
            Suivez chaque étape en temps réel et bénéficiez de notre réseau
            international de partenaires pour livrer en Europe et en Afrique.
          </p>
          <div className={styles.heroActions}>
            <Link href="/quote-request" className="btn-dx btn-dx-primary">
              Demander un devis
              <ArrowRight width={18} height={18} />
            </Link>
            <Link href="/public-dashboard/reservation" className="btn-dx btn-dx-ghost">
              Réserver un transport
            </Link>
          </div>
          <Search />
        </div>
        <div className={`${styles.heroIllustration} dx-card dx-shadow-hover`}>
          <div className={styles.heroCardStack}>
            <div className={styles.heroCard}>
              <div className={styles.heroCardHeader}>
                <span className={styles.heroCardTitle}>Suivi colis #DX-47218</span>
                <span className={styles.heroCardStatus}>En transit</span>
              </div>
              <div className={styles.heroCardTimeline}>
                <div className={styles.heroTimelineItem}>
                  <span className={styles.heroTimelineMarker} />
                  <div className={styles.heroTimelineContent}>
                    <p className={styles.heroTimelineLabel}>Collecte à Paris</p>
                    <p className={styles.heroTimelineDate}>12 janv. · 08:24</p>
                  </div>
                </div>
                <div className={styles.heroTimelineItem}>
                  <span className={styles.heroTimelineMarker} />
                  <div className={styles.heroTimelineContent}>
                    <p className={styles.heroTimelineLabel}>Départ hub logistique</p>
                    <p className={styles.heroTimelineDate}>13 janv. · 11:02</p>
                  </div>
                </div>
                <div className={styles.heroTimelineItem}>
                  <span className={styles.heroTimelineMarker} />
                  <div className={styles.heroTimelineContent}>
                    <p className={styles.heroTimelineLabel}>En transit maritime</p>
                    <p className={styles.heroTimelineDate}>14 janv. · 18:45</p>
                  </div>
                </div>
              </div>
              <div className={styles.heroCardFooter}>
                <span>Livraison estimée : 21 janv.</span>
                <Link href="/track-shipment">Détails du suivi</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.section>
);

export default HeroSection;
