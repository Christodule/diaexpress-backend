import React from 'react';
import Link from 'next/link';
import { useSafeUser } from '@diaexpress/shared/auth/useSafeClerk';
import { motion } from 'framer-motion';
import { ClipboardList, FileText, Package, Ship, Truck } from 'lucide-react';
import ChevronRight from './ChevronRight';
import styles from './DiaexpressLanding.module.css';

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.22 },
};

const baseFeatures = [
  {
    title: 'Demander un devis',
    description: 'Obtenez une estimation détaillée pour votre expédition en quelques clics.',
    href: '/quote-request',
    icon: <FileText size={24} />,
  },
  {
    title: 'Suivre un colis',
    description: 'Consultez les mises à jour de statut en temps réel grâce à notre tracking.',
    href: '/track-shipment',
    icon: <Truck size={24} />,
  },
  {
    title: 'Réserver un transport',
    description: 'Planifiez un conteneur ou une liaison maritime directement depuis la plateforme.',
    href: '/public-dashboard/reservation',
    icon: <Ship size={24} />,
  },
];

const authFeatures = [
  {
    title: 'Mes devis',
    description: 'Retrouvez vos demandes, leurs statuts et validez vos propositions en un clic.',
    href: '/quotes',
    icon: <ClipboardList size={24} />,
  },
  {
    title: 'Mes expéditions',
    description: 'Visualisez vos colis confirmés, les étapes franchies et les preuves de livraison.',
    href: '/shipments',
    icon: <Package size={24} />,
  },
];

const FeaturesSection: React.FC = () => {
  const { user } = useSafeUser();
  const features = React.useMemo(() => {
    const items = [...baseFeatures];
    if (user) {
      items.push(...authFeatures);
    }
    return items;
  }, [user]);

  return (
    <motion.section {...fadeInUp} className={`dx-section ${styles.sectionAlt}`}>
      <div className="dx-container">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>toutes vos actions en un seul endroit</span>
          <h2 className={styles.sectionTitle}>Un cockpit logistique pour vos équipes</h2>
          <p className={styles.sectionSubtitle}>
            Retrouver vos devis, suivre vos expéditions, réserver des capacités et
            piloter vos opérations ne devrait pas nécessiter plusieurs outils.
          </p>
        </div>
        <div className={`${styles.featureGrid} dx-grid`}>
          {features.map((feature) => (
            <Link key={feature.title} href={feature.href} className={`${styles.featureCard} dx-card dx-shadow-hover`}>
              <span className={styles.featureIcon}>{feature.icon}</span>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
              <span className={styles.featureLink}>
                Accéder
                <ChevronRight width={18} height={18} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default FeaturesSection;
