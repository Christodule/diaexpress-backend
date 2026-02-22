import React from 'react';
import { motion } from 'framer-motion';
import styles from './DiaexpressLanding.module.css';

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.22 },
};

const testimonials = [
  {
    quote:
      'Nous avons divisé par deux nos délais de livraison vers l’Afrique de l’Ouest. Les équipes Diaexpress sont à l’écoute et très réactives.',
    author: 'Sophie L.',
    role: 'COO · Marque retail',
  },
  {
    quote:
      'Le suivi en temps réel nous permet d’informer nos clients en amont. Le portail est simple et accessible à nos partenaires locaux.',
    author: 'Yao K.',
    role: 'Responsable logistique · Distributeur B2B',
  },
  {
    quote:
      'Nous avons connecté l’API Diaexpress à notre ERP pour automatiser les demandes de devis et le suivi. Un vrai gain de productivité.',
    author: 'Benjamin R.',
    role: 'CTO · Plateforme e-commerce',
  },
];

const TestimonialsSection: React.FC = () => (
  <motion.section {...fadeInUp} className="dx-section">
    <div className="dx-container">
      <div className={styles.sectionHeader}>
        <span className={styles.sectionEyebrow}>ils nous font confiance</span>
        <h2 className={styles.sectionTitle}>Des clients satisfaits sur toute la chaîne logistique</h2>
        <p className={styles.sectionSubtitle}>
          Du e-commerce aux industriels, Diaexpress accompagne des acteurs qui
          recherchent transparence, fiabilité et une expérience client soignée.
        </p>
      </div>
      <div className={`${styles.testimonialGrid} dx-grid`}>
        {testimonials.map((testimonial) => (
          <blockquote key={testimonial.author} className={`${styles.testimonialCard} dx-card`}>
            <p className={styles.testimonialQuote}>“{testimonial.quote}”</p>
            <div className={styles.testimonialAuthor}>
              <strong>{testimonial.author}</strong>
              <span>{testimonial.role}</span>
            </div>
          </blockquote>
        ))}
      </div>
    </div>
  </motion.section>
);

export default TestimonialsSection;
