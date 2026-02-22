import React from 'react';
import { motion } from 'framer-motion';
import styles from './DiaexpressLanding.module.css';

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.22 },
};

const services = [
  {
    title: 'Express aérien',
    description:
      'Des départs quotidiens pour vos colis urgents, avec suivi complet et dédouanement prioritaire.',
  },
  {
    title: 'Fret maritime & conteneurs',
    description:
      'Solutions FCL et LCL avec consolidation optimisée et contrôle qualité à chaque étape.',
  },
  {
    title: 'Distribution du dernier kilomètre',
    description:
      'Livraison finale réalisée par des partenaires locaux certifiés pour garantir la satisfaction.',
  },
  {
    title: 'Solutions e-commerce',
    description:
      'Connecteurs API, gestion des retours et emballage adapté pour vos boutiques en ligne.',
  },
  {
    title: 'Services douaniers',
    description:
      'Accompagnement sur les formalités import/export et suivi documentaire proactif.',
  },
  {
    title: 'Stockage & fulfilment',
    description:
      'Préparation de commande, gestion de stock et options de cross-docking dans nos hubs.',
  },
];

const ServicesSection: React.FC = () => (
  <motion.section {...fadeInUp} className="dx-section">
    <div className="dx-container">
      <div className={styles.sectionHeader}>
        <span className={styles.sectionEyebrow}>des solutions modulaires</span>
        <h2 className={styles.sectionTitle}>Des services conçus pour accompagner votre croissance</h2>
        <p className={styles.sectionSubtitle}>
          Combinez nos offres de transport, d’entreposage et de pilotage opérationnel pour
          construire une supply chain sur-mesure.
        </p>
      </div>
      <div className={`${styles.servicesGrid} dx-grid`}>
        {services.map((service) => (
          <article key={service.title} className={`${styles.serviceCard} dx-card`}>
            <h3 className={styles.serviceTitle}>{service.title}</h3>
            <p className={styles.serviceDescription}>{service.description}</p>
          </article>
        ))}
      </div>
    </div>
  </motion.section>
);

export default ServicesSection;
