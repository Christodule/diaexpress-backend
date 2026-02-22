import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import BannerSection from './BannerSection';
import ContactSection from './ContactSection';
import FeaturesSection from './FeaturesSection';
import HeroSection from './HeroSection';
import LocationSection from './LocationSection';
import ServicesSection from './ServicesSection';
import TestimonialsSection from './TestimonialsSection';
import TransportOptionsSection from './TransportOptionsSection';
import WhyChooseUsSection from './WhyChooseUsSection';
import styles from './DiaexpressLanding.module.css';

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.22 },
};

const DiaexpressLanding: React.FC = () => (
  <motion.main {...fadeInUp} className={`diaexpress-page ${styles.diaexpressLanding}`}>
    <AnimatePresence mode="wait">
      <motion.div key="landing-content" {...fadeInUp}>
        <HeroSection />
        <BannerSection />
        <LocationSection />
        <FeaturesSection />
        <ServicesSection />
        <WhyChooseUsSection />
        <TransportOptionsSection />
        <TestimonialsSection />
        <ContactSection />
      </motion.div>
    </AnimatePresence>
  </motion.main>
);

export default DiaexpressLanding;
