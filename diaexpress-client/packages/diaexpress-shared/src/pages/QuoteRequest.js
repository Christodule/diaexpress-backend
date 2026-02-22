import React from 'react';
import QuoteWizard from '../components/quote/QuoteWizard';
import styles from './QuoteRequest.module.css';

const QuoteRequest = ({ initialOrigins = [] } = {}) => {
  return (
    <div className={styles.quoteRequestPage}>
      <div className={styles.pageGlow} aria-hidden="true" />
      <div className={styles.pageContent}>
        <section className={styles.hero}>
          <span className={styles.heroBadge}>Devis express en 4 étapes</span>
          <h1 className={styles.heroTitle}>Planifiez votre expédition en toute confiance</h1>
          <p className={styles.heroSubtitle}>
            Visualisez chaque étape de votre chaîne logistique, comparez les meilleures options de
            transport et confirmez votre demande en quelques clics.
          </p>
        </section>

        <div className={styles.wizardShell}>
          <div className={styles.quoteWizard}>
            <QuoteWizard initialOrigins={initialOrigins} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteRequest;
