import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ArrowRight from './ArrowRight';
import styles from './DiaexpressLanding.module.css';

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.22 },
};

const ContactSection: React.FC = () => (
  <motion.section {...fadeInUp} className="dx-section">
    <div className="dx-container">
      <div className={`${styles.contactCard} dx-card dx-shadow-hover`}>
        <div className={styles.contactDetails}>
          <h2 className={styles.contactTitle}>Prêt à accélérer vos expéditions ?</h2>
          <p className={styles.contactSubtitle}>
            Parlez-nous de vos besoins logistiques et obtenez une estimation sur mesure en moins de 24h.
            Nos experts vous accompagnent de l’enlèvement à la livraison finale.
          </p>
          <div className={styles.contactActions}>
            <Link href="/quote-request" className={`btn-dx-primary ${styles.contactAction}`}>
              Demander un devis
              <ArrowRight width={18} height={18} />
            </Link>
            <a href="mailto:contact@diaexpress.com" className={`btn-dx-secondary ${styles.contactAction}`}>
              contact@diaexpress.com
            </a>
          </div>
        </div>
        <div className={styles.contactDetails}>
          <h3 className={styles.serviceTitle}>Nos équipes</h3>
          <p className={styles.serviceDescription}>
            • Support client : +33 1 84 60 90 20
            <br />• Commercial : sales@diaexpress.com
            <br />• Partenaires transport : partners@diaexpress.com
          </p>
        </div>
      </div>
    </div>
  </motion.section>
);

export default ContactSection;
