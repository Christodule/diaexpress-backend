// src/pages/PublicDashboard.js
import React from "react";
import Link from "next/link";
import { useSafeUser } from "../auth/useSafeClerk";
import { FileText, Truck, ClipboardList, Package, Anchor, Phone } from "lucide-react";
import styles from "../styles/PublicDashboard.module.css";

const PublicDashboard = () => {
  const { user } = useSafeUser();

  const heroStats = [
    { value: "250K+", label: "Colis livrés par an" },
    { value: "98%", label: "Satisfaction clients" },
    { value: "24/7", label: "Support opérationnel" },
  ];

  const baseFeatures = [
    {
      title: "Demander un devis",
      description: "Obtenez une estimation instantanée et sécurisée pour votre expédition.",
      icon: <FileText size={20} />,
      link: "/quote-request",
      accent: "#f97316",
      tint: "rgba(249, 115, 22, 0.16)",
    },
    {
      title: "Suivre un colis",
      description: "Renseignez votre numéro de suivi et visualisez chaque étape du parcours.",
      icon: <Truck size={20} />,
      link: "/track-shipment",
      accent: "#22c55e",
      tint: "rgba(34, 197, 94, 0.16)",
    },
    {
      title: "Réserver un conteneur",
      description: "Réservez en ligne une place sur nos prochains départs maritimes ou aériens.",
      icon: <Anchor size={20} />,
      link: "/public-dashboard/reservation",
      accent: "#0ea5e9",
      tint: "rgba(14, 165, 233, 0.16)",
    },
  ];

  const authenticatedFeatures = user
    ? [
        {
          title: "Mes devis",
          description: "Retrouvez vos demandes, leurs statuts et validez-les en un clic.",
          icon: <ClipboardList size={20} />,
          link: "/quotes",
          accent: "#facc15",
          tint: "rgba(250, 204, 21, 0.18)",
        },
        {
          title: "Mes envois",
          description: "Suivez l’avancement de vos colis confirmés et vos preuves de livraison.",
          icon: <Package size={20} />,
          link: "/shipments",
          accent: "#a855f7",
          tint: "rgba(168, 85, 247, 0.16)",
        },
      ]
    : [];

  const features = [...baseFeatures, ...authenticatedFeatures];

  return (
    <div className={styles.dashboard}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroIntro}>
            <span className={styles.heroEyebrow}>logistique internationale</span>
            <h1 className={styles.heroTitle}>
              Bienvenue sur la plateforme Diaexpress
            </h1>
            <p className={styles.heroDescription}>
              Simplifiez votre supply chain : devis rapides, réservations planifiées et
              suivi temps réel pour vos expéditions entre l’Europe et l’Afrique.
            </p>
            <div className={styles.heroActions}>
              <Link
                href="/quote-request"
                className={`${styles.heroButton} ${styles.heroButtonPrimary}`}
              >
                Commencer un devis
              </Link>
              <Link
                href="/track-shipment"
                className={`${styles.heroButton} ${styles.heroButtonSecondary}`}
              >
                Suivre un colis
              </Link>
            </div>
          </div>
          <aside className={styles.heroPanel}>
            <div className={styles.heroStats}>
              {heroStats.map((stat) => (
                <div key={stat.label} className={styles.heroStat}>
                  <span className={styles.heroStatValue}>{stat.value}</span>
                  <span className={styles.heroStatLabel}>{stat.label}</span>
                </div>
              ))}
            </div>
            <div className={styles.heroQuote}>
              « Nos équipes orchestrent chaque étape pour des livraisons
              fluides, quel que soit le volume expédié. »
              <span className={styles.heroQuoteAuthor}>
                Responsable opérations DIAEXPRESS
              </span>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>vos raccourcis métier</span>
          <h2 className={styles.sectionTitle}>
            Pilotez votre logistique en toute autonomie
          </h2>
          <p className={styles.sectionSubtitle}>
            Accédez aux outils essentiels pour préparer, suivre et optimiser vos
            opérations de transport international.
          </p>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.link}
              className={styles.featureCard}
              style={{ "--accent": feature.accent, "--accent-soft": feature.tint }}
            >
              <span className={styles.featureIcon}>{feature.icon}</span>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
              <span className={styles.featureLink}>
                Accéder au module
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.darkSection}`}>
        <div className={styles.ctaCard}>
          <div>
            <span className={styles.ctaBadge}>Support premium</span>
            <h2 className={styles.ctaTitle}>
              Besoin d’un accompagnement dédié pour vos expéditions ?
            </h2>
            <p className={styles.ctaDescription}>
              Nos experts vous conseillent sur la meilleure solution de transport,
              optimisent vos coûts et gèrent la documentation douanière.
            </p>
          </div>
          <div className={styles.ctaActions}>
            <Link href="tel:+2250102030405" className={styles.ctaButton}>
              <Phone size={18} /> +225 01 02 03 04 05
            </Link>
            <Link
              href="/public-dashboard/reservation"
              className={styles.ctaButton}
            >
              Planifier une réservation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PublicDashboard;

