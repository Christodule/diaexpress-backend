import React from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import ArrowRight from './ArrowRight';
import styles from './DiaexpressLanding.module.css';

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.22 },
};

const Search: React.FC = () => {
  const router = useRouter();
  const [trackingCode, setTrackingCode] = React.useState('');
  const [isNavigating, setIsNavigating] = React.useState(false);

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = trackingCode.trim();
      if (!trimmed) {
        return;
      }
      setIsNavigating(true);
      void router.push({
        pathname: '/track-shipment',
        query: { code: trimmed },
      });
    },
    [router, trackingCode]
  );

  return (
    <motion.div {...fadeInUp} className={styles.searchWrapper}>
      <motion.form className={styles.searchForm} onSubmit={handleSubmit} {...fadeInUp}>
        <input
          type="text"
          className={`dx-input ${styles.searchInput}`}
          placeholder="Entrez votre numéro de suivi"
          value={trackingCode}
          onChange={(event) => setTrackingCode(event.target.value)}
          aria-label="Numéro de suivi Diaexpress"
          disabled={isNavigating}
        />
        <button
          type="submit"
          className={`btn-dx-primary ${styles.searchSubmit}`}
          disabled={isNavigating}
        >
          {isNavigating ? 'Redirection…' : 'Suivre mon colis'}
          <ArrowRight width={18} height={18} />
        </button>
      </motion.form>
      <p className={styles.searchHelper}>
        Vous serez redirigé vers l’espace de suivi détaillé.
      </p>
    </motion.div>
  );
};

export default Search;
